-- ============================================
-- HASURA DATA RESTORE - Run these step by step
-- ============================================

-- STEP 1: Create castles table
CREATE TABLE IF NOT EXISTS castles (
    id text PRIMARY KEY,
    name text NOT NULL,
    region text NOT NULL,
    type text NOT NULL,
    built_century text NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    description text NOT NULL,
    visiting_info text NOT NULL,
    best_seasons text[],
    admission_fee text DEFAULT 'Free',
    managed_by text DEFAULT 'Historic Environment Scotland',
    rank integer NOT NULL,
    is_custom boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- STEP 2: Create lochs table
CREATE TABLE IF NOT EXISTS lochs (
    id text PRIMARY KEY,
    name text NOT NULL,
    region text NOT NULL,
    type text NOT NULL,
    length_km numeric,
    max_depth_m integer,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    description text NOT NULL,
    activities text[],
    best_seasons text[],
    famous_for text NOT NULL,
    nearest_town text NOT NULL,
    rank integer NOT NULL,
    is_custom boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- STEP 3: Create hidden_gems table
CREATE TABLE IF NOT EXISTS hidden_gems (
    id text PRIMARY KEY,
    name text NOT NULL,
    region text NOT NULL,
    type text NOT NULL,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    description text NOT NULL,
    how_to_find text NOT NULL,
    best_seasons text[],
    difficulty_level text DEFAULT 'Moderate',
    requires_hiking boolean DEFAULT false,
    nearest_town text NOT NULL,
    special_features text NOT NULL,
    photography_tips text NOT NULL,
    rank integer NOT NULL,
    is_custom boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- STEP 4: Insert basic castles
INSERT INTO castles (id, name, region, type, built_century, latitude, longitude, description, visiting_info, best_seasons, admission_fee, managed_by, rank) VALUES
('edinburgh-castle', 'Edinburgh Castle', 'Edinburgh', 'Royal Castle', '12th Century', 55.9486, -3.1999, 'Scotland''s most famous castle', 'Open daily', ARRAY['April','May','June','July','August','September'], 'Adult £19.50', 'Historic Environment Scotland', 1);

INSERT INTO castles (id, name, region, type, built_century, latitude, longitude, description, visiting_info, best_seasons, admission_fee, managed_by, rank) VALUES
('stirling-castle', 'Stirling Castle', 'Central Scotland', 'Royal Castle', '12th Century', 56.1244, -3.9486, 'One of Scotland''s grandest castles', 'Open daily', ARRAY['April','May','June','July','August','September'], 'Adult £16.00', 'Historic Environment Scotland', 2);

INSERT INTO castles (id, name, region, type, built_century, latitude, longitude, description, visiting_info, best_seasons, admission_fee, managed_by, rank) VALUES
('eilean-donan', 'Eilean Donan Castle', 'Highland', 'Clan Castle', '13th Century', 57.2741, -5.5164, 'Scotland''s most photographed castle', 'Open daily', ARRAY['April','May','June','July','August','September'], 'Adult £11.00', 'Private', 3);

-- STEP 5: Insert basic lochs
INSERT INTO lochs (id, name, region, type, length_km, max_depth_m, latitude, longitude, description, activities, best_seasons, famous_for, nearest_town, rank) VALUES
('loch-ness', 'Loch Ness', 'Highland', 'Freshwater Loch', 36.3, 230, 57.3229, -4.4244, 'Home of the legendary Loch Ness Monster', ARRAY['Monster spotting','Boat trips','Photography'], ARRAY['April','May','June','July','August','September'], 'The Loch Ness Monster', 'Inverness', 1);

INSERT INTO lochs (id, name, region, type, length_km, max_depth_m, latitude, longitude, description, activities, best_seasons, famous_for, nearest_town, rank) VALUES
('loch-lomond', 'Loch Lomond', 'Central Scotland', 'Freshwater Loch', 36.4, 190, 56.1089, -4.6206, 'Scotland''s largest loch by surface area', ARRAY['Boating','Swimming','Hiking'], ARRAY['April','May','June','July','August','September'], 'Largest loch and Bonnie Banks song', 'Balloch', 2);

INSERT INTO lochs (id, name, region, type, length_km, max_depth_m, latitude, longitude, description, activities, best_seasons, famous_for, nearest_town, rank) VALUES
('loch-katrine', 'Loch Katrine', 'Stirling', 'Freshwater Loch', 12.5, 151, 56.2567, -4.5789, 'Heart of the Trossachs', ARRAY['Steamship cruises','Cycling','Hiking'], ARRAY['April','May','June','July','August','September'], 'Lady of the Lake inspiration', 'Callander', 3);

-- STEP 6: Insert hidden gems
INSERT INTO hidden_gems (id, name, region, type, latitude, longitude, description, how_to_find, best_seasons, difficulty_level, requires_hiking, nearest_town, special_features, photography_tips, rank, is_custom) VALUES
('fairy-pools', 'Fairy Pools', 'Isle of Skye', 'Hidden Waterfall', 57.2425, -6.2684, 'Crystal clear pools and waterfalls', 'Follow path from Glenbrittle road car park', ARRAY['April','May','June','July','August','September'], 'Easy', true, 'Carbost', 'Crystal clear pools for wild swimming', 'Best light in early morning', 1, false);

INSERT INTO hidden_gems (id, name, region, type, latitude, longitude, description, how_to_find, best_seasons, difficulty_level, requires_hiking, nearest_town, special_features, photography_tips, rank, is_custom) VALUES
('quiraing', 'The Quiraing', 'Isle of Skye', 'Natural Wonder', 57.6433, -6.2725, 'Dramatic rocky landscape', 'Park at Quiraing car park off A855', ARRAY['May','June','July','August','September'], 'Moderate', true, 'Staffin', 'Unique geological formation', 'Stunning at sunrise and sunset', 2, false);

INSERT INTO hidden_gems (id, name, region, type, latitude, longitude, description, how_to_find, best_seasons, difficulty_level, requires_hiking, nearest_town, special_features, photography_tips, rank, is_custom) VALUES
('st-cyrus-beach', 'St Cyrus Beach', 'Aberdeenshire', 'Secret Beach', 56.7886, -2.4167, 'Hidden sandy beach with cliffs', 'Follow signs to St Cyrus Nature Reserve', ARRAY['All Year'], 'Easy', false, 'Montrose', 'Seal spotting and rare flowers', 'Great for wildlife photography', 3, false);
