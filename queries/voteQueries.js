import pool from '../db/index.js';

export const upsertPostVote = async (post_id, user_id, value) => {
  const result = await pool.query(
    `INSERT INTO post_votes (post_id, user_id, value)
     VALUES ($1, $2, $3)
     ON CONFLICT (post_id, user_id)
     DO UPDATE SET value = EXCLUDED.value
     RETURNING *`,
    [post_id, user_id, value]
  );
  return result.rows[0];
};

export const deletePostVote = async (post_id, user_id) => {
  const result = await pool.query(
    `DELETE FROM post_votes WHERE post_id = $1 AND user_id = $2 RETURNING *`,
    [post_id, user_id]
  );
  return result.rows[0];
};
