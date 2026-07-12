import express from 'express';
import { votePost } from '../controllers/voteController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/post', authMiddleware, votePost);

export default router;
