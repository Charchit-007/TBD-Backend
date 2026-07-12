import pool from '../db/index.js';

export const insertComment = async (user_id, post_id, parent_comment_id, body) => {
  const result = await pool.query(
    'INSERT INTO comments (user_id, post_id, parent_comment_id, body) VALUES ($1, $2, $3, $4) RETURNING *',
    [user_id, post_id, parent_comment_id, body]
  );
  return result.rows[0];
};

export const fetchCommentsByPostId = async (post_id) => {
  const result = await pool.query(
    `SELECT comments.*, users.username 
     FROM comments 
     JOIN users ON comments.user_id = users.uid 
     WHERE comments.post_id = $1 
     ORDER BY comments.created_at ASC`,
    [post_id]
  );
  return result.rows;
};
