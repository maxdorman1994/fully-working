-- Recent Adventures View (Fixed Version)
-- Creates views to fetch the most recent journal entries for the home page
-- This version includes proper error handling and checks for table existence

-- First, check if journal_entries table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
    RAISE EXCEPTION 'journal_entries table does not exist. Please run setup-database.sql first.';
  END IF;
END $$;

-- Create a view for recent adventures (latest 3 journal entries)
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
  -- Format the date nicely for display
  TO_CHAR(date::date, 'DD Month YYYY') as formatted_date,
  -- Get the first photo as the featured image
  CASE 
    WHEN photos IS NOT NULL AND array_length(photos, 1) > 0 
    THEN photos[1] 
    ELSE '/placeholder.svg' 
  END as featured_image,
  -- Create a short excerpt from content
  CASE 
    WHEN LENGTH(content) > 150 
    THEN LEFT(content, 150) || '...'
    ELSE content
  END as excerpt,
  -- Count photos for display
  COALESCE(array_length(photos, 1), 0) as photo_count,
  -- Count tags for display  
  COALESCE(array_length(tags, 1), 0) as tag_count
FROM journal_entries
ORDER BY date DESC, created_at DESC
LIMIT 3;

-- Create a view for all adventures with additional metadata
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
  -- Format the date nicely
  TO_CHAR(date::date, 'DD Month YYYY') as formatted_date,
  TO_CHAR(date::date, 'FMMonth YYYY') as month_year,
  -- Get featured image
  CASE 
    WHEN photos IS NOT NULL AND array_length(photos, 1) > 0 
    THEN photos[1] 
    ELSE '/placeholder.svg' 
  END as featured_image,
  -- Create excerpt
  CASE 
    WHEN LENGTH(content) > 200 
    THEN LEFT(content, 200) || '...'
    ELSE content
  END as excerpt,
  -- Metadata counts
  COALESCE(array_length(photos, 1), 0) as photo_count,
  COALESCE(array_length(tags, 1), 0) as tag_count,
  -- Adventure type classification based on tags and content
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
  -- Season classification
  CASE 
    WHEN EXTRACT(MONTH FROM date) IN (12, 1, 2) THEN 'Winter'
    WHEN EXTRACT(MONTH FROM date) IN (3, 4, 5) THEN 'Spring' 
    WHEN EXTRACT(MONTH FROM date) IN (6, 7, 8) THEN 'Summer'
    WHEN EXTRACT(MONTH FROM date) IN (9, 10, 11) THEN 'Autumn'
    ELSE 'Unknown'
  END as season,
  -- Time since adventure (fixed version)
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

-- Function to get recent adventures with fallback data
DROP FUNCTION IF EXISTS get_recent_adventures_with_fallback();
CREATE OR REPLACE FUNCTION get_recent_adventures_with_fallback()
RETURNS TABLE(
  id text,
  title text,
  location text,
  formatted_date text,
  featured_image text,
  tags text[],
  adventure_type text,
  photo_count integer,
  excerpt text
) AS $$
BEGIN
  -- Try to get real recent adventures
  RETURN QUERY
  SELECT 
    ra.id::text,
    ra.title,
    ra.location,
    ra.formatted_date,
    ra.featured_image,
    ra.tags,
    COALESCE(am.adventure_type, 'Adventure') as adventure_type,
    ra.photo_count,
    ra.excerpt
  FROM recent_adventures ra
  LEFT JOIN adventures_with_metadata am ON ra.id = am.id;
  
  -- If no adventures found, return empty (component will use fallback)
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- View for adventure statistics by type
DROP VIEW IF EXISTS adventure_type_stats CASCADE;
CREATE VIEW adventure_type_stats AS
SELECT 
  adventure_type,
  COUNT(*) as count,
  STRING_AGG(title, ', ') as examples
FROM adventures_with_metadata
GROUP BY adventure_type
ORDER BY count DESC;

-- View for monthly adventure summary
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

-- Function to refresh recent adventures (useful for testing)
DROP FUNCTION IF EXISTS refresh_recent_adventures();
CREATE OR REPLACE FUNCTION refresh_recent_adventures()
RETURNS TABLE(
  total_adventures integer,
  recent_count integer,
  latest_adventure text,
  oldest_adventure text
) AS $$
DECLARE
  total_count integer;
  recent_count integer;
  latest_title text;
  oldest_title text;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO total_count FROM journal_entries;
  
  -- Get recent count (last 30 days)
  SELECT COUNT(*) INTO recent_count 
  FROM journal_entries 
  WHERE date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Get latest adventure title
  SELECT title INTO latest_title 
  FROM journal_entries 
  ORDER BY date DESC, created_at DESC 
  LIMIT 1;
  
  -- Get oldest adventure title
  SELECT title INTO oldest_title 
  FROM journal_entries 
  ORDER BY date ASC, created_at ASC 
  LIMIT 1;
  
  RETURN QUERY SELECT total_count, recent_count, COALESCE(latest_title, 'None'), COALESCE(oldest_title, 'None');
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (more explicit)
GRANT SELECT ON recent_adventures TO anon, authenticated;
GRANT SELECT ON adventures_with_metadata TO anon, authenticated;
GRANT SELECT ON adventure_type_stats TO anon, authenticated;
GRANT SELECT ON monthly_adventure_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_recent_adventures_with_fallback() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_recent_adventures() TO anon, authenticated;

-- Test the views with comprehensive checks
DO $$ 
DECLARE
  adventure_count integer;
  view_exists boolean;
BEGIN
  -- Check if the views were created successfully
  SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_name = 'recent_adventures'
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    RAISE EXCEPTION 'Failed to create recent_adventures view';
  END IF;

  -- Check if we have any adventures
  SELECT COUNT(*) INTO adventure_count FROM journal_entries;
  
  IF adventure_count > 0 THEN
    RAISE NOTICE '✅ Recent Adventures views created successfully!';
    RAISE NOTICE 'Found % adventure(s) in your journal.', adventure_count;
    RAISE NOTICE 'Test queries:';
    RAISE NOTICE '  SELECT * FROM recent_adventures;';
    RAISE NOTICE '  SELECT * FROM refresh_recent_adventures();';
  ELSE
    RAISE NOTICE '✅ Recent Adventures views created successfully!';
    RAISE NOTICE 'No adventures found yet. Add some journal entries to see them appear!';
  END IF;
  
  -- Test the function works
  PERFORM refresh_recent_adventures();
  RAISE NOTICE '✅ All functions and views are working correctly!';
END $$;
