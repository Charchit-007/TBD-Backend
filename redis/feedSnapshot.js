import redis from './index.js';
import { GLOBAL_FEED_KEY, SNAPSHOT_TTL_SECONDS } from './feedConstants.js';

export function userFeedKey(userId) {
  return `feed:user:${userId}`;
}

/**
 * Copies the current global hot ranking into a per-user snapshot key,
 * with a TTL. This is the "freeze the ranking for this scroll session" step.
 *
 * ZRANGESTORE dest source min max BYSCORE  — copies a score-range of members
 * (here: all of them, -inf to +inf) from source ZSET into dest ZSET,
 * entirely inside Redis (no round-tripping data through Node).
 */
export async function createUserSnapshot(userId) {
  const key = userFeedKey(userId);
  await redis.call('ZRANGESTORE', key, GLOBAL_FEED_KEY, '-inf', '+inf', 'BYSCORE');
  await redis.expire(key, SNAPSHOT_TTL_SECONDS);
  return key;
}

/**
 * Reads a page of post_ids from a user's frozen snapshot.
 * cursor = combined_score of the last post seen (exclusive), or null for first page.
 * Returns { postIds, nextCursor } — nextCursor is null when there are no more pages.
 */
export async function getFeedPage(userId, cursor, limit) {
  const key = userFeedKey(userId);

  const max = cursor === null ? '+inf' : `(${cursor}`; // '(' = exclusive bound in Redis range syntax
  // ZREVRANGEBYSCORE key max min [WITHSCORES] LIMIT offset count
  const results = await redis.zrevrangebyscore(
    key,
    max,
    '-inf',
    'WITHSCORES',
    'LIMIT',
    0,
    limit
  );

  // results is a flat array: [member, score, member, score, ...]
  const postIds = [];
  let lastScore = null;
  for (let i = 0; i < results.length; i += 2) {
    postIds.push(results[i]);
    lastScore = results[i + 1];
  }

  const nextCursor = postIds.length === limit ? lastScore : null;
  return { postIds, nextCursor };
}

export async function snapshotExists(userId) {
  const key = userFeedKey(userId);
  const exists = await redis.exists(key);
  return exists === 1;
}