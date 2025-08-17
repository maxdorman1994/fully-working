-- ============================================
-- Castles and Lochs Tracking Database Schema for Supabase
-- 100 Famous Scottish Castles and 20 Spectacular Lochs
-- ============================================
-- Copy and paste this entire code into your Supabase SQL Editor and click "Run"

-- Create castles table
CREATE TABLE IF NOT EXISTS castles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Royal Castle', 'Historic Fortress', 'Clan Castle', 'Ruin', 'Palace')),
    built_century TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT NOT NULL,
    visiting_info TEXT NOT NULL,
    best_seasons TEXT[] NOT NULL,
    admission_fee TEXT DEFAULT 'Free',
    managed_by TEXT DEFAULT 'Historic Environment Scotland',
    accessibility TEXT DEFAULT 'Check individual castle details',
    rank INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lochs table
CREATE TABLE IF NOT EXISTS lochs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Freshwater Loch', 'Sea Loch', 'Tidal Loch')),
    length_km DECIMAL(6, 2),
    max_depth_m INTEGER,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT NOT NULL,
    activities TEXT[] NOT NULL,
    best_seasons TEXT[] NOT NULL,
    famous_for TEXT NOT NULL,
    nearest_town TEXT NOT NULL,
    rank INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create castle_visits table to track user progress
CREATE TABLE IF NOT EXISTS castle_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    castle_id TEXT NOT NULL REFERENCES castles(id) ON DELETE CASCADE,
    visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    photo_count INTEGER DEFAULT 0,
    weather_conditions TEXT DEFAULT '',
    visit_duration TEXT DEFAULT '',
    favorite_part TEXT DEFAULT '',
    would_recommend BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one visit record per castle (for family sharing)
    UNIQUE(castle_id)
);

-- Create loch_visits table to track user progress
CREATE TABLE IF NOT EXISTS loch_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loch_id TEXT NOT NULL REFERENCES lochs(id) ON DELETE CASCADE,
    visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    photo_count INTEGER DEFAULT 0,
    weather_conditions TEXT DEFAULT '',
    activities_done TEXT[] DEFAULT '{}',
    water_temperature TEXT DEFAULT '',
    wildlife_spotted TEXT[] DEFAULT '{}',
    would_recommend BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one visit record per loch (for family sharing)
    UNIQUE(loch_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_castles_region ON castles(region);
CREATE INDEX IF NOT EXISTS idx_castles_type ON castles(type);
CREATE INDEX IF NOT EXISTS idx_castles_century ON castles(built_century);
CREATE INDEX IF NOT EXISTS idx_castles_rank ON castles(rank);
CREATE INDEX IF NOT EXISTS idx_castles_custom ON castles(is_custom);

CREATE INDEX IF NOT EXISTS idx_lochs_region ON lochs(region);
CREATE INDEX IF NOT EXISTS idx_lochs_type ON lochs(type);
CREATE INDEX IF NOT EXISTS idx_lochs_rank ON lochs(rank);
CREATE INDEX IF NOT EXISTS idx_lochs_custom ON lochs(is_custom);

CREATE INDEX IF NOT EXISTS idx_castle_visits_date ON castle_visits(visited_date DESC);
CREATE INDEX IF NOT EXISTS idx_castle_visits_castle_id ON castle_visits(castle_id);

CREATE INDEX IF NOT EXISTS idx_loch_visits_date ON loch_visits(visited_date DESC);
CREATE INDEX IF NOT EXISTS idx_loch_visits_loch_id ON loch_visits(loch_id);

-- Create a view for castle visit statistics
CREATE OR REPLACE VIEW castle_visit_stats AS
SELECT 
    COUNT(cv.id) AS visited_count,
    (SELECT COUNT(*) FROM castles WHERE NOT is_custom) AS total_castles,
    ROUND((COUNT(cv.id)::numeric / NULLIF((SELECT COUNT(*) FROM castles WHERE NOT is_custom), 0)) * 100, 1) AS completion_percentage,
    COUNT(cv.id) FILTER (WHERE cv.photo_count > 0) AS castles_with_photos,
    SUM(cv.photo_count) AS total_photos,
    MIN(cv.visited_date) AS first_visit,
    MAX(cv.visited_date) AS latest_visit,
    COUNT(cv.id) FILTER (WHERE cv.would_recommend = true) AS recommended_count
FROM castle_visits cv;

-- Create a view for loch visit statistics  
CREATE OR REPLACE VIEW loch_visit_stats AS
SELECT 
    COUNT(lv.id) AS visited_count,
    (SELECT COUNT(*) FROM lochs WHERE NOT is_custom) AS total_lochs,
    ROUND((COUNT(lv.id)::numeric / NULLIF((SELECT COUNT(*) FROM lochs WHERE NOT is_custom), 0)) * 100, 1) AS completion_percentage,
    COUNT(lv.id) FILTER (WHERE lv.photo_count > 0) AS lochs_with_photos,
    SUM(lv.photo_count) AS total_photos,
    MIN(lv.visited_date) AS first_visit,
    MAX(lv.visited_date) AS latest_visit,
    COUNT(lv.id) FILTER (WHERE lv.would_recommend = true) AS recommended_count
FROM loch_visits lv;

-- Create triggers to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_castles_updated_at BEFORE UPDATE ON castles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lochs_updated_at BEFORE UPDATE ON lochs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_castle_visits_updated_at BEFORE UPDATE ON castle_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loch_visits_updated_at BEFORE UPDATE ON loch_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
