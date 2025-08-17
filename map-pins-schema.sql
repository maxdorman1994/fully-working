-- Create map_pins table for storing adventure map pins
CREATE TABLE IF NOT EXISTS map_pins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('adventure', 'photo', 'memory', 'wishlist')),
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on coordinates for spatial queries
CREATE INDEX IF NOT EXISTS idx_map_pins_coordinates ON map_pins (latitude, longitude);

-- Create an index on category for filtering
CREATE INDEX IF NOT EXISTS idx_map_pins_category ON map_pins (category);

-- Create an index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_map_pins_created_at ON map_pins (created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE map_pins ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now
-- In production, you might want to restrict this to authenticated users
CREATE POLICY "Allow all operations on map_pins" ON map_pins
    FOR ALL USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at when row is modified
CREATE TRIGGER update_map_pins_updated_at
    BEFORE UPDATE ON map_pins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO map_pins (latitude, longitude, title, description, category, date) VALUES
(56.8198, -5.1044, 'Ben Nevis Base', 'Started our epic climb to the highest peak in Scotland!', 'adventure', '2024-06-15'),
(57.1474, -2.0942, 'Cairngorms Photography', 'Amazing sunset shots with the whole family.', 'photo', '2024-07-02'),
(55.9533, -3.1883, 'Edinburgh Castle', 'Explored the historic castle with amazing city views.', 'memory', '2024-05-20')
ON CONFLICT DO NOTHING;
