import pool from '../db/index.js';

export const insertSubreddit = async (creator_id, name, category) => {
  const result = await pool.query(
    'INSERT INTO subreddits (creator_id, name, category) VALUES ($1, $2, $3) RETURNING *',
    [creator_id, name, category]
  );
  return result.rows[0]; //rows[0] instead of rows because it return array [ {} ]
};

export const findSubreddit = async (name) => {
  const result = await pool.query(
    'SELECT * FROM subreddits WHERE name = $1',
    [name]
  );
  return result.rows[0];
};

export const findAllSubreddits = async () => {
  const result = await pool.query('SELECT * FROM subreddits');
  return result.rows;
};