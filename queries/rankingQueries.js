import pool from '../db/index.js';

// NOTE: 1783339200 in the original file is 2026-09-01T00:00:00Z — a date
// in the FUTURE relative to any post created before then, which makes the
// recency term negative for all current posts. This anchor should be a
// fixed point in the PAST (e.g. your site's launch date, or any stable
// epoch) so the recency term is positive and increases as posts get newer.
// Swap in your actual launch timestamp here.
const SCORE_EPOCH_ANCHOR = 1735689600; // 2025-01-01T00:00:00Z — replace with your real anchor

const HOT_SCORE_EXPR = `
  SIGN(COALESCE(SUM(pv.value), 0)) *
  LOG(10, GREATEST(ABS(COALESCE(SUM(pv.value), 0)), 1))
  +
  (EXTRACT(EPOCH FROM p.created_at) - ${SCORE_EPOCH_ANCHOR}) / 45000.0
`;

const HOT_RANKING_SQL = `
  SELECT
    p.id AS post_id,
    p.created_at,
    COALESCE(SUM(CASE WHEN pv.value = 1 THEN 1 ELSE 0 END), 0) AS ups,
    COALESCE(SUM(CASE WHEN pv.value = -1 THEN 1 ELSE 0 END), 0) AS downs,
    (${HOT_SCORE_EXPR}) AS hot_score
  FROM posts p
  LEFT JOIN post_votes pv ON pv.post_id = p.id
  WHERE p.created_at >= NOW() - $1::interval
  GROUP BY p.id, p.created_at
`;

/**
 * Fetch hot-ranking data for posts within a given age window.
 * @param {string} interval - Postgres interval string, e.g. '6 hours', '5 days'
 */
export async function getHotRankingForWindow(interval) {
  const { rows } = await pool.query(HOT_RANKING_SQL, [interval]);
  return rows;
}

/**
 * Fetch hot-ranking data for posts strictly OLDER than a given age,
 * but within an outer cutoff.
 * @param {string} olderThan - e.g. '6 hours'
 * @param {string} upTo - e.g. '5 days'
 */
export async function getHotRankingForOlderWindow(olderThan, upTo) {
  const sql = `
    SELECT
      p.id AS post_id,
      p.created_at,
      COALESCE(SUM(CASE WHEN pv.value = 1 THEN 1 ELSE 0 END), 0) AS ups,
      COALESCE(SUM(CASE WHEN pv.value = -1 THEN 1 ELSE 0 END), 0) AS downs,
      (${HOT_SCORE_EXPR}) AS hot_score
    FROM posts p
    LEFT JOIN post_votes pv ON pv.post_id = p.id
    WHERE p.created_at < NOW() - $1::interval
      AND p.created_at >= NOW() - $2::interval
    GROUP BY p.id, p.created_at
  `;
  const { rows } = await pool.query(sql, [olderThan, upTo]);
  return rows;
}

/**
 * Fetch hot-ranking data for ALL posts older than the outer cutoff, with
 * no upper bound. This is what keeps posts visible in the feed indefinitely
 * instead of dropping out once they age past OLD_POST_CUTOFF.
 * Refresh this tier infrequently (e.g. hourly) since old posts' scores
 * move slowly.
 * @param {string} olderThan - e.g. '5 days'
 */
export async function getHotRankingBeyondCutoff(olderThan) {
  const sql = `
    SELECT
      p.id AS post_id,
      p.created_at,
      COALESCE(SUM(CASE WHEN pv.value = 1 THEN 1 ELSE 0 END), 0) AS ups,
      COALESCE(SUM(CASE WHEN pv.value = -1 THEN 1 ELSE 0 END), 0) AS downs,
      (${HOT_SCORE_EXPR}) AS hot_score
    FROM posts p
    LEFT JOIN post_votes pv ON pv.post_id = p.id
    WHERE p.created_at < NOW() - $1::interval
    GROUP BY p.id, p.created_at
  `;
  const { rows } = await pool.query(sql, [olderThan]);
  return rows;
}