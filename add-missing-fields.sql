-- Add missing fields to journal_entries table for Hasura compatibility

-- Add scenic drive fields
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS is_scenic_drive BOOLEAN DEFAULT false;

ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS scenic_stops TEXT[] DEFAULT '{}';

-- Update the Hasura GraphQL mutation to include these fields
-- You'll need to run this SQL in your Hasura console or directly in your database

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Added missing fields to journal_entries table:';
    RAISE NOTICE '   • is_scenic_drive (boolean)';
    RAISE NOTICE '   • scenic_stops (text array)';
    RAISE NOTICE 'Journal entries should now work properly!';
END $$;
