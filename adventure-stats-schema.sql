-- Adventure Statistics Schema
-- Creates tables and views for dynamic adventure statistics that sync across devices

-- Enable Row Level Security
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    CREATE EXTENSION "uuid-ossp";
  END IF;
END $$;

-- Create adventure_stats table to track various metrics
CREATE TABLE IF NOT EXISTS adventure_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_type TEXT NOT NULL, -- 'journal_entries', 'places_visited', 'memory_tags', 'photos_captured', etc.
  stat_value INTEGER NOT NULL DEFAULT 0,
  stat_description TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_adventure_stats_type_unique ON adventure_stats(stat_type);
CREATE INDEX IF NOT EXISTS idx_adventure_stats_updated ON adventure_stats(last_updated);

-- Enable Row Level Security
ALTER TABLE adventure_stats ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (in production, you'd want more restrictive policies)
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

-- Function to update the last_updated timestamp
CREATE OR REPLACE FUNCTION update_adventure_stats_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last_updated
DROP TRIGGER IF EXISTS trigger_adventure_stats_updated ON adventure_stats;
CREATE TRIGGER trigger_adventure_stats_updated
  BEFORE UPDATE ON adventure_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_adventure_stats_updated();

-- Insert initial adventure statistics
INSERT INTO adventure_stats (stat_type, stat_value, stat_description)
VALUES 
  ('journal_entries', 6, 'Stories captured & memories preserved'),
  ('places_explored', 6, 'Across Scotland''s breathtaking landscapes'),
  ('memory_tags', 19, 'Special moments & magical experiences'),
  ('photos_captured', 127, 'Beautiful moments frozen in time'),
  ('miles_traveled', 342, 'Across Scotland''s stunning terrain'),
  ('munros_climbed', 3, 'Scottish peaks conquered together'),
  ('adventures_this_year', 12, 'Family expeditions & discoveries'),
  ('wildlife_spotted', 23, 'Amazing creatures encountered'),
  ('castles_explored', 4, 'Historic fortresses & legends'),
  ('weather_adventures', 8, 'Sunshine, rain & Scottish mists')
ON CONFLICT (stat_type) DO NOTHING;

-- Create a comprehensive view for all adventure statistics
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

-- Create a view for just the primary stats (the 4 shown by default)
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

-- Function to increment a specific stat
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

-- Function to set a specific stat value
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

-- Function to get total adventure count
CREATE OR REPLACE FUNCTION get_total_adventures() RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(stat_value), 0) 
    FROM adventure_stats 
    WHERE stat_type IN ('journal_entries', 'adventures_this_year')
  );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the views and functions
GRANT SELECT ON adventure_stats_summary TO PUBLIC;
GRANT SELECT ON primary_adventure_stats TO PUBLIC;
GRANT EXECUTE ON FUNCTION increment_adventure_stat(TEXT, INTEGER) TO PUBLIC;
GRANT EXECUTE ON FUNCTION set_adventure_stat(TEXT, INTEGER, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_total_adventures() TO PUBLIC;

-- Sample trigger to auto-update journal entries count
-- (This would be triggered when you add actual journal entries)
CREATE OR REPLACE FUNCTION update_journal_entries_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM increment_adventure_stat('journal_entries', 1);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM increment_adventure_stat('journal_entries', -1);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: Uncomment below when you have actual journal_entries table
-- DROP TRIGGER IF EXISTS trigger_update_journal_count ON journal_entries;
-- CREATE TRIGGER trigger_update_journal_count
--   AFTER INSERT OR DELETE ON journal_entries
--   FOR EACH ROW
--   EXECUTE FUNCTION update_journal_entries_count();

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Adventure Statistics database schema created successfully! Dynamic stats tracking enabled.';
END $$;
