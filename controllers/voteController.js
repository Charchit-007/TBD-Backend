import { upsertPostVote, deletePostVote } from '../queries/voteQueries.js';

export const votePost = async (req, res) => {
  const { postId, value } = req.body;
  const userId = req.user.uid;

  try {
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    if (value === 0) {
      await deletePostVote(postId, userId);
      return res.status(200).json({ message: 'Vote removed' });
    } else if (value === 1 || value === -1) {
      const vote = await upsertPostVote(postId, userId, value);
      return res.status(200).json({ vote });
    } else {
      return res.status(400).json({ error: 'Invalid vote value' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
