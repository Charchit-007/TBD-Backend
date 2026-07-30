import { insertSubreddit, findSubreddit, findAllSubreddits } from '../queries/subredditQueries.js';

export const createSubreddit = async (req, res) => {
  const { name, category } = req.body;
  const creator_id = req.user.uid;

  try {
    // Step 1 - Validate input
    if (!name) {
      return res.status(422).json({ error: 'Subreddit name is required' });
    }
    if (!category) {
      return res.status(422).json({ error: 'Subreddit category is required' });
    }

    const existingSubreddit = await findSubreddit(name);

    if (existingSubreddit) {
      return res.status(409).json({ error: 'Subreddit name already in use' });
    }

    // Step 2 - Create subreddit
    const subreddit = await insertSubreddit(creator_id, name, category);

    // Step 3 - Send response
    return res.status(201).json({ subreddit });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSubreddits = async (req, res) => {
  try {
    const subreddits = await findAllSubreddits();
    return res.status(200).json({ subreddits });
  } catch (error) {
    console.error("Error in getSubreddits:", error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};