-- Family Members Profile Pictures Schema
-- Creates tables and views for cross-device sync of family member profile pictures

-- Enable Row Level Security
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    CREATE EXTENSION "uuid-ossp";
  END IF;
END $$;

-- Create family_members table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_family_members_position ON family_members(position_index);
CREATE INDEX IF NOT EXISTS idx_family_members_name ON family_members(name);

-- Enable Row Level Security (allow all operations for now)
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (in production, you'd want more restrictive policies)
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

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_family_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_family_members_updated_at ON family_members;
CREATE TRIGGER trigger_family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_family_members_updated_at();

-- Insert default family members data if table is empty
INSERT INTO family_members (name, role, bio, position_index, colors)
SELECT * FROM (VALUES
  ('Max Dorman', 'DAD', 'Adventure enthusiast and family trip organizer. Loves planning routes, discovering hidden gems, and capturing the perfect Highland sunset photos.', 0, '{"bg": "bg-gradient-to-br from-blue-50 to-indigo-100", "border": "border-blue-200/60", "accent": "from-blue-500 to-indigo-500"}'::jsonb),
  ('Charlotte Foster', 'MUM', 'Nature lover and family historian. Documents our adventures and ensures everyone stays safe while exploring Scotland''s wild landscapes.', 1, '{"bg": "bg-gradient-to-br from-rose-50 to-pink-100", "border": "border-rose-200/60", "accent": "from-rose-500 to-pink-500"}'::jsonb),
  ('Oscar', 'SON', 'Young explorer with boundless energy. Always the first to spot wildlife and loves climbing rocks and splashing in Highland streams.', 2, '{"bg": "bg-gradient-to-br from-green-50 to-emerald-100", "border": "border-green-200/60", "accent": "from-green-500 to-emerald-500"}'::jsonb),
  ('Rose', 'DAUGHTER', 'Curious adventurer who collects interesting stones and leaves. Has an amazing memory for the stories behind each place we visit.', 3, '{"bg": "bg-gradient-to-br from-purple-50 to-violet-100", "border": "border-purple-200/60", "accent": "from-purple-500 to-violet-500"}'::jsonb),
  ('Lola', 'DAUGHTER', 'Our youngest adventurer with the biggest smile. Brings joy to every journey and reminds us to appreciate the simple moments.', 4, '{"bg": "bg-gradient-to-br from-amber-50 to-yellow-100", "border": "border-amber-200/60", "accent": "from-amber-500 to-yellow-500"}'::jsonb)
) AS new_members(name, role, bio, position_index, colors)
WHERE NOT EXISTS (SELECT 1 FROM family_members);

-- Create a view for easy family member retrieval with statistics
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

-- Grant permissions for the view
GRANT SELECT ON family_members_with_stats TO PUBLIC;

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Family Members database schema created successfully! Cross-device profile sync enabled.';
END $$;
