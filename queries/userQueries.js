import pool from '../db/index.js';

export const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1', //parameterized query to prevent SQL injection
    [email]
  );
  return result.rows[0];
};

export const findUserByUsername = async (username) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};

export const createUser = async (username, email, hashedPassword) => {
  const result = await pool.query(
    'InSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
    [username, email, hashedPassword]
  );
  return result.rows[0];
}
