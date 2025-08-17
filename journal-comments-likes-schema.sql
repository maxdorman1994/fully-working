-- Create comments table for journal entries
CREATE TABLE IF NOT EXISTS journal_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    visitor_name TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table for journal entries
CREATE TABLE IF NOT EXISTS journal_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    visitor_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate likes from same visitor
    UNIQUE(journal_entry_id, visitor_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_comments_entry_id ON journal_comments (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_created_at ON journal_comments (created_at);
CREATE INDEX IF NOT EXISTS idx_journal_likes_entry_id ON journal_likes (journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_likes_visitor ON journal_likes (visitor_name);

-- Enable Row Level Security (RLS)
ALTER TABLE journal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_likes ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (public commenting/liking)
DROP POLICY IF EXISTS "Allow all operations on journal_comments" ON journal_comments;
CREATE POLICY "Allow all operations on journal_comments" ON journal_comments
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on journal_likes" ON journal_likes;
CREATE POLICY "Allow all operations on journal_likes" ON journal_likes
    FOR ALL USING (true);

-- Create view to get comment and like counts for journal entries
CREATE OR REPLACE VIEW journal_entry_stats AS
SELECT 
    je.id,
    je.title,
    je.created_at,
    COALESCE(c.comment_count, 0) as comment_count,
    COALESCE(l.like_count, 0) as like_count
FROM journal_entries je
LEFT JOIN (
    SELECT journal_entry_id, COUNT(*) as comment_count
    FROM journal_comments
    GROUP BY journal_entry_id
) c ON je.id = c.journal_entry_id
LEFT JOIN (
    SELECT journal_entry_id, COUNT(*) as like_count
    FROM journal_likes
    GROUP BY journal_entry_id
) l ON je.id = l.journal_entry_id;

-- Insert some sample comments and likes (optional)
INSERT INTO journal_comments (journal_entry_id, visitor_name, comment_text) 
SELECT 
    je.id,
    'Grandma Anne',
    'What a wonderful adventure! The photos are absolutely beautiful. So proud of you all exploring Scotland together! 💕'
FROM journal_entries je 
WHERE je.title = 'First Highland Adventure'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO journal_comments (journal_entry_id, visitor_name, comment_text) 
SELECT 
    je.id,
    'Uncle Rob',
    'Looks like perfect weather for your trip! That view of Loch Lomond is stunning. Can''t wait to hear about your next adventure! 🏔️'
FROM journal_entries je 
WHERE je.title = 'Loch Lomond Discovery'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO journal_likes (journal_entry_id, visitor_name) 
SELECT 
    je.id,
    'Grandma Anne'
FROM journal_entries je 
WHERE je.title IN ('First Highland Adventure', 'Loch Lomond Discovery', 'Edinburgh Castle Exploration')
ON CONFLICT DO NOTHING;

INSERT INTO journal_likes (journal_entry_id, visitor_name) 
SELECT 
    je.id,
    'Uncle Rob'
FROM journal_entries je 
WHERE je.title IN ('First Highland Adventure', 'Edinburgh Castle Exploration')
ON CONFLICT DO NOTHING;
