import {
  createUserSnapshot,
  getFeedPage,
  snapshotExists,
} from '../redis/feedSnapshot.js';
import { getPostsByIds } from '../queries/postQueries.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function getFeed(req, res) {
  try {
    const userId = req.user.uid; // set by auth middleware
    const limit = Math.min(
      parseInt(req.query.limit, 10) || DEFAULT_LIMIT,
      MAX_LIMIT
    );
    const rawCursor = req.query.cursor;

    let cursor = null;

    if (!rawCursor) {
      // No cursor = a page-1 request, whether that's a first-ever load OR
      // the user hitting refresh. Always rebuild the snapshot here so page 1
      // reflects the CURRENT global feed — including brand new posts —
      // instead of reusing a stale snapshot from up to 20 minutes ago.
      await createUserSnapshot(userId);
      cursor = null;
    } else {
      // A cursor means the user is actively scrolling deeper into a session
      // that already started. Reuse the existing frozen snapshot so the
      // ranking doesn't shift under them mid-scroll (posts jumping between
      // pages). Only rebuild if the snapshot expired out from under them.
      const decoded = Buffer.from(rawCursor, 'base64').toString('utf-8');
      cursor = decoded;

      const hasSnapshot = await snapshotExists(userId);
      if (!hasSnapshot) {
        // Snapshot TTL'd out mid-scroll. We have to rebuild it, which does
        // reset the frozen ranking — a rare edge case (very long scroll
        // sessions) and an acceptable tradeoff vs. never refreshing at all.
        await createUserSnapshot(userId);
        cursor = null;
      }
    }

    const { postIds, nextCursor } = await getFeedPage(userId, cursor, limit);
    const posts = await getPostsByIds(postIds, userId);

    const encodedNextCursor = nextCursor
      ? Buffer.from(String(nextCursor)).toString('base64')
      : null;

    res.json({
      posts,
      next_cursor: encodedNextCursor,
    });
  } catch (err) {
    console.error('[getFeed] error:', err);
    res.status(500).json({ error: 'Failed to load feed' });
  }
}