-- ============================================
-- Fix RLS Policies for Custom Item Creation
-- This app uses custom auth (not Supabase auth), so we need to disable RLS
-- or use policies that don't depend on Supabase auth functions
-- ============================================

-- Disable RLS on main tables to allow custom item creation
-- Since this app uses family sharing and custom auth, we'll disable RLS
ALTER TABLE castles DISABLE ROW LEVEL SECURITY;
ALTER TABLE lochs DISABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_gems DISABLE ROW LEVEL SECURITY;
ALTER TABLE castle_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE loch_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_gem_visits DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies since we're disabling RLS
DROP POLICY IF EXISTS "Castles are viewable by everyone" ON castles;
DROP POLICY IF EXISTS "Custom castles insertable by authenticated users" ON castles;
DROP POLICY IF EXISTS "Lochs are viewable by everyone" ON lochs;
DROP POLICY IF EXISTS "Custom lochs insertable by authenticated users" ON lochs;
DROP POLICY IF EXISTS "Hidden gems are viewable by everyone" ON hidden_gems;
DROP POLICY IF EXISTS "Custom hidden gems insertable by authenticated users" ON hidden_gems;
DROP POLICY IF EXISTS "Hidden gems are viewable by authenticated users" ON hidden_gems;
DROP POLICY IF EXISTS "Hidden gems are insertable by authenticated users" ON hidden_gems;
DROP POLICY IF EXISTS "Users can view own hidden gem visits" ON hidden_gem_visits;
DROP POLICY IF EXISTS "Users can insert own hidden gem visits" ON hidden_gem_visits;
DROP POLICY IF EXISTS "Users can update own hidden gem visits" ON hidden_gem_visits;
DROP POLICY IF EXISTS "Users can delete own hidden gem visits" ON hidden_gem_visits;
DROP POLICY IF EXISTS "Castle visits viewable by users" ON castle_visits;
DROP POLICY IF EXISTS "Castle visits insertable by users" ON castle_visits;
DROP POLICY IF EXISTS "Castle visits updatable by users" ON castle_visits;
DROP POLICY IF EXISTS "Castle visits deletable by users" ON castle_visits;
DROP POLICY IF EXISTS "Loch visits viewable by users" ON loch_visits;
DROP POLICY IF EXISTS "Loch visits insertable by users" ON loch_visits;
DROP POLICY IF EXISTS "Loch visits updatable by users" ON loch_visits;
DROP POLICY IF EXISTS "Loch visits deletable by users" ON loch_visits;

-- Success message
SELECT 'RLS disabled for custom item creation. Custom items should now work!' as status;
