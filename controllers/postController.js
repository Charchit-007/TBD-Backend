import { insertPost } from '../queries/postQueries.js';
import { fetchPosts } from '../queries/postQueries.js';

export const createPost = async (req, res) => {
  const { subreddit_id, title, description, image } = req.body;
  const creator_id = req.user.uid;
  const post_type = image ? 'image' : 'text';

  try {

    if (!subreddit_id || !title) {
      return res.status(422).json({ error: 'Title is required' });
    }

    // Step 2 - Create post
    const post = await insertPost(creator_id, subreddit_id, title, description, image, post_type);

    // Step 3 - Send response
    return res.status(201).json({ post });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const result = await fetchPosts();
    return res.status(200).json({ posts: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};