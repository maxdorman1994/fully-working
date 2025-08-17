-- ============================================
-- Add is_custom column to existing munros table
-- ============================================
-- Run this simple fix in your Supabase SQL Editor

-- Add the missing is_custom column to existing munros table
ALTER TABLE munros ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Update existing munros to be marked as official (not custom)
UPDATE munros SET is_custom = FALSE WHERE is_custom IS NULL;

-- Update the views to handle custom munros
DROP VIEW IF EXISTS munro_stats;
CREATE OR REPLACE VIEW munro_stats AS
SELECT 
    COUNT(*) as total_munros,
    COUNT(DISTINCT region) as total_regions,
    COUNT(CASE WHEN difficulty = 'Easy' THEN 1 END) as easy_munros,
    COUNT(CASE WHEN difficulty = 'Moderate' THEN 1 END) as moderate_munros,
    COUNT(CASE WHEN difficulty = 'Hard' THEN 1 END) as hard_munros,
    COUNT(CASE WHEN difficulty = 'Extreme' THEN 1 END) as extreme_munros,
    COUNT(CASE WHEN is_custom = true THEN 1 END) as custom_munros,
    COUNT(CASE WHEN is_custom = false THEN 1 END) as official_munros,
    MIN(height) as lowest_munro,
    MAX(height) as highest_munro,
    AVG(height) as average_height
FROM munros;

DROP VIEW IF EXISTS munro_completion_stats;
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

-- Success message
SELECT 'is_custom column added successfully! Custom Munro functionality now enabled.' as status;
