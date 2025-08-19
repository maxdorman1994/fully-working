-- ============================================
-- Scottish Adventure App - Database Setup (FIXED)
-- ============================================
-- This version safely handles existing database objects

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. DROP EXISTING VIEWS SAFELY
-- ============================================
DROP VIEW IF EXISTS recent_adventures CASCADE;
DROP VIEW IF EXISTS adventures_with_metadata CASCADE;
DROP VIEW IF EXISTS adventure_type_stats CASCADE;
DROP VIEW IF EXISTS monthly_adventure_summary CASCADE;
DROP VIEW IF EXISTS family_members_with_stats CASCADE;
DROP VIEW IF EXISTS adventure_stats_summary CASCADE;
DROP VIEW IF EXISTS primary_adventure_stats CASCADE;

-- ============================================
-- 2. CREATE CORE TABLES
-- ============================================

-- Journal entries table
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
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family members table
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

-- Adventure stats table
CREATE TABLE IF NOT EXISTS adventure_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_type TEXT NOT NULL,
  stat_value INTEGER NOT NULL DEFAULT 0,
  stat_description TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for adventure_stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_adventure_stats_type_unique ON adventure_stats(stat_type);

-- Wishlist table
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

-- ============================================
-- 3. CREATE NEW VIEWS (SAFE)
-- ============================================

-- Family members view with avatar handling
CREATE VIEW family_members_with_stats AS
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

-- Recent adventures view (simplified)
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
  CASE
    WHEN date::date = CURRENT_DATE THEN 'Today'
    WHEN date::date = CURRENT_DATE - 1 THEN 'Yesterday'
    WHEN date::date > CURRENT_DATE - 7 THEN (CURRENT_DATE - date::date) || ' days ago'
    WHEN date::date > CURRENT_DATE - 30 THEN (CURRENT_DATE - date::date) || ' days ago'
    ELSE 'A while ago'
  END as time_ago
FROM journal_entries
ORDER BY date DESC, created_at DESC
LIMIT 3;

-- Adventure stats views
CREATE VIEW adventure_stats_summary AS
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
    ELSE 99
  END as display_order
FROM adventure_stats
ORDER BY display_order;

CREATE VIEW primary_adventure_stats AS
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

-- ============================================
-- 4. INSERT SAMPLE DATA (SAFE)
-- ============================================

-- Clear existing sample data first (optional)
-- DELETE FROM family_members WHERE name IN ('Max Dorman', 'Charlotte Foster', 'Oscar', 'Rose', 'Lola');

-- Insert family members
INSERT INTO family_members (name, role, bio, position_index, colors)
SELECT * FROM (VALUES
  ('Max Dorman', 'DAD', 'Adventure enthusiast and family trip organizer. Loves planning routes, discovering hidden gems, and capturing the perfect Highland sunset photos.', 0, '{"bg": "bg-gradient-to-br from-blue-50 to-indigo-100", "border": "border-blue-200/60", "accent": "from-blue-500 to-indigo-500"}'::jsonb),
  ('Charlotte Foster', 'MUM', 'Nature lover and family historian. Documents our adventures and ensures everyone stays safe while exploring Scotland''s wild landscapes.', 1, '{"bg": "bg-gradient-to-br from-rose-50 to-pink-100", "border": "border-rose-200/60", "accent": "from-rose-500 to-pink-500"}'::jsonb),
  ('Oscar', 'SON', 'Young explorer with boundless energy. Always the first to spot wildlife and loves climbing rocks and splashing in Highland streams.', 2, '{"bg": "bg-gradient-to-br from-green-50 to-emerald-100", "border": "border-green-200/60", "accent": "from-green-500 to-emerald-500"}'::jsonb),
  ('Rose', 'DAUGHTER', 'Curious adventurer who collects interesting stones and leaves. Has an amazing memory for the stories behind each place we visit.', 3, '{"bg": "bg-gradient-to-br from-purple-50 to-violet-100", "border": "border-purple-200/60", "accent": "from-purple-500 to-violet-500"}'::jsonb),
  ('Lola', 'DAUGHTER', 'Our youngest adventurer with the biggest smile. Brings joy to every journey and reminds us to appreciate the simple moments.', 4, '{"bg": "bg-gradient-to-br from-amber-50 to-yellow-100", "border": "border-amber-200/60", "accent": "from-amber-500 to-yellow-500"}'::jsonb)
) AS new_members(name, role, bio, position_index, colors)
WHERE NOT EXISTS (SELECT 1 FROM family_members WHERE name = new_members.name);

-- Insert or update adventure statistics
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
ON CONFLICT (stat_type) DO UPDATE SET 
  stat_value = EXCLUDED.stat_value,
  stat_description = EXCLUDED.stat_description,
  last_updated = NOW();

-- Insert sample journal entries (only if they don't exist)
INSERT INTO journal_entries (
    title, content, date, location, weather, mood, miles_traveled, 
    parking, dog_friendly, paid_activity, adult_tickets, child_tickets, 
    other_tickets, pet_notes, tags, photos
)
SELECT * FROM (VALUES
(
    'Ben Nevis Summit - Our Greatest Challenge Yet!',
    'What an incredible day! After months of training, we finally conquered Ben Nevis. The views from the summit were absolutely breathtaking - you could see for miles across the Scottish Highlands. Little Oscar was such a trooper, and Charlie our dog loved every minute of it. The weather was perfect - sunny skies and clear visibility.',
    '2025-01-10'::date,
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
    'A perfect family day by the beautiful Loch Lomond. We found the most amazing spot for our picnic with stunning views across the water. The kids had so much fun skipping stones and exploring the shoreline. Rose collected some beautiful smooth pebbles, and Oscar spotted a family of ducks.',
    '2025-01-05'::date,
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
    'Despite the Scottish drizzle, Edinburgh Castle was absolutely magical. The history here is incredible - you can really feel the centuries of stories within these ancient walls. The views over Edinburgh from the castle are spectacular, especially the view down the Royal Mile.',
    '2025-01-01'::date,
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
)
) AS new_entries(title, content, date, location, weather, mood, miles_traveled, parking, dog_friendly, paid_activity, adult_tickets, child_tickets, other_tickets, pet_notes, tags, photos)
WHERE NOT EXISTS (SELECT 1 FROM journal_entries WHERE title = new_entries.title);

-- Insert sample wishlist items
INSERT INTO wishlist_items (title, location, description, priority, status, estimated_cost, best_seasons, duration, category, family_votes, notes)
SELECT * FROM (VALUES
('Isle of Skye Adventure', 'Isle of Skye, Scotland', 'Explore the dramatic landscapes, fairy pools, and ancient castles of Skye', 'High', 'Researching', 1200, ARRAY['Spring', 'Summer', 'Autumn'], '5-7 days', 'Island', 5, 'Need to book accommodation early. Check ferry times.'),
('Loch Ness & Highlands Tour', 'Scottish Highlands', 'Scenic drive through the Highlands with Loch Ness monster hunting', 'Medium', 'Planning', 900, ARRAY['Spring', 'Summer', 'Autumn'], '4-6 days', 'Nature', 4, 'Rent a car. Book Loch Ness cruise.'),
('Edinburgh Festival Fringe', 'Edinburgh, Scotland', 'Experience the world''s largest arts festival with family-friendly shows', 'Medium', 'Ready', 800, ARRAY['Summer'], '4-5 days', 'City', 3, 'Book shows in advance. Consider Royal Mile walking tour.'),
('Orkney Islands Exploration', 'Orkney, Scotland', 'Discover ancient history, stunning coastlines, and unique wildlife', 'Low', 'Researching', 1000, ARRAY['Summer'], '6-8 days', 'Island', 2, 'Ferry from mainland. Visit Skara Brae.')
) AS new_wishlist(title, location, description, priority, status, estimated_cost, best_seasons, duration, category, family_votes, notes)
WHERE NOT EXISTS (SELECT 1 FROM wishlist_items WHERE title = new_wishlist.title);

-- ============================================
-- 5. SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scottish Adventure Database Setup Complete!';
    RAISE NOTICE '✅ Core tables ready: journal_entries, family_members, adventure_stats, wishlist_items';
    RAISE NOTICE '✅ Views created safely: family_members_with_stats, recent_adventures, adventure_stats_summary';
    RAISE NOTICE '✅ Sample data inserted (no duplicates)';
    RAISE NOTICE '🎯 Your app should now work with real database data!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Check your app homepage';
    RAISE NOTICE '2. Try adding journal entries';
    RAISE NOTICE '3. Upload family photos';
END $$;
