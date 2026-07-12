ALTER TABLE posts 
ADD COLUMN post_type VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'link'));