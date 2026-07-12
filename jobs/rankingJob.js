import cron from 'node-cron';
import redis from '../redis/index.js';
import pool from '../db/index.js';
import { encodeCombinedScore } from '../redis/scoreEncoding.js';
import {
  getHotRankingForWindow,
  getHotRankingForOlderWindow,
  getHotRankingBeyondCutoff,
} from '../queries/rankingQueries.js';
import {
  GLOBAL_FEED_KEY,
  NEW_POST_WINDOW,
  OLD_POST_CUTOFF,
} from '../redis/feedConstants.js';

/**
 * Writes/updates ZSET entries for a batch of ranked posts.
 */
async function writeRankingsToRedis(rows) {
  if (rows.length === 0) return;

  const pipeline = redis.pipeline();
  for (const row of rows) {
    const combined = encodeCombinedScore(Number(row.hot_score), row.created_at);
    pipeline.zadd(GLOBAL_FEED_KEY, combined, row.post_id);
  }
  await pipeline.exec();
}

/**
 * Removes ONLY posts that no longer exist in Postgres (actually deleted
 * or unpublished) from the ZSET. This must never be driven by age alone —
 * age-based tiers below already cover every post's lifetime, so age-based
 * pruning would just delete live posts with nothing to replace them.
 */
async function pruneDeletedPosts() {
  const memberIds = await redis.zrange(GLOBAL_FEED_KEY, 0, -1);
  if (memberIds.length === 0) return;

  const { rows } = await pool.query(
    `SELECT id FROM posts WHERE id = ANY($1::int[])`,
    [memberIds]
  );
  const stillExist = new Set(rows.map((r) => String(r.id)));
  const toRemove = memberIds.filter((id) => !stillExist.has(String(id)));

  if (toRemove.length > 0) {
    await redis.zrem(GLOBAL_FEED_KEY, ...toRemove);
    console.log(`[ranking-job] pruned ${toRemove.length} deleted posts`);
  }
}

async function refreshNewPosts() {
  try {
    const rows = await getHotRankingForWindow(NEW_POST_WINDOW);
    await writeRankingsToRedis(rows);
    console.log(`[ranking-job] refreshed ${rows.length} new posts (<${NEW_POST_WINDOW})`);
  } catch (err) {
    console.error('[ranking-job] error refreshing new posts:', err);
  }
}

async function refreshOldPosts() {
  try {
    const rows = await getHotRankingForOlderWindow(NEW_POST_WINDOW, OLD_POST_CUTOFF);
    await writeRankingsToRedis(rows);
    console.log(`[ranking-job] refreshed ${rows.length} older posts (${NEW_POST_WINDOW}-${OLD_POST_CUTOFF})`);
  } catch (err) {
    console.error('[ranking-job] error refreshing old posts:', err);
  }
}

/**
 * NEW TIER: posts beyond OLD_POST_CUTOFF still get ranked and kept visible,
 * just refreshed far less often since their scores move slowly.
 * This is what guarantees the feed never goes empty just because nothing
 * new has posted recently.
 */
async function refreshArchivePosts() {
  try {
    const rows = await getHotRankingBeyondCutoff(OLD_POST_CUTOFF);
    await writeRankingsToRedis(rows);
    console.log(`[ranking-job] refreshed ${rows.length} archive posts (>${OLD_POST_CUTOFF})`);
  } catch (err) {
    console.error('[ranking-job] error refreshing archive posts:', err);
  }
}

export function startRankingJobs() {
  // Every 1 minute: recompute posts younger than 6 hours (most volatile scores)
  cron.schedule('* * * * *', refreshNewPosts);

  // Every 10 minutes: recompute posts between 6 hours and 5 days old
  cron.schedule('*/10 * * * *', refreshOldPosts);

  // Every hour: recompute posts older than 5 days, so old posts remain
  // visible (just deprioritized) instead of disappearing when no new
  // posts exist.
  cron.schedule('0 * * * *', refreshArchivePosts);

  // Once daily: clean up posts that were actually deleted from the DB.
  // Never tied to age — age is fully covered by the three tiers above.
  cron.schedule('0 3 * * *', pruneDeletedPosts);

  console.log('[ranking-job] scheduled: new 1m / older 10m / archive 1h / prune-deleted daily');

  // Run all three ranking tiers once immediately on startup so the feed
  // isn't empty while waiting for the first cron tick.
  refreshNewPosts();
  refreshOldPosts();
  refreshArchivePosts();
}