-- Auto-Update Adventure Statistics Triggers
-- Automatically updates adventure statistics when journal entries are modified

-- Create or update the adventure_stats table if it doesn't exist
CREATE TABLE IF NOT EXISTS adventure_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_type TEXT UNIQUE NOT NULL,
  stat_value INTEGER NOT NULL DEFAULT 0,
  stat_description TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE adventure_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
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

-- Function to recalculate all adventure statistics from journal entries
CREATE OR REPLACE FUNCTION recalculate_adventure_stats()
RETURNS VOID AS $$
DECLARE
  journal_count INTEGER;
  places_count INTEGER;
  tags_count INTEGER;
  photos_count INTEGER;
  miles_total INTEGER;
  munros_count INTEGER;
  castles_count INTEGER;
  wildlife_count INTEGER;
  current_year_count INTEGER;
  weather_count INTEGER;
BEGIN
  -- Calculate journal entries count
  SELECT COUNT(*) INTO journal_count FROM journal_entries;
  
  -- Calculate unique places explored
  SELECT COUNT(DISTINCT LOWER(TRIM(location))) INTO places_count 
  FROM journal_entries 
  WHERE location IS NOT NULL AND location != '';
  
  -- Calculate total memory tags
  SELECT COALESCE(SUM(array_length(tags, 1)), 0) INTO tags_count 
  FROM journal_entries 
  WHERE tags IS NOT NULL;
  
  -- Calculate total photos captured
  SELECT COALESCE(SUM(array_length(photos, 1)), 0) INTO photos_count 
  FROM journal_entries 
  WHERE photos IS NOT NULL;
  
  -- Calculate total miles traveled
  SELECT COALESCE(SUM(miles_traveled), 0) INTO miles_total 
  FROM journal_entries 
  WHERE miles_traveled IS NOT NULL;
  
  -- Calculate munros climbed (entries mentioning mountain keywords)
  SELECT COUNT(*) INTO munros_count 
  FROM journal_entries 
  WHERE LOWER(title || ' ' || content || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
    ~ '.*(munro|ben |mountain|peak|summit|cairn).*';
  
  -- Calculate castles explored
  SELECT COUNT(*) INTO castles_count 
  FROM journal_entries 
  WHERE LOWER(title || ' ' || content || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
    ~ '.*(castle|fortress|tower|keep|palace).*';
  
  -- Calculate wildlife spotted
  SELECT COUNT(*) INTO wildlife_count 
  FROM journal_entries 
  WHERE LOWER(title || ' ' || content || ' ' || array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')) 
    ~ '.*(deer|eagle|seal|dolphin|whale|bird|wildlife|animal|sheep|cow|horse|rabbit|fox).*';
  
  -- Calculate adventures this year
  SELECT COUNT(*) INTO current_year_count 
  FROM journal_entries 
  WHERE EXTRACT(YEAR FROM date::date) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Calculate unique weather experiences
  SELECT COUNT(DISTINCT LOWER(TRIM(weather))) INTO weather_count 
  FROM journal_entries 
  WHERE weather IS NOT NULL AND weather != '';

  -- Update or insert all statistics
  INSERT INTO adventure_stats (stat_type, stat_value, stat_description) VALUES
    ('journal_entries', journal_count, 'Stories captured & memories preserved'),
    ('places_explored', places_count, 'Across Scotland''s breathtaking landscapes'),
    ('memory_tags', tags_count, 'Special moments & magical experiences'),
    ('photos_captured', photos_count, 'Beautiful moments frozen in time'),
    ('miles_traveled', miles_total, 'Across Scotland''s stunning terrain'),
    ('munros_climbed', munros_count, 'Scottish peaks conquered together'),
    ('castles_explored', castles_count, 'Historic fortresses & legends'),
    ('wildlife_spotted', wildlife_count, 'Amazing creatures encountered'),
    ('adventures_this_year', current_year_count, 'Family expeditions & discoveries'),
    ('weather_adventures', weather_count, 'Sunshine, rain & Scottish mists')
  ON CONFLICT (stat_type) 
  DO UPDATE SET 
    stat_value = EXCLUDED.stat_value,
    last_updated = NOW();

  RAISE NOTICE 'Adventure statistics recalculated: % journal entries, % places, % tags, % photos', 
    journal_count, places_count, tags_count, photos_count;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger stats recalculation
CREATE OR REPLACE FUNCTION trigger_update_adventure_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate all stats when journal entries change
  PERFORM recalculate_adventure_stats();
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for journal entries table
DROP TRIGGER IF EXISTS trigger_journal_stats_insert ON journal_entries;
DROP TRIGGER IF EXISTS trigger_journal_stats_update ON journal_entries;
DROP TRIGGER IF EXISTS trigger_journal_stats_delete ON journal_entries;

CREATE TRIGGER trigger_journal_stats_insert
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_adventure_stats();

CREATE TRIGGER trigger_journal_stats_update
  AFTER UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_adventure_stats();

CREATE TRIGGER trigger_journal_stats_delete
  AFTER DELETE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_adventure_stats();

-- Create helpful views for querying stats
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

-- View for primary stats (the 4 shown by default)
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

-- View for expanded stats (the additional ones)
CREATE OR REPLACE VIEW expanded_adventure_stats AS
SELECT 
  stat_type,
  stat_value,
  stat_description,
  last_updated
FROM adventure_stats
WHERE stat_type IN ('miles_traveled', 'munros_climbed', 'adventures_this_year', 'wildlife_spotted', 'castles_explored', 'weather_adventures')
ORDER BY 
  CASE 
    WHEN stat_type = 'miles_traveled' THEN 1
    WHEN stat_type = 'munros_climbed' THEN 2
    WHEN stat_type = 'adventures_this_year' THEN 3
    WHEN stat_type = 'wildlife_spotted' THEN 4
    WHEN stat_type = 'castles_explored' THEN 5
    WHEN stat_type = 'weather_adventures' THEN 6
  END;

-- Function to manually refresh stats (useful for testing)
CREATE OR REPLACE FUNCTION refresh_adventure_stats()
RETURNS TABLE(stat_type text, old_value integer, new_value integer) AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Store old values
  CREATE TEMP TABLE old_stats AS 
  SELECT adventure_stats.stat_type, adventure_stats.stat_value as old_value 
  FROM adventure_stats;
  
  -- Recalculate
  PERFORM recalculate_adventure_stats();
  
  -- Return comparison
  RETURN QUERY
  SELECT 
    COALESCE(os.stat_type, ns.stat_type) as stat_type,
    COALESCE(os.old_value, 0) as old_value,
    COALESCE(ns.stat_value, 0) as new_value
  FROM old_stats os
  FULL OUTER JOIN adventure_stats ns ON os.stat_type = ns.stat_type
  ORDER BY ns.stat_type;
  
  DROP TABLE old_stats;
END;
$$ LANGUAGE plpgsql;

-- Initial calculation of all statistics
SELECT recalculate_adventure_stats();

-- Grant permissions
GRANT SELECT ON adventure_stats_summary TO PUBLIC;
GRANT SELECT ON primary_adventure_stats TO PUBLIC;
GRANT SELECT ON expanded_adventure_stats TO PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_adventure_stats() TO PUBLIC;
GRANT EXECUTE ON FUNCTION recalculate_adventure_stats() TO PUBLIC;

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Adventure statistics auto-update triggers created successfully!';
  RAISE NOTICE 'Your stats will now automatically update when you add/edit/delete journal entries.';
  RAISE NOTICE 'Use SELECT refresh_adventure_stats(); to manually recalculate all stats.';
END $$;
