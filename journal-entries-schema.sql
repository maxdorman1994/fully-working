-- Create journal_entries table for adventure journal functionality
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    location TEXT NOT NULL,
    weather TEXT NOT NULL,
    mood TEXT NOT NULL,
    miles_traveled NUMERIC DEFAULT 0,
    parking TEXT DEFAULT '',
    dog_friendly BOOLEAN DEFAULT false,
    paid_activity BOOLEAN DEFAULT false,
    adult_tickets TEXT DEFAULT '',
    child_tickets TEXT DEFAULT '',
    other_tickets TEXT DEFAULT '',
    pet_notes TEXT DEFAULT '',
    tags TEXT[] DEFAULT '{}',
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries (date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_location ON journal_entries (location);
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags ON journal_entries USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries (created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In production, you might want to restrict this to authenticated users
DROP POLICY IF EXISTS "Allow all operations on journal_entries" ON journal_entries;
CREATE POLICY "Allow all operations on journal_entries" ON journal_entries
    FOR ALL USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at when row is modified
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_journal_entries_updated_at();

-- Insert some sample journal entries (optional)
INSERT INTO journal_entries (title, content, date, location, weather, mood, miles_traveled, dog_friendly, tags) VALUES
('First Highland Adventure', 'What an incredible start to our Scottish adventure! The family set off early morning with excitement filling the air. The Highland scenery was absolutely breathtaking.', '2024-06-15', 'Scottish Highlands', '☀️ Sunny', '😊 Excited', 120, true, ARRAY['highlands', 'family', 'adventure']),
('Loch Lomond Discovery', 'A magical day exploring the shores of Loch Lomond. The kids were amazed by the crystal-clear waters and we enjoyed a perfect picnic by the lake.', '2024-07-02', 'Loch Lomond', '⛅ Partly Cloudy', '😌 Peaceful', 85, true, ARRAY['loch', 'picnic', 'water', 'family']),
('Edinburgh Castle Exploration', 'Stepped back in time exploring the historic Edinburgh Castle. The views over the city were spectacular and the history was fascinating.', '2024-05-20', 'Edinburgh', '🌧️ Light Rain', '🤩 Amazed', 45, false, ARRAY['castle', 'history', 'edinburgh', 'culture'])
ON CONFLICT DO NOTHING;
