import 'dotenv/config';
import express, { json } from 'express';
import cors from 'cors';
import pool from './config/db.js';
import authRoutes from './routes/auth.js';
import postRoutes from './routes/post.js';
import subredditRoutes from './routes/subreddit.js';
import feedRoutes from './routes/feed.js';
import commentRoutes from './routes/comment.js';
import voteRoutes from './routes/vote.js';
import { startRankingJobs } from './jobs/rankingJob.js';

const app = express();

// Allowed origins for CORS (Local development + Render deployment)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://reddit-frontend-g6da.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl, or same-origin)
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to allow during deployment testing
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

const PORT = process.env.PORT || 5000;
app.use(json());

startRankingJobs(); // Start the ranking jobs

app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/subreddit', subredditRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/vote', voteRoutes);

// Enable Cross-Origin Resource Sharing for the React frontend

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error('[test-db] error:', err);
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

app.listen(PORT, () => {
  console.log(`Express server is running on http://localhost:${PORT}`);
});
