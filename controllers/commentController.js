import { insertComment, fetchCommentsByPostId } from '../queries/commentQueries.js';

export const createComment = async (req, res) => {
  const { post_id, parent_comment_id, body } = req.body;
  const user_id = req.user.uid;

  try {
    if (!post_id || !body) {
      return res.status(422).json({ error: 'Post ID and body are required' });
    }

    const comment = await insertComment(user_id, post_id, parent_comment_id || null, body);
    
    const commentWithUser = {
      ...comment,
      username: req.user.username
    };

    return res.status(201).json({ comment: commentWithUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getComments = async (req, res) => {
  const { postId } = req.params;

  try {
    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }
    const result = await fetchCommentsByPostId(postId);
    return res.status(200).json({ comments: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
