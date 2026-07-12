import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserByUsername, createUser } from '../queries/userQueries.js';

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Step 1 - Validate input
    if (!username || !email || !password) {
      return res.status(422).json({ error: 'All fields are required' });
    }

    // Step 2 - Check if user already exists
    const existingEmail = await findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const existingUsername = await findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Step 3 - Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 4 - Insert user
    const user = await createUser(username, email, hashedPassword);

    // Step 5 - Generate JWT
    const token = jwt.sign(
      { uid: user.uid, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 6 - Send response
    return res.status(201).json({ token, user: { uid: user.uid, username: user.username } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Step 1 - Validate input
    if (!email || !password) {
      return res.status(422).json({ error: 'Email and password are required' });
    }

    // Step 2 - Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Step 3 - Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Step 4 - Generate JWT
    const token = jwt.sign(
      { uid: user.uid, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Step 5 - Send response
    return res.status(200).json({ token, user: { uid: user.uid, username: user.username } });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default { register, login };