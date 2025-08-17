-- Supabase Database Schema for "A Wee Adventure" Journal
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT NOT NULL,
    weather TEXT NOT NULL,
    mood TEXT NOT NULL,
    miles_traveled INTEGER DEFAULT 0,
    parking TEXT DEFAULT '',
    dog_friendly BOOLEAN DEFAULT false,
    paid_activity BOOLEAN DEFAULT false,
    adult_tickets TEXT DEFAULT '',
    child_tickets TEXT DEFAULT '',
    other_tickets TEXT DEFAULT '',
    pet_notes TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}', -- Array of Cloudflare R2 URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_location ON journal_entries(location);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later)
-- For family journal, you might want to allow all family members to read/write
CREATE POLICY "Allow all operations on journal_entries" ON journal_entries
    FOR ALL USING (true) WITH CHECK (true);

-- Optional: Create a view for journal statistics
CREATE OR REPLACE VIEW journal_stats AS
SELECT 
    COUNT(*) as total_entries,
    COUNT(DISTINCT location) as total_places,
    COALESCE(SUM(array_length(photos, 1)), 0) as total_photos,
    COALESCE(array_length(array_agg(DISTINCT unnest_tags.tag), 1), 0) as total_tags,
    MIN(date) as first_entry_date,
    MAX(date) as latest_entry_date
FROM journal_entries
LEFT JOIN LATERAL unnest(tags) AS unnest_tags(tag) ON true;

-- Insert some sample data (optional - you can remove this after testing)
INSERT INTO journal_entries (
    title, content, date, location, weather, mood, miles_traveled, 
    parking, dog_friendly, paid_activity, adult_tickets, child_tickets, 
    other_tickets, pet_notes, tags, photos
) VALUES 
(
    'Ben Nevis Summit - Our Greatest Challenge Yet!',
    'What an incredible day! After months of training, we finally conquered Ben Nevis. The views from the summit were absolutely breathtaking - you could see for miles across the Scottish Highlands. Little Alex was such a trooper, and Bonnie loved every minute of it...',
    '2025-08-03',
    'Fort William, Highland',
    '☀️ Sunny',
    '🙏 Grateful',
    87,
    'Free',
    true,
    false,
    '',
    '',
    '',
    'Dogs allowed off-lead on mountain paths, keep on lead near car park',
    ARRAY['Mountain', 'Challenge', 'Family', 'Views', 'Achievement'],
    ARRAY['https://photos.example.com/ben-nevis-1.jpg', 'https://photos.example.com/ben-nevis-2.jpg']
),
(
    'Magical Loch Lomond Picnic',
    'A perfect family day by the beautiful Loch Lomond. We found the most amazing spot for our picnic with stunning views across the water. The kids (and Bonnie) had so much fun skipping stones and exploring the shoreline...',
    '2025-07-28',
    'Balloch, West Dunbartonshire',
    '⛅ Partly Cloudy',
    '😌 Peaceful',
    45,
    '£5',
    true,
    false,
    '',
    '',
    '',
    'Dogs welcome on beach and walking paths, water bowls available at visitor center',
    ARRAY['Lake', 'Family', 'Relaxing', 'Nature', 'Picnic'],
    ARRAY['https://photos.example.com/loch-lomond-1.jpg', 'https://photos.example.com/loch-lomond-2.jpg']
),
(
    'Edinburgh Castle - Step Back in Time',
    'Despite the Scottish drizzle, Edinburgh Castle was absolutely magical. The history here is incredible - you can really feel the centuries of stories within these ancient walls. The views over Edinburgh from the castle are spectacular...',
    '2025-07-15',
    'Edinburgh, Midlothian',
    '🌧️ Light Rain',
    '🤩 Amazed',
    123,
    '£12',
    false,
    true,
    '2 × £17.50',
    '1 × £10.50',
    '',
    '',
    ARRAY['History', 'Culture', 'City', 'Castle', 'Education'],
    ARRAY['https://photos.example.com/edinburgh-castle-1.jpg', 'https://photos.example.com/edinburgh-castle-2.jpg']
);

-- Create a function to search journal entries (for full-text search)
CREATE OR REPLACE FUNCTION search_journal_entries(search_query TEXT)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    date DATE,
    location TEXT,
    weather TEXT,
    mood TEXT,
    miles_traveled INTEGER,
    parking TEXT,
    dog_friendly BOOLEAN,
    paid_activity BOOLEAN,
    adult_tickets TEXT,
    child_tickets TEXT,
    other_tickets TEXT,
    pet_notes TEXT,
    tags TEXT[],
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        je.*,
        ts_rank(
            to_tsvector('english', je.title || ' ' || je.content || ' ' || je.location),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM journal_entries je
    WHERE to_tsvector('english', je.title || ' ' || je.content || ' ' || je.location) 
          @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC, je.date DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your security requirements)
GRANT ALL ON journal_entries TO authenticated;
GRANT ALL ON journal_entries TO anon;
GRANT SELECT ON journal_stats TO authenticated;
GRANT SELECT ON journal_stats TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Scottish Adventure Journal database schema created successfully! 🏴󠁧󠁢󠁳󠁣󠁴󠁿';
    RAISE NOTICE 'Tables: journal_entries';
    RAISE NOTICE 'Views: journal_stats';
    RAISE NOTICE 'Functions: search_journal_entries, update_updated_at_column';
    RAISE NOTICE 'Sample data: 3 journal entries inserted';
    RAISE NOTICE 'Ready for your adventure documentation!';
END $$;
