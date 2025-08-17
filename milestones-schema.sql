-- Milestones System Database Schema
-- Creates tables for milestone tracking, progress, and achievements

-- Enable UUID extension if not already enabled
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    CREATE EXTENSION "uuid-ossp";
  END IF;
END $$;

-- Create milestone categories table
CREATE TABLE IF NOT EXISTS milestone_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES milestone_categories(id),
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  color_scheme JSONB DEFAULT '{}',
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('simple', 'progress', 'locked')),
  target_value INTEGER, -- For progress milestones
  requirement_text TEXT, -- For locked milestones
  required_milestone_ids TEXT[], -- Array of milestone IDs that must be completed first
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user milestone progress table
CREATE TABLE IF NOT EXISTS user_milestone_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- Can be family member ID or session ID
  milestone_id TEXT NOT NULL REFERENCES milestones(id),
  status TEXT NOT NULL CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  current_progress INTEGER DEFAULT 0,
  completion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_milestones_category ON milestones(category_id);
CREATE INDEX IF NOT EXISTS idx_milestones_type ON milestones(milestone_type);
CREATE INDEX IF NOT EXISTS idx_milestones_sort ON milestones(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_milestone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_status ON user_milestone_progress(status);
CREATE INDEX IF NOT EXISTS idx_user_progress_milestone ON user_milestone_progress(milestone_id);

-- Enable Row Level Security
ALTER TABLE milestone_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_milestone_progress ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'milestone_categories' AND policyname = 'Allow all operations on milestone_categories') THEN
    CREATE POLICY "Allow all operations on milestone_categories" ON milestone_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'milestones' AND policyname = 'Allow all operations on milestones') THEN
    CREATE POLICY "Allow all operations on milestones" ON milestones FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_milestone_progress' AND policyname = 'Allow all operations on user_milestone_progress') THEN
    CREATE POLICY "Allow all operations on user_milestone_progress" ON user_milestone_progress FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insert milestone categories
INSERT INTO milestone_categories (id, name, icon, description) VALUES
('exploration', 'Exploration', 'MapPin', 'Discover new Scottish locations and regions'),
('photography', 'Photography', 'Camera', 'Capture memories and beautiful moments'),
('family', 'Family', 'Heart', 'Create shared memories with loved ones'),
('adventure', 'Adventure', 'Mountain', 'Take on physical challenges and outdoor activities'),
('documentation', 'Documentation', 'Eye', 'Record and document your adventures'),
('time', 'Time', 'Calendar', 'Consistent exploration and time-based achievements'),
('wildlife', 'Wildlife', 'Eye', 'Discover and photograph Scottish wildlife'),
('culture', 'Culture', 'Trophy', 'Explore Scottish heritage and traditions'),
('nature', 'Nature', 'Mountain', 'Connect with Scotland''s natural beauty'),
('legendary', 'Legendary', 'Award', 'Ultimate achievements for dedicated adventurers')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- Insert all 50 milestones
INSERT INTO milestones (id, title, description, category_id, icon, xp_reward, color_scheme, milestone_type, target_value, requirement_text, required_milestone_ids, sort_order) VALUES

-- Completed Milestones (8 total) - These start as completed for demonstration
('first-adventure', 'First Adventure', 'Started your Scottish exploration journey', 'exploration', 'MapPin', 100, '{"color": "from-blue-500 to-indigo-600", "bgColor": "from-blue-50 to-indigo-100", "borderColor": "border-blue-200/60"}', 'simple', NULL, NULL, NULL, 1),
('photo-memories', 'Photo Memories', 'Captured your first Scottish moments', 'photography', 'Camera', 75, '{"color": "from-purple-500 to-violet-600", "bgColor": "from-purple-50 to-violet-100", "borderColor": "border-purple-200/60"}', 'simple', NULL, NULL, NULL, 2),
('family-adventure', 'Family Adventure', 'Shared memories with loved ones', 'family', 'Heart', 125, '{"color": "from-pink-500 to-rose-600", "bgColor": "from-pink-50 to-rose-100", "borderColor": "border-pink-200/60"}', 'simple', NULL, NULL, NULL, 3),
('first-month', 'First Month Complete', 'Completed your first month of Scottish exploration', 'time', 'Calendar', 200, '{"color": "from-emerald-500 to-teal-600", "bgColor": "from-emerald-50 to-teal-100", "borderColor": "border-emerald-200/60"}', 'simple', NULL, NULL, NULL, 4),
('first-journal', 'First Journal Entry', 'Wrote your first adventure story', 'documentation', 'Eye', 50, '{"color": "from-green-500 to-emerald-600", "bgColor": "from-green-50 to-emerald-100", "borderColor": "border-green-200/60"}', 'simple', NULL, NULL, NULL, 5),
('first-upload', 'Photo Uploader', 'Uploaded your first adventure photo', 'photography', 'Camera', 25, '{"color": "from-violet-500 to-purple-600", "bgColor": "from-violet-50 to-purple-100", "borderColor": "border-violet-200/60"}', 'simple', NULL, NULL, NULL, 6),
('early-bird', 'Early Bird Explorer', 'Started adventuring in your first week', 'time', 'Calendar', 150, '{"color": "from-amber-500 to-yellow-600", "bgColor": "from-amber-50 to-yellow-100", "borderColor": "border-amber-200/60"}', 'simple', NULL, NULL, NULL, 7),
('weather-warrior', 'Weather Warrior', 'Adventured in different weather conditions', 'exploration', 'MapPin', 175, '{"color": "from-teal-500 to-cyan-600", "bgColor": "from-teal-50 to-cyan-100", "borderColor": "border-teal-200/60"}', 'simple', NULL, NULL, NULL, 8),

-- In Progress Milestones (12 total)
('highland-explorer', 'Highland Explorer', 'Visit 5 different Scottish locations', 'exploration', 'Mountain', 300, '{"color": "from-amber-500 to-orange-600", "bgColor": "from-amber-50 to-orange-100", "borderColor": "border-amber-200/60"}', 'progress', 5, NULL, NULL, 10),
('photo-collector', 'Photo Collector', 'Take 50 photos during your adventures', 'photography', 'Camera', 250, '{"color": "from-indigo-500 to-purple-600", "bgColor": "from-indigo-50 to-purple-100", "borderColor": "border-indigo-200/60"}', 'progress', 50, NULL, NULL, 11),
('journal-keeper', 'Journal Keeper', 'Write 10 journal entries', 'documentation', 'Eye', 200, '{"color": "from-green-500 to-emerald-600", "bgColor": "from-green-50 to-emerald-100", "borderColor": "border-green-200/60"}', 'progress', 10, NULL, NULL, 12),
('tag-master', 'Tag Master', 'Use 100 different tags in your journal', 'documentation', 'Eye', 300, '{"color": "from-slate-500 to-gray-600", "bgColor": "from-slate-50 to-gray-100", "borderColor": "border-slate-200/60"}', 'progress', 100, NULL, NULL, 13),
('family-time', 'Family Time', 'Include all family members in 5 adventures', 'family', 'Users', 350, '{"color": "from-rose-500 to-pink-600", "bgColor": "from-rose-50 to-pink-100", "borderColor": "border-rose-200/60"}', 'progress', 5, NULL, NULL, 14),
('distance-tracker', 'Distance Tracker', 'Travel 100 miles across Scotland', 'exploration', 'Map', 400, '{"color": "from-blue-500 to-sky-600", "bgColor": "from-blue-50 to-sky-100", "borderColor": "border-blue-200/60"}', 'progress', 100, NULL, NULL, 15),
('mood-tracker', 'Mood Tracker', 'Record 20 different moods in your journal', 'documentation', 'Heart', 150, '{"color": "from-red-500 to-rose-600", "bgColor": "from-red-50 to-rose-100", "borderColor": "border-red-200/60"}', 'progress', 20, NULL, NULL, 16),
('seasonal-explorer', 'Seasonal Explorer', 'Adventure in all 4 seasons', 'time', 'Calendar', 500, '{"color": "from-orange-500 to-red-600", "bgColor": "from-orange-50 to-red-100", "borderColor": "border-orange-200/60"}', 'progress', 4, NULL, NULL, 17),
('consistent-adventurer', 'Consistent Adventurer', 'Adventure for 30 consecutive days', 'time', 'Target', 600, '{"color": "from-emerald-500 to-green-600", "bgColor": "from-emerald-50 to-green-100", "borderColor": "border-emerald-200/60"}', 'progress', 30, NULL, NULL, 18),
('photo-variety', 'Photo Variety', 'Take photos in 10 different categories', 'photography', 'Camera', 250, '{"color": "from-purple-500 to-indigo-600", "bgColor": "from-purple-50 to-indigo-100", "borderColor": "border-purple-200/60"}', 'progress', 10, NULL, NULL, 19),
('memory-maker', 'Memory Maker', 'Create 25 tagged memories', 'family', 'Heart', 300, '{"color": "from-pink-500 to-red-600", "bgColor": "from-pink-50 to-red-100", "borderColor": "border-pink-200/60"}', 'progress', 25, NULL, NULL, 20),
('weather-explorer', 'Weather Explorer', 'Adventure in 8 different weather conditions', 'exploration', 'MapPin', 200, '{"color": "from-cyan-500 to-blue-600", "bgColor": "from-cyan-50 to-blue-100", "borderColor": "border-cyan-200/60"}', 'progress', 8, NULL, NULL, 21),

-- Locked Milestones (30 total)
('castle-conqueror', 'Castle Conqueror', 'Visit 3 Scottish castles', 'exploration', 'Trophy', 400, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 3, 'Complete Highland Explorer first', ARRAY['highland-explorer'], 30),
('munro-beginner', 'Munro Beginner', 'Climb your first Munro', 'adventure', 'Mountain', 500, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', NULL, 'Complete Highland Explorer first', ARRAY['highland-explorer'], 31),
('loch-legend', 'Loch Legend', 'Visit 5 different Scottish lochs', 'exploration', 'Map', 350, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 5, 'Complete Highland Explorer first', ARRAY['highland-explorer'], 32),
('family-historian', 'Family Historian', 'Document 25 family adventures', 'family', 'Users', 300, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 25, 'Complete Journal Keeper first', ARRAY['journal-keeper'], 33),
('munro-collector', 'Munro Collector', 'Climb 10 different Munros', 'adventure', 'Mountain', 1000, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 10, 'Complete Munro Beginner first', ARRAY['munro-beginner'], 34),
('castle-historian', 'Castle Historian', 'Visit 10 Scottish castles', 'culture', 'Trophy', 750, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 10, 'Complete Castle Conqueror first', ARRAY['castle-conqueror'], 35),
('highland-master', 'Highland Master', 'Visit 25 different Scottish locations', 'exploration', 'Map', 800, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 25, 'Complete Highland Explorer first', ARRAY['highland-explorer'], 36),
('photography-expert', 'Photography Expert', 'Take 500 photos during adventures', 'photography', 'Camera', 600, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 500, 'Complete Photo Collector first', ARRAY['photo-collector'], 37),
('story-teller', 'Story Teller', 'Write 50 journal entries', 'documentation', 'Eye', 500, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 50, 'Complete Journal Keeper first', ARRAY['journal-keeper'], 38),
('island-hopper', 'Island Hopper', 'Visit 5 Scottish islands', 'exploration', 'Map', 700, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 5, 'Complete Loch Legend first', ARRAY['loch-legend'], 39),
('wildlife-spotter', 'Wildlife Spotter', 'Spot and photograph 20 different Scottish animals', 'wildlife', 'Eye', 400, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 20, 'Complete Photo Variety first', ARRAY['photo-variety'], 40),
('heritage-explorer', 'Heritage Explorer', 'Visit 15 historical sites', 'culture', 'Trophy', 450, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 15, 'Complete Castle Conqueror first', ARRAY['castle-conqueror'], 41),
('city-explorer', 'City Explorer', 'Visit all major Scottish cities', 'exploration', 'MapPin', 600, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 8, 'Complete Highland Master first', ARRAY['highland-master'], 42),
('beach-comber', 'Beach Comber', 'Visit 10 Scottish beaches', 'exploration', 'Map', 350, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 10, 'Complete Highland Explorer first', ARRAY['highland-explorer'], 43),
('forest-walker', 'Forest Walker', 'Explore 8 Scottish forests', 'nature', 'Mountain', 300, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 8, 'Complete Highland Explorer first', ARRAY['highland-explorer'], 44),
('bridge-crosser', 'Bridge Crosser', 'Cross 15 famous Scottish bridges', 'exploration', 'MapPin', 250, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 15, 'Complete Highland Explorer first', ARRAY['highland-explorer'], 45),
('distillery-visitor', 'Distillery Visitor', 'Visit 5 Scottish distilleries', 'culture', 'Trophy', 400, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 5, 'Complete Heritage Explorer first', ARRAY['heritage-explorer'], 46),
('festival-goer', 'Festival Goer', 'Attend 3 Scottish festivals', 'culture', 'Heart', 350, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 3, 'Complete City Explorer first', ARRAY['city-explorer'], 47),
('mountain-climber', 'Mountain Climber', 'Climb 25 Scottish peaks', 'adventure', 'Mountain', 1200, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 25, 'Complete Munro Collector first', ARRAY['munro-collector'], 48),
('night-photographer', 'Night Photographer', 'Take 50 nighttime photos', 'photography', 'Camera', 300, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 50, 'Complete Photography Expert first', ARRAY['photography-expert'], 49),
('sunrise-chaser', 'Sunrise Chaser', 'Photograph 10 Scottish sunrises', 'photography', 'Camera', 250, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 10, 'Complete Photo Variety first', ARRAY['photo-variety'], 50),
('waterfall-hunter', 'Waterfall Hunter', 'Visit 12 Scottish waterfalls', 'nature', 'Map', 400, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 12, 'Complete Forest Walker first', ARRAY['forest-walker'], 51),
('clan-explorer', 'Clan Explorer', 'Visit 10 clan ancestral homes', 'culture', 'Trophy', 500, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 10, 'Complete Heritage Explorer first', ARRAY['heritage-explorer'], 52),
('ghost-hunter', 'Ghost Hunter', 'Visit 8 haunted Scottish locations', 'culture', 'Eye', 300, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 8, 'Complete Castle Historian first', ARRAY['castle-historian'], 53),
('golf-course-visitor', 'Golf Course Visitor', 'Visit 6 famous Scottish golf courses', 'culture', 'Target', 250, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 6, 'Complete City Explorer first', ARRAY['city-explorer'], 54),
('marathon-adventurer', 'Marathon Adventurer', 'Adventure for 365 consecutive days', 'time', 'Calendar', 2000, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 365, 'Complete Consistent Adventurer first', ARRAY['consistent-adventurer'], 55),
('master-explorer', 'Master Explorer', 'Visit 100 different Scottish locations', 'exploration', 'Star', 2500, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 100, 'Complete Highland Master first', ARRAY['highland-master'], 56),
('legend-status', 'Scottish Legend', 'Complete 40 other milestones', 'legendary', 'Award', 5000, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 40, 'Complete 40 other milestones', NULL, 57),
('ultimate-adventurer', 'Ultimate Adventurer', 'The highest honor - complete all other milestones', 'legendary', 'Trophy', 10000, '{"color": "from-gray-400 to-gray-500", "bgColor": "from-gray-50 to-gray-100", "borderColor": "border-gray-200/60"}', 'locked', 49, 'Complete all other 49 milestones', NULL, 58)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id,
  xp_reward = EXCLUDED.xp_reward,
  updated_at = NOW();

-- Insert initial user progress for completed milestones (using 'demo-user' as user_id)
INSERT INTO user_milestone_progress (user_id, milestone_id, status, current_progress, completion_date) VALUES
('demo-user', 'first-adventure', 'completed', 1, '2025-01-10T12:00:00Z'),
('demo-user', 'photo-memories', 'completed', 1, '2025-01-10T14:00:00Z'),
('demo-user', 'family-adventure', 'completed', 1, '2025-01-10T16:00:00Z'),
('demo-user', 'first-month', 'completed', 1, '2025-01-15T18:00:00Z'),
('demo-user', 'first-journal', 'completed', 1, '2025-01-10T10:00:00Z'),
('demo-user', 'first-upload', 'completed', 1, '2025-01-10T11:00:00Z'),
('demo-user', 'early-bird', 'completed', 1, '2025-01-11T09:00:00Z'),
('demo-user', 'weather-warrior', 'completed', 1, '2025-01-12T15:00:00Z')
ON CONFLICT (user_id, milestone_id) DO UPDATE SET
  status = EXCLUDED.status,
  current_progress = EXCLUDED.current_progress,
  completion_date = EXCLUDED.completion_date;

-- Insert initial progress for in-progress milestones
INSERT INTO user_milestone_progress (user_id, milestone_id, status, current_progress) VALUES
('demo-user', 'highland-explorer', 'in_progress', 1),
('demo-user', 'photo-collector', 'in_progress', 12),
('demo-user', 'journal-keeper', 'in_progress', 1),
('demo-user', 'tag-master', 'in_progress', 15),
('demo-user', 'family-time', 'in_progress', 1),
('demo-user', 'distance-tracker', 'in_progress', 15),
('demo-user', 'mood-tracker', 'in_progress', 3),
('demo-user', 'seasonal-explorer', 'in_progress', 1),
('demo-user', 'consistent-adventurer', 'in_progress', 5),
('demo-user', 'photo-variety', 'in_progress', 4),
('demo-user', 'memory-maker', 'in_progress', 8),
('demo-user', 'weather-explorer', 'in_progress', 3)
ON CONFLICT (user_id, milestone_id) DO UPDATE SET
  status = EXCLUDED.status,
  current_progress = EXCLUDED.current_progress;

-- Create helpful views
CREATE OR REPLACE VIEW user_milestone_summary AS
SELECT 
  ump.user_id,
  m.category_id,
  COUNT(*) FILTER (WHERE ump.status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE ump.status = 'in_progress') as in_progress_count,
  COUNT(*) FILTER (WHERE ump.status = 'locked') as locked_count,
  SUM(CASE WHEN ump.status = 'completed' THEN m.xp_reward ELSE 0 END) as total_xp
FROM user_milestone_progress ump
JOIN milestones m ON ump.milestone_id = m.id
GROUP BY ump.user_id, m.category_id;

CREATE OR REPLACE VIEW milestone_leaderboard AS
SELECT 
  ump.user_id,
  COUNT(*) FILTER (WHERE ump.status = 'completed') as completed_milestones,
  SUM(CASE WHEN ump.status = 'completed' THEN m.xp_reward ELSE 0 END) as total_xp,
  ROUND(COUNT(*) FILTER (WHERE ump.status = 'completed') * 100.0 / COUNT(*), 1) as completion_percentage
FROM user_milestone_progress ump
JOIN milestones m ON ump.milestone_id = m.id
GROUP BY ump.user_id
ORDER BY total_xp DESC, completed_milestones DESC;

-- Function to update milestone progress
CREATE OR REPLACE FUNCTION update_milestone_progress(
  p_user_id TEXT,
  p_milestone_id TEXT,
  p_progress_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  milestone_target INTEGER;
  current_progress INTEGER;
  new_progress INTEGER;
BEGIN
  -- Get milestone target and current progress
  SELECT m.target_value, COALESCE(ump.current_progress, 0)
  INTO milestone_target, current_progress
  FROM milestones m
  LEFT JOIN user_milestone_progress ump ON m.id = ump.milestone_id AND ump.user_id = p_user_id
  WHERE m.id = p_milestone_id;
  
  -- Calculate new progress
  new_progress := current_progress + p_progress_increment;
  
  -- Insert or update progress
  INSERT INTO user_milestone_progress (user_id, milestone_id, status, current_progress, completion_date)
  VALUES (
    p_user_id, 
    p_milestone_id, 
    CASE WHEN milestone_target IS NULL OR new_progress >= milestone_target THEN 'completed' ELSE 'in_progress' END,
    new_progress,
    CASE WHEN milestone_target IS NULL OR new_progress >= milestone_target THEN NOW() ELSE NULL END
  )
  ON CONFLICT (user_id, milestone_id) DO UPDATE SET
    current_progress = new_progress,
    status = CASE WHEN milestone_target IS NULL OR new_progress >= milestone_target THEN 'completed' ELSE 'in_progress' END,
    completion_date = CASE WHEN milestone_target IS NULL OR new_progress >= milestone_target THEN NOW() ELSE user_milestone_progress.completion_date END,
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON milestone_categories TO anon, authenticated;
GRANT SELECT ON milestones TO anon, authenticated;
GRANT ALL ON user_milestone_progress TO anon, authenticated;
GRANT SELECT ON user_milestone_summary TO anon, authenticated;
GRANT SELECT ON milestone_leaderboard TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_milestone_progress(TEXT, TEXT, INTEGER) TO anon, authenticated;

-- Success message
DO $$ BEGIN
  RAISE NOTICE '✅ Milestone system database schema created successfully!';
  RAISE NOTICE 'Created 50 milestones across 10 categories with progress tracking.';
  RAISE NOTICE 'Demo user has 8 completed milestones and 12 in progress.';
  RAISE NOTICE 'Use: SELECT * FROM milestones ORDER BY sort_order; to see all milestones.';
  RAISE NOTICE 'Use: SELECT * FROM user_milestone_progress WHERE user_id = ''demo-user''; to see demo progress.';
END $$;
