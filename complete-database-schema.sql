-- ============================================
-- A Wee Adventure - Complete Database Schema
-- ============================================
-- Copy and paste this entire code into your database SQL editor and click "Run"
-- This creates the complete database for your Scottish family adventure app

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CORE JOURNAL SYSTEM
-- ============================================

-- Create journal_entries table (main adventure logs)
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
    photos TEXT[] DEFAULT '{}', -- Array of Cloudflare Images URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for journal_entries
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

-- Create trigger for journal_entries
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for journal_entries
CREATE POLICY "Allow all operations on journal_entries" ON journal_entries
    FOR ALL USING (true) WITH CHECK (true);

-- Create journal statistics view
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

-- Create search function for journal entries
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

-- ============================================
-- 2. FAMILY MEMBERS SYSTEM
-- ============================================

-- Create family_members table
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  position_index INTEGER NOT NULL,
  colors JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for family_members
CREATE INDEX IF NOT EXISTS idx_family_members_position ON family_members(position_index);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON family_members(name);

-- Enable Row Level Security for family_members
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create policy for family_members
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'family_members' 
    AND policyname = 'Allow all operations on family_members'
  ) THEN
    CREATE POLICY "Allow all operations on family_members"
    ON family_members FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Create trigger for family_members
CREATE OR REPLACE FUNCTION update_family_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_family_members_updated_at ON family_members;
CREATE TRIGGER trigger_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_family_members_updated_at();

-- Create family members view with statistics
CREATE OR REPLACE VIEW family_members_with_stats AS
SELECT 
  fm.*,
  CASE 
    WHEN fm.avatar_url IS NOT NULL THEN true 
    ELSE false 
  END as has_custom_avatar,
  CASE 
    WHEN fm.avatar_url IS NOT NULL THEN fm.avatar_url 
    ELSE '/placeholder.svg' 
  END as display_avatar
FROM family_members fm
ORDER BY fm.position_index;

-- ============================================
-- 3. ADVENTURE STATISTICS SYSTEM
-- ============================================

-- Create adventure_stats table
CREATE TABLE IF NOT EXISTS adventure_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_type TEXT NOT NULL, -- 'journal_entries', 'places_visited', 'memory_tags', 'photos_captured', etc.
  stat_value INTEGER NOT NULL DEFAULT 0,
  stat_description TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for adventure_stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_adventure_stats_type_unique ON adventure_stats(stat_type);
CREATE INDEX IF NOT EXISTS idx_adventure_stats_updated ON adventure_stats(last_updated);

-- Enable Row Level Security for adventure_stats
ALTER TABLE adventure_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for adventure_stats
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'adventure_stats' 
    AND policyname = 'Allow all operations on adventure_stats'
  ) THEN
    CREATE POLICY "Allow all operations on adventure_stats"
    ON adventure_stats FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Create trigger for adventure_stats
CREATE OR REPLACE FUNCTION update_adventure_stats_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_adventure_stats_updated ON adventure_stats;
CREATE TRIGGER trigger_adventure_stats_updated
  BEFORE UPDATE ON adventure_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_adventure_stats_updated();

-- Create adventure statistics views
CREATE OR REPLACE VIEW adventure_stats_summary AS
SELECT 
  stat_type,
  stat_value,
  stat_description,
  last_updated,
  CASE 
    WHEN stat_type = 'journal_entries' THEN 1
    WHEN stat_type = 'places_explored' THEN 2
    WHEN stat_type = 'memory_tags' THEN 3
    WHEN stat_type = 'photos_captured' THEN 4
    WHEN stat_type = 'miles_traveled' THEN 5
    WHEN stat_type = 'munros_climbed' THEN 6
    WHEN stat_type = 'adventures_this_year' THEN 7
    WHEN stat_type = 'wildlife_spotted' THEN 8
    WHEN stat_type = 'castles_explored' THEN 9
    WHEN stat_type = 'weather_adventures' THEN 10
    ELSE 99
  END as display_order,
  CASE 
    WHEN stat_type IN ('journal_entries', 'places_explored', 'memory_tags', 'photos_captured') THEN true
    ELSE false
  END as is_primary_stat
FROM adventure_stats
ORDER BY display_order;

CREATE OR REPLACE VIEW primary_adventure_stats AS
SELECT 
  stat_type,
  stat_value,
  stat_description,
  last_updated
FROM adventure_stats
WHERE stat_type IN ('journal_entries', 'places_explored', 'memory_tags', 'photos_captured')
ORDER BY 
  CASE 
    WHEN stat_type = 'journal_entries' THEN 1
    WHEN stat_type = 'places_explored' THEN 2
    WHEN stat_type = 'memory_tags' THEN 3
    WHEN stat_type = 'photos_captured' THEN 4
  END;

-- Adventure stats functions
CREATE OR REPLACE FUNCTION increment_adventure_stat(
  p_stat_type TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS INTEGER AS $$
DECLARE
  new_value INTEGER;
BEGIN
  UPDATE adventure_stats 
  SET stat_value = stat_value + p_increment
  WHERE stat_type = p_stat_type
  RETURNING stat_value INTO new_value;
  
  IF NOT FOUND THEN
    INSERT INTO adventure_stats (stat_type, stat_value, stat_description)
    VALUES (p_stat_type, p_increment, 'Auto-generated stat')
    RETURNING stat_value INTO new_value;
  END IF;
  
  RETURN new_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_adventure_stat(
  p_stat_type TEXT,
  p_value INTEGER,
  p_description TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
BEGIN
  UPDATE adventure_stats 
  SET stat_value = p_value,
      stat_description = COALESCE(p_description, stat_description)
  WHERE stat_type = p_stat_type;
  
  IF NOT FOUND THEN
    INSERT INTO adventure_stats (stat_type, stat_value, stat_description)
    VALUES (p_stat_type, p_value, COALESCE(p_description, 'Custom stat'));
  END IF;
  
  RETURN p_value;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CASTLES & LOCHS TRACKING SYSTEM
-- ============================================

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

-- Create castle_visits table
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
    UNIQUE(castle_id)
);

-- Create loch_visits table
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
    UNIQUE(loch_id)
);

-- Create indexes for castles and lochs
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

-- Create triggers for castles and lochs
CREATE TRIGGER update_castles_updated_at BEFORE UPDATE ON castles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lochs_updated_at BEFORE UPDATE ON lochs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_castle_visits_updated_at BEFORE UPDATE ON castle_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loch_visits_updated_at BEFORE UPDATE ON loch_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for castle and loch statistics
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

-- ============================================
-- 5. ADVENTURE WISHLIST SYSTEM
-- ============================================

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

-- Create indexes for wishlist
CREATE INDEX IF NOT EXISTS idx_wishlist_priority ON wishlist_items(priority);
CREATE INDEX IF NOT EXISTS idx_wishlist_status ON wishlist_items(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_category ON wishlist_items(category);
CREATE INDEX IF NOT EXISTS idx_wishlist_votes ON wishlist_items(family_votes DESC);
CREATE INDEX IF NOT EXISTS idx_wishlist_created ON wishlist_items(created_at DESC);

-- Create trigger for wishlist
CREATE OR REPLACE FUNCTION update_wishlist_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_wishlist_items_updated_at ON wishlist_items;
CREATE TRIGGER update_wishlist_items_updated_at
    BEFORE UPDATE ON wishlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_wishlist_updated_at_column();

-- Enable Row Level Security for wishlist
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policy for wishlist
DROP POLICY IF EXISTS "Allow all operations on wishlist_items" ON wishlist_items;
CREATE POLICY "Allow all operations on wishlist_items" ON wishlist_items
    FOR ALL USING (true) WITH CHECK (true);

-- Create wishlist statistics view
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

-- ============================================
-- 6. RECENT ADVENTURES VIEWS
-- ============================================

-- Create recent adventures view
DROP VIEW IF EXISTS recent_adventures CASCADE;
CREATE VIEW recent_adventures AS
SELECT 
  id,
  title,
  location,
  date,
  weather,
  mood,
  tags,
  photos,
  content,
  created_at,
  TO_CHAR(date::date, 'DD Month YYYY') as formatted_date,
  CASE 
    WHEN photos IS NOT NULL AND array_length(photos, 1) > 0 
    THEN photos[1] 
    ELSE '/placeholder.svg' 
  END as featured_image,
  CASE 
    WHEN LENGTH(content) > 150 
    THEN LEFT(content, 150) || '...'
    ELSE content
  END as excerpt,
  COALESCE(array_length(photos, 1), 0) as photo_count,
  COALESCE(array_length(tags, 1), 0) as tag_count
FROM journal_entries
ORDER BY date DESC, created_at DESC
LIMIT 3;

-- Create comprehensive adventures view
DROP VIEW IF EXISTS adventures_with_metadata CASCADE;
CREATE VIEW adventures_with_metadata AS
SELECT 
  id,
  title,
  location,
  date,
  weather,
  mood,
  tags,
  photos,
  content,
  COALESCE(miles_traveled, 0) as miles_traveled,
  created_at,
  updated_at,
  TO_CHAR(date::date, 'DD Month YYYY') as formatted_date,
  TO_CHAR(date::date, 'FMMonth YYYY') as month_year,
  CASE 
    WHEN photos IS NOT NULL AND array_length(photos, 1) > 0 
    THEN photos[1] 
    ELSE '/placeholder.svg' 
  END as featured_image,
  CASE 
    WHEN LENGTH(content) > 200 
    THEN LEFT(content, 200) || '...'
    ELSE content
  END as excerpt,
  COALESCE(array_length(photos, 1), 0) as photo_count,
  COALESCE(array_length(tags, 1), 0) as tag_count,
  CASE
    WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
      ~ '.*(mountain|munro|ben |peak|summit|climb).*' THEN 'Mountain'
    WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
      ~ '.*(castle|fortress|palace|tower).*' THEN 'Historic'
    WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
      ~ '.*(loch|lake|water|coast|beach|sea).*' THEN 'Water'
    WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
      ~ '.*(city|town|urban|museum|shop).*' THEN 'Urban'
    WHEN LOWER(COALESCE(title, '') || ' ' || COALESCE(content, '') || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
      ~ '.*(forest|wood|nature|wildlife|park).*' THEN 'Nature'
    ELSE 'Adventure'
  END as adventure_type,
  CASE 
    WHEN EXTRACT(MONTH FROM date) IN (12, 1, 2) THEN 'Winter'
    WHEN EXTRACT(MONTH FROM date) IN (3, 4, 5) THEN 'Spring' 
    WHEN EXTRACT(MONTH FROM date) IN (6, 7, 8) THEN 'Summer'
    WHEN EXTRACT(MONTH FROM date) IN (9, 10, 11) THEN 'Autumn'
    ELSE 'Unknown'
  END as season,
  CASE
    WHEN date::date = CURRENT_DATE THEN 'Today'
    WHEN date::date = CURRENT_DATE - 1 THEN 'Yesterday'
    WHEN date::date > CURRENT_DATE - 7 THEN (CURRENT_DATE - date::date) || ' days ago'
    WHEN date::date > CURRENT_DATE - 30 THEN (CURRENT_DATE - date::date) || ' days ago'
    WHEN date::date > CURRENT_DATE - 365 THEN
      CASE
        WHEN (CURRENT_DATE - date::date) < 60 THEN '1 month ago'
        ELSE ROUND((CURRENT_DATE - date::date) / 30.0) || ' months ago'
      END
    ELSE ROUND((CURRENT_DATE - date::date) / 365.0) || ' year(s) ago'
  END as time_ago
FROM journal_entries
ORDER BY date DESC, created_at DESC;

-- Create additional views
DROP VIEW IF EXISTS adventure_type_stats CASCADE;
CREATE VIEW adventure_type_stats AS
SELECT 
  adventure_type,
  COUNT(*) as count,
  STRING_AGG(title, ', ') as examples
FROM adventures_with_metadata
GROUP BY adventure_type
ORDER BY count DESC;

DROP VIEW IF EXISTS monthly_adventure_summary CASCADE;
CREATE VIEW monthly_adventure_summary AS
SELECT 
  month_year,
  COUNT(*) as adventure_count,
  SUM(photo_count) as total_photos,
  SUM(tag_count) as total_tags,
  STRING_AGG(DISTINCT adventure_type, ', ') as adventure_types,
  AVG(miles_traveled) as avg_miles_traveled
FROM adventures_with_metadata
GROUP BY month_year, EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
ORDER BY EXTRACT(YEAR FROM date) DESC, EXTRACT(MONTH FROM date) DESC;

-- ============================================
-- 7. SAMPLE DATA
-- ============================================

-- Insert default family members
INSERT INTO family_members (name, role, bio, position_index, colors)
SELECT * FROM (VALUES
  ('Max Dorman', 'DAD', 'Adventure enthusiast and family trip organizer. Loves planning routes, discovering hidden gems, and capturing the perfect Highland sunset photos.', 0, '{"bg": "bg-gradient-to-br from-blue-50 to-indigo-100", "border": "border-blue-200/60", "accent": "from-blue-500 to-indigo-500"}'::jsonb),
  ('Charlotte Foster', 'MUM', 'Nature lover and family historian. Documents our adventures and ensures everyone stays safe while exploring Scotland''s wild landscapes.', 1, '{"bg": "bg-gradient-to-br from-rose-50 to-pink-100", "border": "border-rose-200/60", "accent": "from-rose-500 to-pink-500"}'::jsonb),
  ('Oscar', 'SON', 'Young explorer with boundless energy. Always the first to spot wildlife and loves climbing rocks and splashing in Highland streams.', 2, '{"bg": "bg-gradient-to-br from-green-50 to-emerald-100", "border": "border-green-200/60", "accent": "from-green-500 to-emerald-500"}'::jsonb),
  ('Rose', 'DAUGHTER', 'Curious adventurer who collects interesting stones and leaves. Has an amazing memory for the stories behind each place we visit.', 3, '{"bg": "bg-gradient-to-br from-purple-50 to-violet-100", "border": "border-purple-200/60", "accent": "from-purple-500 to-violet-500"}'::jsonb),
  ('Lola', 'DAUGHTER', 'Our youngest adventurer with the biggest smile. Brings joy to every journey and reminds us to appreciate the simple moments.', 4, '{"bg": "bg-gradient-to-br from-amber-50 to-yellow-100", "border": "border-amber-200/60", "accent": "from-amber-500 to-yellow-500"}'::jsonb)
) AS new_members(name, role, bio, position_index, colors)
WHERE NOT EXISTS (SELECT 1 FROM family_members);

-- Insert initial adventure statistics
INSERT INTO adventure_stats (stat_type, stat_value, stat_description)
VALUES 
  ('journal_entries', 3, 'Stories captured & memories preserved'),
  ('places_explored', 3, 'Across Scotland''s breathtaking landscapes'),
  ('memory_tags', 15, 'Special moments & magical experiences'),
  ('photos_captured', 6, 'Beautiful moments frozen in time'),
  ('miles_traveled', 255, 'Across Scotland''s stunning terrain'),
  ('munros_climbed', 1, 'Scottish peaks conquered together'),
  ('adventures_this_year', 3, 'Family expeditions & discoveries'),
  ('wildlife_spotted', 8, 'Amazing creatures encountered'),
  ('castles_explored', 1, 'Historic fortresses & legends'),
  ('weather_adventures', 3, 'Sunshine, rain & Scottish mists')
ON CONFLICT (stat_type) DO NOTHING;

-- Insert sample journal entries
INSERT INTO journal_entries (
    title, content, date, location, weather, mood, miles_traveled, 
    parking, dog_friendly, paid_activity, adult_tickets, child_tickets, 
    other_tickets, pet_notes, tags, photos
) VALUES 
(
    'Ben Nevis Summit - Our Greatest Challenge Yet!',
    'What an incredible day! After months of training, we finally conquered Ben Nevis. The views from the summit were absolutely breathtaking - you could see for miles across the Scottish Highlands. Little Oscar was such a trooper, and Bonnie our dog loved every minute of it. The weather was perfect - sunny skies and clear visibility. We started early at 6 AM and reached the summit by 1 PM. The descent was challenging but we all made it safely. This will forever be one of our most memorable family adventures!',
    '2025-01-10',
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
    'Dogs allowed off-lead on mountain paths, keep on lead near car park. Bring plenty of water for pets.',
    ARRAY['Mountain', 'Challenge', 'Family', 'Views', 'Achievement', 'Munro'],
    ARRAY['/placeholder.svg']
),
(
    'Magical Loch Lomond Picnic',
    'A perfect family day by the beautiful Loch Lomond. We found the most amazing spot for our picnic with stunning views across the water. The kids had so much fun skipping stones and exploring the shoreline. Rose collected some beautiful smooth pebbles, and Oscar spotted a family of ducks. Charlotte brought her famous sandwiches and we enjoyed them while watching the sunset paint the sky in amazing colors. The peaceful atmosphere was exactly what we needed after a busy week.',
    '2025-01-05',
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
    ARRAY['/placeholder.svg']
),
(
    'Edinburgh Castle - Step Back in Time',
    'Despite the Scottish drizzle, Edinburgh Castle was absolutely magical. The history here is incredible - you can really feel the centuries of stories within these ancient walls. The views over Edinburgh from the castle are spectacular, especially the view down the Royal Mile. We learned so much about Scottish history and the kids were fascinated by the Crown Jewels. The one o''clock gun was exciting! Max took some amazing photos of the castle against the dramatic cloudy sky.',
    '2025-01-01',
    'Edinburgh, Midlothian',
    '🌧️ Light Rain',
    '🤩 Amazed',
    123,
    '£12',
    false,
    true,
    '2 × £17.50',
    '3 × £10.50',
    '',
    'Unfortunately no dogs allowed inside castle grounds, but great walks nearby',
    ARRAY['History', 'Culture', 'City', 'Castle', 'Education'],
    ARRAY['/placeholder.svg']
);

-- Insert sample wishlist items
INSERT INTO wishlist_items (title, location, description, priority, status, estimated_cost, best_seasons, duration, category, family_votes, notes, target_date, researched) VALUES 
('Isle of Skye Adventure', 'Isle of Skye, Scotland', 'Explore the dramatic landscapes, fairy pools, and ancient castles of Skye', 'High', 'Researching', 1200, ARRAY['Spring', 'Summer', 'Autumn'], '5-7 days', 'Island', 5, 'Need to book accommodation early. Check ferry times. Visit Fairy Pools and Old Man of Storr.', '2025-07-15', true),
('Loch Ness & Highlands Tour', 'Scottish Highlands', 'Scenic drive through the Highlands with Loch Ness monster hunting', 'Medium', 'Planning', 900, ARRAY['Spring', 'Summer', 'Autumn'], '4-6 days', 'Nature', 4, 'Rent a car. Book Loch Ness cruise. Visit Urquhart Castle. Stop at whisky distillery.', NULL, false),
('Edinburgh Festival Fringe', 'Edinburgh, Scotland', 'Experience the world''s largest arts festival with family-friendly shows', 'Medium', 'Ready', 800, ARRAY['Summer'], '4-5 days', 'City', 3, 'Book shows in advance. Consider Royal Mile walking tour. Visit Edinburgh Castle.', '2025-08-10', true),
('Orkney Islands Exploration', 'Orkney, Scotland', 'Discover ancient history, stunning coastlines, and unique wildlife', 'Low', 'Researching', 1000, ARRAY['Summer'], '6-8 days', 'Island', 2, 'Ferry from mainland. Visit Skara Brae. Check puffin viewing seasons.', NULL, true);

-- ============================================
-- 8. PERMISSIONS & FINAL SETUP
-- ============================================

-- Grant permissions on all tables and views
GRANT ALL ON journal_entries TO authenticated, anon;
GRANT ALL ON family_members TO authenticated, anon;
GRANT ALL ON adventure_stats TO authenticated, anon;
GRANT ALL ON castles TO authenticated, anon;
GRANT ALL ON lochs TO authenticated, anon;
GRANT ALL ON castle_visits TO authenticated, anon;
GRANT ALL ON loch_visits TO authenticated, anon;
GRANT ALL ON wishlist_items TO authenticated, anon;

-- Grant permissions on views
GRANT SELECT ON journal_stats TO authenticated, anon;
GRANT SELECT ON family_members_with_stats TO authenticated, anon;
GRANT SELECT ON adventure_stats_summary TO authenticated, anon;
GRANT SELECT ON primary_adventure_stats TO authenticated, anon;
GRANT SELECT ON castle_visit_stats TO authenticated, anon;
GRANT SELECT ON loch_visit_stats TO authenticated, anon;
GRANT SELECT ON wishlist_stats TO authenticated, anon;
GRANT SELECT ON recent_adventures TO authenticated, anon;
GRANT SELECT ON adventures_with_metadata TO authenticated, anon;
GRANT SELECT ON adventure_type_stats TO authenticated, anon;
GRANT SELECT ON monthly_adventure_summary TO authenticated, anon;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION search_journal_entries(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_adventure_stat(TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION set_adventure_stat(TEXT, INTEGER, TEXT) TO authenticated, anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🏴󠁧󠁢󠁳󠁣󠁴󠁿 A Wee Adventure - Complete Database Schema Installed Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created Tables:';
    RAISE NOTICE '   • journal_entries (adventure logs)';
    RAISE NOTICE '   • family_members (profiles & avatars)';
    RAISE NOTICE '   • adventure_stats (dynamic statistics)';
    RAISE NOTICE '   • castles & lochs (tracking progress)';
    RAISE NOTICE '   • castle_visits & loch_visits (visit logs)';
    RAISE NOTICE '   • wishlist_items (trip planning)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Created Views:';
    RAISE NOTICE '   • Statistics and analytics views';
    RAISE NOTICE '   • Recent adventures & metadata';
    RAISE NOTICE '   • Progress tracking views';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sample Data Inserted:';
    RAISE NOTICE '   • 5 Family members (Max, Charlotte, Oscar, Rose, Lola)';
    RAISE NOTICE '   • 3 Sample journal entries';
    RAISE NOTICE '   • 10 Adventure statistics';
    RAISE NOTICE '   • 4 Wishlist items';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Ready for your Scottish adventures!';
    RAISE NOTICE '📱 Your app can now sync data across all devices!';
END $$;
