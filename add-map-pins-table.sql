-- ============================================
-- MAP PINS TABLE (ALREADY IN UNIVERSAL SCHEMA)
-- ============================================
-- NOTE: The map_pins table is already included in universal-database-schema.sql
-- You only need to run this if you missed it or want to add it separately

-- Create map_pins table for storing adventure map pins
CREATE TABLE IF NOT EXISTS map_pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL CHECK (category IN ('adventure', 'photo', 'memory', 'wishlist')),
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for map_pins
CREATE INDEX IF NOT EXISTS idx_map_pins_coordinates ON map_pins (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_map_pins_category ON map_pins (category);
CREATE INDEX IF NOT EXISTS idx_map_pins_created_at ON map_pins (created_at DESC);

-- Create trigger for map_pins (uses existing update_updated_at_column function)
DROP TRIGGER IF EXISTS update_map_pins_updated_at ON map_pins;
CREATE TRIGGER update_map_pins_updated_at
    BEFORE UPDATE ON map_pins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample map pins data
INSERT INTO map_pins (latitude, longitude, title, description, category, date) VALUES
(56.8198, -5.1044, 'Ben Nevis Base', 'Started our epic climb to the highest peak in Scotland!', 'adventure', '2024-06-15'),
(57.1474, -2.0942, 'Cairngorms Photography', 'Amazing sunset shots with the whole family.', 'photo', '2024-07-02'),
(55.9533, -3.1883, 'Edinburgh Castle', 'Explored the historic castle with amazing city views.', 'memory', '2024-05-20'),
(56.4966, -4.6042, 'Loch Lomond Wishlist', 'Want to camp here for a weekend with the family.', 'wishlist', NULL)
ON CONFLICT DO NOTHING;

-- Success message
SELECT '✅ Map pins table created successfully! The Map page now uses Hasura.' as result;
