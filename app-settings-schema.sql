-- App Settings Table for Cross-Device Sync
-- Stores application-wide settings like logo, theme, etc.

-- Drop existing table if it exists (for development)
DROP TABLE IF EXISTS app_settings CASCADE;

-- Create app_settings table
CREATE TABLE app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    logo_url TEXT NOT NULL DEFAULT '/placeholder.svg',
    app_title TEXT NOT NULL DEFAULT 'A Wee Adventure',
    theme_color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public app settings)
DROP POLICY IF EXISTS "Allow all operations on app_settings" ON app_settings;
CREATE POLICY "Allow all operations on app_settings" ON app_settings FOR ALL USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();

-- Insert default settings (only if no settings exist)
INSERT INTO app_settings (logo_url, app_title, theme_color)
SELECT '/placeholder.svg', 'A Wee Adventure', '#3B82F6'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- Grant permissions for the authenticated role
GRANT ALL ON app_settings TO authenticated;
GRANT ALL ON app_settings TO anon;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_app_settings_updated_at ON app_settings(updated_at);

-- Enable real-time subscriptions for this table
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;

-- Show final table structure
\d app_settings;

-- Show current data
SELECT * FROM app_settings;
