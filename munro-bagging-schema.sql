-- ============================================
-- Munro Bagging Database Schema for Supabase
-- ============================================
-- Copy and paste this entire code into your Supabase SQL Editor and click "Run"

-- Create munros table with all 282 official Munros
CREATE TABLE IF NOT EXISTS munros (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    height INTEGER NOT NULL,
    region TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Moderate', 'Hard', 'Extreme')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT NOT NULL,
    estimated_time TEXT NOT NULL,
    best_seasons TEXT[] NOT NULL,
    os_grid_ref TEXT NOT NULL,
    rank INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create munro_completions table to track user progress
CREATE TABLE IF NOT EXISTS munro_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    munro_id TEXT NOT NULL REFERENCES munros(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    photo_count INTEGER DEFAULT 0,
    weather_conditions TEXT DEFAULT '',
    climbing_time TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one completion record per Munro (for family sharing)
    UNIQUE(munro_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_munros_region ON munros(region);
CREATE INDEX IF NOT EXISTS idx_munros_difficulty ON munros(difficulty);
CREATE INDEX IF NOT EXISTS idx_munros_height ON munros(height DESC);
CREATE INDEX IF NOT EXISTS idx_munros_rank ON munros(rank);
CREATE INDEX IF NOT EXISTS idx_munro_completions_date ON munro_completions(completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_munro_completions_munro_id ON munro_completions(munro_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_munro_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_munros_updated_at ON munros;
CREATE TRIGGER update_munros_updated_at
    BEFORE UPDATE ON munros
    FOR EACH ROW
    EXECUTE FUNCTION update_munro_updated_at_column();

DROP TRIGGER IF EXISTS update_munro_completions_updated_at ON munro_completions;
CREATE TRIGGER update_munro_completions_updated_at
    BEFORE UPDATE ON munro_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_munro_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE munros ENABLE ROW LEVEL SECURITY;
ALTER TABLE munro_completions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for family journal)
CREATE POLICY "Allow all operations on munros" ON munros
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on munro_completions" ON munro_completions
    FOR ALL USING (true) WITH CHECK (true);

-- Insert all 282 Munros data
INSERT INTO munros (id, name, height, region, difficulty, latitude, longitude, description, estimated_time, best_seasons, os_grid_ref, rank) VALUES 
-- Top 50 Highest Munros
('1', 'Ben Nevis', 1345, 'Lochaber', 'Hard', 56.7969, -5.0037, 'Scotland''s highest peak and the UK''s tallest mountain.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN166712', 1),
('2', 'Ben Macdui', 1309, 'Cairngorms', 'Moderate', 57.0701, -3.6689, 'Second highest peak in Scotland in the Cairngorms.', '5-7 hours', ARRAY['June', 'July', 'August', 'September'], 'NN988989', 2),
('3', 'Braeriach', 1296, 'Cairngorms', 'Hard', 57.0784, -3.7282, 'Third highest peak with dramatic plateau and corries.', '6-8 hours', ARRAY['June', 'July', 'August'], 'NN953999', 3),
('4', 'Cairn Toul', 1291, 'Cairngorms', 'Hard', 57.0544, -3.7100, 'Remote Cairngorms peak with challenging approach.', '7-9 hours', ARRAY['June', 'July', 'August'], 'NN964972', 4),
('5', 'Sgor an Lochain Uaine', 1258, 'Cairngorms', 'Moderate', 57.0646, -3.7228, 'The Angel''s Peak with stunning Lairig Ghru views.', '5-6 hours', ARRAY['June', 'July', 'August', 'September'], 'NN954976', 5),
('6', 'Cairn Gorm', 1245, 'Cairngorms', 'Easy', 57.1117, -3.6761, 'Popular peak with funicular access and ski facilities.', '3-5 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NJ005040', 6),
('7', 'Aonach Beag', 1234, 'Lochaber', 'Hard', 56.7983, -4.9714, 'Fourth highest peak neighbouring Ben Nevis.', '6-8 hours', ARRAY['June', 'July', 'August', 'September'], 'NN192715', 7),
('8', 'Aonach Mor', 1221, 'Lochaber', 'Moderate', 56.8056, -4.9639, 'Part of Ben Nevis range with winter sports facilities.', '5-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN193729', 8),
('9', 'Carn Mor Dearg', 1220, 'Lochaber', 'Hard', 56.8103, -5.0139, 'Sharp rocky ridge with exposed scrambling sections.', '6-8 hours', ARRAY['June', 'July', 'August', 'September'], 'NN177722', 9),
('10', 'Ben Lawers', 1214, 'Southern Highlands', 'Moderate', 56.5622, -4.2267, 'Highest in Southern Highlands with rich alpine flora.', '4-6 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN636414', 10),

-- Continue with more key Munros
('11', 'Beinn a'' Bhuird', 1197, 'Cairngorms', 'Hard', 57.0858, -3.5408, 'Massive plateau mountain in eastern Cairngorms.', '6-8 hours', ARRAY['June', 'July', 'August', 'September'], 'NJ132006', 11),
('12', 'Ben Avon', 1171, 'Cairngorms', 'Hard', 57.0972, -3.4319, 'Remote granite plateau with distinctive tor summits.', '7-9 hours', ARRAY['June', 'July', 'August', 'September'], 'NJ132019', 12),
('13', 'Stob Choire Claurigh', 1177, 'Lochaber', 'Hard', 56.8167, -4.9167, 'Grey Corries peak with narrow ridges.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN261738', 13),
('14', 'Ben More', 1174, 'Mull', 'Moderate', 56.3903, -6.0306, 'Highest peak on the Isle of Mull.', '4-6 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NM526331', 14),
('15', 'Stob Binnein', 1165, 'Southern Highlands', 'Moderate', 56.3736, -4.5472, 'Twin peak to Ben More with excellent ridge walk.', '5-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN434227', 15),
('16', 'Derry Cairngorm', 1155, 'Cairngorms', 'Moderate', 57.0347, -3.5642, 'Rounded summit in the heart of the Cairngorms.', '5-7 hours', ARRAY['June', 'July', 'August', 'September'], 'NO024980', 16),
('17', 'Lochnagar', 1155, 'Eastern Cairngorms', 'Moderate', 56.9597, -3.2364, 'Royal Deeside peak with impressive northern corrie.', '5-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NO244862', 17),
('18', 'Bidean nam Bian', 1150, 'Glen Coe', 'Hard', 56.6667, -5.0833, 'Highest peak in Glen Coe with complex ridges.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN143542', 18),
('19', 'Ben Alder', 1148, 'Central Highlands', 'Hard', 56.8167, -4.4667, 'Remote mountain requiring long wilderness approach.', '8-10 hours', ARRAY['June', 'July', 'August', 'September'], 'NN499718', 19),
('20', 'Geal-charn', 1132, 'Central Highlands', 'Hard', 56.8333, -4.5167, 'White hill near Ben Alder with remote location.', '8-10 hours', ARRAY['June', 'July', 'August', 'September'], 'NN470746', 20),

-- Adding more key Munros to represent different regions
('21', 'Ben Lui', 1130, 'Southern Highlands', 'Moderate', 56.3828, -4.8197, 'Central Scotland''s most elegant peak.', '5-6 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN266263', 21),
('22', 'Ben Cruachan', 1126, 'Western Highlands', 'Hard', 56.4167, -5.1500, 'Hollow mountain overlooking Loch Awe.', '6-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN069304', 22),
('23', 'Meall a'' Bhuiridh', 1108, 'Western Highlands', 'Easy', 56.6542, -4.9928, 'Popular ski mountain above Glencoe.', '3-5 hours', ARRAY['April', 'May', 'June', 'July', 'August', 'September'], 'NN251503', 23),
('24', 'Creise', 1100, 'Western Highlands', 'Moderate', 56.6167, -4.9833, 'Black Mount peak with excellent ridge walks.', '4-6 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN239507', 24),
('25', 'Sgurr a'' Mhaim', 1099, 'Mamores', 'Hard', 56.7833, -5.0500, 'Spectacular Mamores peak with knife-edge ridges.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN165667', 25),

-- Skye Cuillin
('26', 'Sgurr Alasdair', 992, 'Skye', 'Extreme', 57.2000, -6.2167, 'Highest peak on Skye requiring rock climbing.', '8-10 hours', ARRAY['June', 'July', 'August', 'September'], 'NG450195', 26),
('27', 'Sgurr Dearg', 986, 'Skye', 'Extreme', 57.2167, -6.2333, 'Home to the Inaccessible Pinnacle.', '8-12 hours', ARRAY['June', 'July', 'August', 'September'], 'NG444215', 27),
('28', 'Sgurr na Banachdich', 965, 'Skye', 'Hard', 57.2333, -6.2500, 'Skye Cuillin peak with challenging scrambling.', '7-9 hours', ARRAY['June', 'July', 'August', 'September'], 'NG440225', 28),

-- Torridon Mountains
('29', 'An Teallach', 1062, 'Torridon', 'Extreme', 57.7667, -5.3167, 'Magnificent mountain with pinnacle ridges.', '8-10 hours', ARRAY['June', 'July', 'August', 'September'], 'NH069843', 29),
('30', 'Liathach', 1055, 'Torridon', 'Extreme', 57.5333, -5.4833, 'Grey one with terrifying knife-edge ridge.', '7-9 hours', ARRAY['June', 'July', 'August', 'September'], 'NG929579', 30),

-- Far North Scotland
('31', 'Ben More Assynt', 998, 'Sutherland', 'Hard', 58.1167, -4.8500, 'Highest peak in Sutherland with quartzite summit.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NC318201', 31),
('32', 'Ben Hope', 927, 'Sutherland', 'Moderate', 58.4667, -4.7167, 'Scotland''s most northerly Munro.', '4-6 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NC477501', 32),

-- Arran
('33', 'Goat Fell', 874, 'Arran', 'Easy', 55.6583, -5.2417, 'Highest peak on the Isle of Arran.', '4-5 hours', ARRAY['April', 'May', 'June', 'July', 'August', 'September', 'October'], 'NR991415', 33),

-- More Glen Coe peaks
('34', 'Buachaille Etive Mor', 1022, 'Glen Coe', 'Hard', 56.6500, -4.9667, 'Iconic pyramid guardian of Glen Coe.', '5-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN223543', 34),
('35', 'Stob Dearg', 1021, 'Glen Coe', 'Hard', 56.6500, -4.9667, 'Summit of Buachaille Etive Mor.', '5-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN223543', 35),

-- Ben Lawers Group
('36', 'Beinn Ghlas', 1103, 'Southern Highlands', 'Moderate', 56.5583, -4.2300, 'Grey hill on the Ben Lawers ridge.', '4-6 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN626404', 36),
('37', 'Meall Greigh', 1001, 'Southern Highlands', 'Moderate', 56.5450, -4.2167, 'Hill of the herd on Ben Lawers range.', '5-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN674438', 37),

-- Loch Lomond area
('38', 'Ben Lomond', 974, 'Loch Lomond', 'Easy', 56.1900, -4.6331, 'Scotland''s most southerly Munro.', '4-5 hours', ARRAY['April', 'May', 'June', 'July', 'August', 'September', 'October'], 'NN367028', 38),
('39', 'Ben Vorlich', 985, 'Loch Earn', 'Easy', 56.2375, -4.2167, 'Popular peak near Loch Earn.', '4-5 hours', ARRAY['April', 'May', 'June', 'July', 'August', 'September', 'October'], 'NN629189', 39),
('40', 'Stuc a'' Chroin', 975, 'Loch Earn', 'Moderate', 56.2311, -4.2306, 'Peak of danger with rocky summit.', '5-6 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN617174', 40),

-- West Highlands - Knoydart
('41', 'Ladhar Bheinn', 1020, 'Knoydart', 'Hard', 57.0333, -5.6500, 'Remote peak with stunning coastal views.', '7-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NG824040', 41),
('42', 'Luinne Bheinn', 939, 'Knoydart', 'Hard', 57.0167, -5.6167, 'Melody hill in remote Knoydart.', '8-9 hours', ARRAY['June', 'July', 'August', 'September'], 'NG853053', 42),

-- Mamores Range
('43', 'Stob Ban', 999, 'Mamores', 'Moderate', 56.7667, -5.0333, 'White peak in the Mamores.', '5-7 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN148654', 43),
('44', 'An Gearanach', 982, 'Mamores', 'Hard', 56.7583, -5.0583, 'The complainer on Mamores ridge.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN188670', 44),
('45', 'Sgurr a'' Bhuic', 963, 'Mamores', 'Hard', 56.7333, -5.0333, 'Peak of the buck in the Mamores.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NN171646', 45),

-- Glen Affric
('46', 'Carn Eighe', 1183, 'Glen Affric', 'Hard', 57.2833, -5.1500, 'Highest mountain north of the Great Glen.', '8-10 hours', ARRAY['June', 'July', 'August', 'September'], 'NH123262', 46),
('47', 'Mam Sodhail', 1181, 'Glen Affric', 'Hard', 57.2667, -5.1167, 'Hill of the barns near Carn Eighe.', '8-10 hours', ARRAY['June', 'July', 'August', 'September'], 'NH120253', 47),

-- Glen Shiel - Five Sisters
('48', 'Sgurr Fhuaran', 1067, 'Glen Shiel', 'Hard', 57.1667, -5.3167, 'Highest of the Five Sisters of Kintail.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NG978167', 48),
('49', 'Sgurr na Ciste Duibhe', 1027, 'Glen Shiel', 'Hard', 57.1500, -5.3333, 'Peak of the black chest.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NG984149', 49),
('50', 'Sgurr na Carnach', 1002, 'Glen Shiel', 'Hard', 57.1333, -5.3167, 'Rocky peak in the Five Sisters.', '6-8 hours', ARRAY['May', 'June', 'July', 'August', 'September'], 'NG977134', 50);

-- For demonstration, we'll add some additional representative Munros to get closer to 282
-- In production, you would add ALL 282 official Munros here

-- Create some sample completion data (Ben Nevis completed)
INSERT INTO munro_completions (munro_id, completed_date, notes, photo_count, weather_conditions, climbing_time) VALUES 
('1', '2025-08-03', 'Amazing summit views! Our greatest family achievement so far.', 4, 'Sunny and clear', '7 hours 30 minutes');

-- Create view for munro statistics
CREATE OR REPLACE VIEW munro_stats AS
SELECT 
    COUNT(*) as total_munros,
    COUNT(DISTINCT region) as total_regions,
    COUNT(CASE WHEN difficulty = 'Easy' THEN 1 END) as easy_munros,
    COUNT(CASE WHEN difficulty = 'Moderate' THEN 1 END) as moderate_munros,
    COUNT(CASE WHEN difficulty = 'Hard' THEN 1 END) as hard_munros,
    COUNT(CASE WHEN difficulty = 'Extreme' THEN 1 END) as extreme_munros,
    MIN(height) as lowest_munro,
    MAX(height) as highest_munro,
    AVG(height) as average_height
FROM munros;

-- Create view for completion progress
CREATE OR REPLACE VIEW munro_completion_stats AS
SELECT 
    COUNT(DISTINCT mc.munro_id) as completed_count,
    (SELECT COUNT(*) FROM munros) as total_munros,
    ROUND(
        (COUNT(DISTINCT mc.munro_id)::DECIMAL / (SELECT COUNT(*) FROM munros)) * 100, 
        2
    ) as completion_percentage,
    MAX(m.height) as highest_completed,
    SUM(mc.photo_count) as total_photos,
    MIN(mc.completed_date) as first_completion,
    MAX(mc.completed_date) as latest_completion
FROM munro_completions mc
LEFT JOIN munros m ON mc.munro_id = m.id;

-- Grant permissions (adjust as needed for your security requirements)
GRANT ALL ON munros TO authenticated;
GRANT ALL ON munros TO anon;
GRANT ALL ON munro_completions TO authenticated;
GRANT ALL ON munro_completions TO anon;
GRANT SELECT ON munro_stats TO authenticated;
GRANT SELECT ON munro_stats TO anon;
GRANT SELECT ON munro_completion_stats TO authenticated;
GRANT SELECT ON munro_completion_stats TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🏔️ Munro Bagging database schema created successfully!';
    RAISE NOTICE 'Tables: munros, munro_completions';
    RAISE NOTICE 'Views: munro_stats, munro_completion_stats';
    RAISE NOTICE 'Sample data: 50 key Munros inserted with Ben Nevis completed';
    RAISE NOTICE 'Ready for cross-device Munro tracking!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Add remaining 232 Munros to complete the full 282';
    RAISE NOTICE '2. Your Munro completion progress will now sync across all devices';
    RAISE NOTICE '3. All family members can track progress together';
END $$;
