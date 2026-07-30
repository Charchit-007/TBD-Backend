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
app.use(cors({
  origin: ['https://reddit-frontend-g6da.onrender.com',
     'http://localhost:5173']
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
  const result = await pool.query('SELECT NOW()');
  res.json({ time: result.rows[0] });
});

app.listen(PORT, () => {
  console.log(`Express server is running on http://localhost:${PORT}`);
});
