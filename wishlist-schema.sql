-- ============================================
-- Adventure Wishlist Database Schema for Supabase
-- Cross-device sync for family trip planning
-- ============================================
-- Copy and paste this entire code into your Supabase SQL Editor and click "Run"

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL CHECK (status IN ('Planning', 'Researching', 'Ready', 'Booked')),
    estimated_cost INTEGER DEFAULT 500,
    best_seasons TEXT[] DEFAULT ARRAY['Summer'],
    duration TEXT DEFAULT '3-4 days',
    category TEXT NOT NULL CHECK (category IN ('Mountain', 'Coast', 'City', 'Island', 'Castle', 'Nature', 'Activity')),
    family_votes INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    target_date DATE NULL,
    researched BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON wishlist_items(priority);
CREATE INDEX IF NOT EXISTS idx_wishlist_status ON wishlist_items(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_category ON wishlist_items(category);
CREATE INDEX IF NOT EXISTS idx_wishlist_votes ON wishlist_items(family_votes DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_created ON wishlist_items(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wishlist_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_wishlist_items_updated_at ON wishlist_items;
CREATE TRIGGER update_wishlist_items_updated_at
    BEFORE UPDATE ON wishlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_wishlist_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for family wishlist)
DROP POLICY IF EXISTS "Allow all operations on wishlist_items" ON wishlist_items;
CREATE POLICY "Allow all operations on wishlist_items" ON wishlist_items
    FOR ALL USING (true) WITH CHECK (true);

-- Insert sample wishlist data
INSERT INTO wishlist_items (title, location, description, priority, status, estimated_cost, best_seasons, duration, category, family_votes, notes, target_date, researched) VALUES 
('Isle of Skye Adventure', 'Isle of Skye, Scotland', 'Explore the dramatic landscapes, fairy pools, and ancient castles of Skye', 'High', 'Researching', 1200, ARRAY['Spring', 'Summer', 'Autumn'], '5-7 days', 'Island', 5, 'Need to book accommodation early. Check ferry times. Visit Fairy Pools and Old Man of Storr.', '2024-07-15', true),
('Ben Nevis Summit Challenge', 'Lochaber, Scotland', 'Conquer Scotland''s highest peak as a family adventure', 'High', 'Planning', 600, ARRAY['Summer'], '2-3 days', 'Mountain', 4, 'Need proper hiking gear. Check weather conditions. Book accommodation in Fort William.', NULL, false),
('Edinburgh Festival Fringe', 'Edinburgh, Scotland', 'Experience the world''s largest arts festival with family-friendly shows', 'Medium', 'Ready', 800, ARRAY['Summer'], '4-5 days', 'City', 3, 'Book shows in advance. Consider Royal Mile walking tour. Visit Edinburgh Castle.', '2024-08-10', true),
('Loch Ness & Highlands Tour', 'Scottish Highlands', 'Scenic drive through the Highlands with Loch Ness monster hunting', 'Medium', 'Planning', 900, ARRAY['Spring', 'Summer', 'Autumn'], '4-6 days', 'Nature', 4, 'Rent a car. Book Loch Ness cruise. Visit Urquhart Castle. Stop at whisky distillery.', NULL, false),
('Orkney Islands Exploration', 'Orkney, Scotland', 'Discover ancient history, stunning coastlines, and unique wildlife', 'Low', 'Researching', 1000, ARRAY['Summer'], '6-8 days', 'Island', 2, 'Ferry from mainland. Visit Skara Brae. Check puffin viewing seasons.', NULL, true);

-- Create view for wishlist statistics
CREATE OR REPLACE VIEW wishlist_stats AS
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN priority = 'High' THEN 1 END) as high_priority,
    COUNT(CASE WHEN priority = 'Medium' THEN 1 END) as medium_priority,
    COUNT(CASE WHEN priority = 'Low' THEN 1 END) as low_priority,
    COUNT(CASE WHEN status = 'Planning' THEN 1 END) as planning_items,
    COUNT(CASE WHEN status = 'Researching' THEN 1 END) as researching_items,
    COUNT(CASE WHEN status = 'Ready' THEN 1 END) as ready_items,
    COUNT(CASE WHEN status = 'Booked' THEN 1 END) as booked_items,
    COUNT(DISTINCT category) as total_categories,
    COALESCE(SUM(estimated_cost), 0) as total_budget,
    COALESCE(AVG(family_votes), 0) as average_votes,
    COALESCE(MAX(family_votes), 0) as highest_votes
FROM wishlist_items;

-- Grant permissions
GRANT ALL ON wishlist_items TO authenticated;
GRANT ALL ON wishlist_items TO anon;
GRANT SELECT ON wishlist_stats TO authenticated;
GRANT SELECT ON wishlist_stats TO anon;

-- Success message
SELECT 'Adventure Wishlist database schema created successfully! Cross-device sync enabled.' as status;
