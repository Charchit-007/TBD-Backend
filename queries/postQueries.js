import pool from '../db/index.js';

export const insertPost = async (creator_id, subreddit_id, title, description, image, post_type) => {
  const result = await pool.query(
    'InSERT INTO posts (creator_id, subreddit_id, title, description, image, post_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [creator_id, subreddit_id, title, description, image, post_type]
  );
  return result.rows[0];
}

export const fetchPosts = async (userId = null) => {
  const result = await pool.query(`
    SELECT 
      posts.*,
      users.username,
      subreddits.name AS subreddit_name,
      COALESCE((SELECT SUM(value) FROM post_votes WHERE post_id = posts.id), 0)::int AS votes,
      (SELECT COUNT(*) FROM comments WHERE post_id = posts.id)::int AS comments,
      ${userId ? `COALESCE((SELECT value FROM post_votes WHERE post_id = posts.id AND user_id = $1), 0)::int` : '0'} AS user_vote
    FROM posts
    JOIN users ON posts.creator_id = users.uid
    JOIN subreddits ON posts.subreddit_id = subreddits.id
    ORDER BY posts.created_at DESC
  `, userId ? [userId] : []);
  return result.rows;
};

export const getPostsByIds = async (postIds, userId = null) => {
  if (postIds.length === 0) return [];

  const sql = `
    SELECT
      p.id,
      p.title,
      p.description,
      p.image,
      p.post_type,
      p.created_at,
      u.uid AS creator_id,
      u.username,
      s.id AS subreddit_id,
      s.name AS subreddit_name,
      COALESCE((SELECT SUM(value) FROM post_votes WHERE post_id = p.id), 0)::int AS votes,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id)::int AS comments,
      ${userId ? `COALESCE((SELECT value FROM post_votes WHERE post_id = p.id AND user_id = $2), 0)::int` : '0'} AS user_vote
    FROM posts p
    JOIN users u ON u.uid = p.creator_id
    JOIN subreddits s ON s.id = p.subreddit_id
    WHERE p.id = ANY($1::uuid[])
  `;
  const params = userId ? [postIds, userId] : [postIds];
  const { rows } = await pool.query(sql, params);

  const byId = new Map(rows.map((row) => [row.id, row]));
  return postIds.map((id) => byId.get(id)).filter(Boolean); // filter(Boolean) drops any deleted posts
}
