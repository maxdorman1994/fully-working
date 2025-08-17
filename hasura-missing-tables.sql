-- ============================================
-- Missing Tables for Hasura Migration
-- Run this in your Hasura console after the universal schema
-- ============================================

-- ============================================
-- MUNROS TRACKING SYSTEM
-- ============================================

-- Create munros table
CREATE TABLE IF NOT EXISTS munros (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    height INTEGER NOT NULL,
    region TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Moderate', 'Hard', 'Extreme')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    estimated_time TEXT NOT NULL,
    best_seasons TEXT[] NOT NULL DEFAULT '{}',
    os_grid_ref TEXT NOT NULL,
    rank INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create munro_completions table
CREATE TABLE IF NOT EXISTS munro_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    munro_id TEXT NOT NULL REFERENCES munros(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    photo_count INTEGER DEFAULT 0,
    weather_conditions TEXT DEFAULT '',
    climbing_time TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for munros
CREATE INDEX IF NOT EXISTS idx_munros_region ON munros(region);
CREATE INDEX IF NOT EXISTS idx_munros_difficulty ON munros(difficulty);
CREATE INDEX IF NOT EXISTS idx_munros_height ON munros(height DESC);
CREATE INDEX IF NOT EXISTS idx_munros_rank ON munros(rank);
CREATE INDEX IF NOT EXISTS idx_munros_custom ON munros(is_custom);
CREATE INDEX IF NOT EXISTS idx_munro_completions_date ON munro_completions(completed_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_munro_completions_unique ON munro_completions(munro_id);

-- Create triggers for munros
CREATE TRIGGER update_munros_updated_at BEFORE UPDATE ON munros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_munro_completions_updated_at BEFORE UPDATE ON munro_completions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample Munros data
INSERT INTO munros (id, name, height, region, difficulty, latitude, longitude, description, estimated_time, best_seasons, os_grid_ref, rank, is_custom) VALUES 
('1', 'Ben Nevis', 1345, 'Lochaber', 'Hard', 56.7969, -5.0037, 'Scotland''s highest peak and the UK''s tallest mountain.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN166712', 1, false),
('2', 'Ben Macdui', 1309, 'Cairngorms', 'Hard', 57.0700, -3.6689, 'Second highest peak in the UK, often shrouded in mist.', '5-7 hours', ARRAY['June', 'July', 'August', 'September'], 'NN988989', 2, false),
('3', 'Braeriach', 1296, 'Cairngorms', 'Hard', 57.0783, -3.7286, 'Third highest peak with spectacular corries and plateau.', '6-8 hours', ARRAY['June', 'July', 'August', 'September'], 'NN953999', 3, false),
('4', 'Cairn Toul', 1291, 'Cairngorms', 'Hard', 57.0542, -3.7108, 'Remote peak in the heart of the Cairngorms.', '7-9 hours', ARRAY['June', 'July', 'August', 'September'], 'NN963972', 4, false),
('5', 'Sgòr an Lochain Uaine', 1258, 'Cairngorms', 'Hard', 57.0631, -3.7228, 'Known as the Angel''s Peak, often climbed with Cairn Toul.', '7-9 hours', ARRAY['June', 'July', 'August', 'September'], 'NN954976', 5, false)
ON CONFLICT DO NOTHING;

-- Create munro statistics view
CREATE OR REPLACE VIEW munro_completion_stats AS
SELECT 
    COUNT(DISTINCT mc.munro_id) as completed_count,
    (SELECT COUNT(*) FROM munros) as total_munros,
    ROUND(
        (COUNT(DISTINCT mc.munro_id)::DECIMAL / (SELECT COUNT(*) FROM munros)) * 100, 
        2
    ) as completion_percentage,
    COALESCE(MAX(m.height), 0) as highest_completed,
    COALESCE(SUM(mc.photo_count), 0) as total_photos,
    MIN(mc.completed_date) as first_completion,
    MAX(mc.completed_date) as latest_completion
FROM munro_completions mc
LEFT JOIN munros m ON mc.munro_id = m.id;

-- ============================================
-- COMMENTS SYSTEM (for journal entries)
-- ============================================

-- Create journal_comments table
CREATE TABLE IF NOT EXISTS journal_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_likes table  
CREATE TABLE IF NOT EXISTS journal_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for comments and likes
CREATE INDEX IF NOT EXISTS idx_journal_comments_entry ON journal_comments(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_comments_created ON journal_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_likes_entry ON journal_likes(journal_entry_id);

-- Create triggers for comments
CREATE TRIGGER update_journal_comments_updated_at BEFORE UPDATE ON journal_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HIDDEN GEMS SYSTEM
-- ============================================

-- Create hidden_gems table
CREATE TABLE IF NOT EXISTS hidden_gems (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Secret Beach', 'Hidden Waterfall', 'Ancient Site', 'Natural Wonder', 'Historic Village', 'Remote Island', 'Mountain Peak', 'Forest Grove', 'Cave System', 'Coastal Feature')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    how_to_find TEXT NOT NULL,
    best_seasons TEXT[] NOT NULL DEFAULT '{}',
    difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('Easy', 'Moderate', 'Challenging', 'Expert')),
    requires_hiking BOOLEAN DEFAULT FALSE,
    nearest_town TEXT NOT NULL,
    special_features TEXT DEFAULT '',
    photography_tips TEXT DEFAULT '',
    rank INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hidden_gem_visits table
CREATE TABLE IF NOT EXISTS hidden_gem_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT DEFAULT 'anonymous',
    hidden_gem_id TEXT NOT NULL REFERENCES hidden_gems(id) ON DELETE CASCADE,
    visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT DEFAULT '',
    photo_count INTEGER DEFAULT 0,
    weather_conditions TEXT DEFAULT '',
    would_recommend BOOLEAN DEFAULT TRUE,
    difficulty_experienced TEXT CHECK (difficulty_experienced IN ('Easy', 'Moderate', 'Challenging', 'Expert')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for hidden gems
CREATE INDEX IF NOT EXISTS idx_hidden_gems_region ON hidden_gems(region);
CREATE INDEX IF NOT EXISTS idx_hidden_gems_type ON hidden_gems(type);
CREATE INDEX IF NOT EXISTS idx_hidden_gems_difficulty ON hidden_gems(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_hidden_gems_rank ON hidden_gems(rank);
CREATE INDEX IF NOT EXISTS idx_hidden_gems_custom ON hidden_gems(is_custom);
CREATE INDEX IF NOT EXISTS idx_hidden_gem_visits_date ON hidden_gem_visits(visited_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hidden_gem_visits_unique ON hidden_gem_visits(hidden_gem_id, user_id);

-- Create triggers for hidden gems
CREATE TRIGGER update_hidden_gems_updated_at BEFORE UPDATE ON hidden_gems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hidden_gem_visits_updated_at BEFORE UPDATE ON hidden_gem_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample hidden gems
INSERT INTO hidden_gems (id, name, region, type, latitude, longitude, description, how_to_find, best_seasons, difficulty_level, requires_hiking, nearest_town, special_features, photography_tips, rank, is_custom) VALUES 
('fairy-pools', 'Fairy Pools', 'Isle of Skye', 'Hidden Waterfall', 57.2425, -6.2684, 'Crystal clear pools and waterfalls beneath the Cuillin mountains.', 'Follow the path from the car park at Glenbrittle road.', ARRAY['April', 'May', 'June', 'July', 'August', 'September'], 'Easy', true, 'Carbost', 'Crystal clear pools perfect for wild swimming', 'Best light in early morning or golden hour', 1, false),
('quiraing', 'The Quiraing', 'Isle of Skye', 'Natural Wonder', 57.6433, -6.2725, 'Dramatic rocky landscape formed by ancient landslide.', 'Park at the Quiraing car park off the A855 road.', ARRAY['May', 'June', 'July', 'August', 'September'], 'Moderate', true, 'Staffin', 'Unique trotternish ridge geological formation', 'Stunning at sunrise and sunset, bring wide angle lens', 2, false),
('st-cyrus-beach', 'St Cyrus Beach', 'Aberdeenshire', 'Secret Beach', 56.7886, -2.4167, 'Hidden sandy beach with dramatic cliffs and wildlife.', 'Follow signs to St Cyrus National Nature Reserve.', ARRAY['All Year'], 'Easy', false, 'Montrose', 'Seal spotting and rare flowers', 'Great for wildlife photography and seascapes', 3, false)
ON CONFLICT DO NOTHING;

-- ============================================
-- APP SETTINGS SYSTEM
-- ============================================

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type TEXT NOT NULL DEFAULT 'user',
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for app settings
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_app_settings_type ON app_settings(setting_type);

-- Create trigger for app settings
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default app settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description) VALUES 
('theme', '{"mode": "light", "color": "blue"}', 'user', 'Application theme preferences'),
('notifications', '{"email": true, "push": false, "sync": true}', 'user', 'Notification preferences'),
('map_settings', '{"default_zoom": 7, "show_satellite": false, "cluster_pins": true}', 'user', 'Map display preferences'),
('privacy', '{"analytics": false, "location_sharing": true, "data_export": true}', 'user', 'Privacy and data preferences')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Hasura Migration Tables Created Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '🆕 New Tables Added:';
    RAISE NOTICE '   • munros & munro_completions (mountain tracking)';
    RAISE NOTICE '   • journal_comments & journal_likes (social features)';
    RAISE NOTICE '   • hidden_gems & hidden_gem_visits (secret locations)';
    RAISE NOTICE '   • app_settings (user preferences)';
    RAISE NOTICE '';
    RAISE NOTICE '📊 New Views Created:';
    RAISE NOTICE '   • munro_completion_stats (climbing progress)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 All converted services now have required tables!';
    RAISE NOTICE '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Your Scottish adventure app is ready for Hasura!';
END $$;
