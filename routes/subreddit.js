import express from 'express';
import { createSubreddit, getSubreddits } from '../controllers/subredditController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createSubreddit);
router.get('/', getSubreddits);

export default router;