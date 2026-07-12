-- Up Migration
-- This represents the initial schema that was created manually.
-- Marked as already run (baseline).

CREATE TABLE users (
  uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subreddits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(uid),
  name VARCHAR(21) UNIQUE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(uid),
  subreddit_id UUID REFERENCES subreddits(id),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(uid),
  post_id UUID REFERENCES posts(id),
  parent_comment_id UUID REFERENCES comments(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (1, -1)),
  UNIQUE (post_id, user_id)
);

CREATE TABLE comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (1, -1)),
  UNIQUE (comment_id, user_id)
);