-- ============================================
-- Castles and Lochs Tracking Database Schema for Supabase
-- Famous Scottish Castles and Top Ten Lochs
-- ============================================
-- Copy and paste this entire code into your Supabase SQL Editor and click "Run"

-- Create castles table
CREATE TABLE IF NOT EXISTS castles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Royal Castle', 'Historic Fortress', 'Clan Castle', 'Ruin', 'Palace')),
    built_century TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT NOT NULL,
    visiting_info TEXT NOT NULL,
    best_seasons TEXT[] NOT NULL,
    admission_fee TEXT DEFAULT 'Free',
    managed_by TEXT DEFAULT 'Historic Environment Scotland',
    accessibility TEXT DEFAULT 'Check individual castle details',
    rank INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lochs table
CREATE TABLE IF NOT EXISTS lochs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Freshwater Loch', 'Sea Loch', 'Tidal Loch')),
    length_km DECIMAL(6, 2),
    max_depth_m INTEGER,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT NOT NULL,
    activities TEXT[] NOT NULL,
    best_seasons TEXT[] NOT NULL,
    famous_for TEXT NOT NULL,
    nearest_town TEXT NOT NULL,
    rank INTEGER NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create castle_visits table to track user progress
CREATE TABLE IF NOT EXISTS castle_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    castle_id TEXT NOT NULL REFERENCES castles(id) ON DELETE CASCADE,
    visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    photo_count INTEGER DEFAULT 0,
    weather_conditions TEXT DEFAULT '',
    visit_duration TEXT DEFAULT '',
    favorite_part TEXT DEFAULT '',
    would_recommend BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one visit record per castle (for family sharing)
    UNIQUE(castle_id)
);

-- Create loch_visits table to track user progress
CREATE TABLE IF NOT EXISTS loch_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loch_id TEXT NOT NULL REFERENCES lochs(id) ON DELETE CASCADE,
    visited_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    photo_count INTEGER DEFAULT 0,
    weather_conditions TEXT DEFAULT '',
    activities_done TEXT[] DEFAULT '{}',
    water_temperature TEXT DEFAULT '',
    wildlife_spotted TEXT[] DEFAULT '{}',
    would_recommend BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one visit record per loch (for family sharing)
    UNIQUE(loch_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_castles_region ON castles(region);
CREATE INDEX IF NOT EXISTS idx_castles_type ON castles(type);
CREATE INDEX IF NOT EXISTS idx_castles_century ON castles(built_century);
CREATE INDEX IF NOT EXISTS idx_castles_rank ON castles(rank);
CREATE INDEX IF NOT EXISTS idx_castles_custom ON castles(is_custom);

CREATE INDEX IF NOT EXISTS idx_lochs_region ON lochs(region);
CREATE INDEX IF NOT EXISTS idx_lochs_type ON lochs(type);
CREATE INDEX IF NOT EXISTS idx_lochs_rank ON lochs(rank);
CREATE INDEX IF NOT EXISTS idx_lochs_custom ON lochs(is_custom);

CREATE INDEX IF NOT EXISTS idx_castle_visits_date ON castle_visits(visited_date DESC);
CREATE INDEX IF NOT EXISTS idx_castle_visits_castle_id ON castle_visits(castle_id);

CREATE INDEX IF NOT EXISTS idx_loch_visits_date ON loch_visits(visited_date DESC);
CREATE INDEX IF NOT EXISTS idx_loch_visits_loch_id ON loch_visits(loch_id);

-- Create a view for castle visit statistics
CREATE OR REPLACE VIEW castle_visit_stats AS
SELECT 
    COUNT(cv.id) AS visited_count,
    (SELECT COUNT(*) FROM castles WHERE NOT is_custom) AS total_castles,
    ROUND((COUNT(cv.id)::numeric / NULLIF((SELECT COUNT(*) FROM castles WHERE NOT is_custom), 0)) * 100, 1) AS completion_percentage,
    COUNT(cv.id) FILTER (WHERE cv.photo_count > 0) AS castles_with_photos,
    SUM(cv.photo_count) AS total_photos,
    MIN(cv.visited_date) AS first_visit,
    MAX(cv.visited_date) AS latest_visit,
    COUNT(cv.id) FILTER (WHERE cv.would_recommend = true) AS recommended_count
FROM castle_visits cv;

-- Create a view for loch visit statistics  
CREATE OR REPLACE VIEW loch_visit_stats AS
SELECT 
    COUNT(lv.id) AS visited_count,
    (SELECT COUNT(*) FROM lochs WHERE NOT is_custom) AS total_lochs,
    ROUND((COUNT(lv.id)::numeric / NULLIF((SELECT COUNT(*) FROM lochs WHERE NOT is_custom), 0)) * 100, 1) AS completion_percentage,
    COUNT(lv.id) FILTER (WHERE lv.photo_count > 0) AS lochs_with_photos,
    SUM(lv.photo_count) AS total_photos,
    MIN(lv.visited_date) AS first_visit,
    MAX(lv.visited_date) AS latest_visit,
    COUNT(lv.id) FILTER (WHERE lv.would_recommend = true) AS recommended_count
FROM loch_visits lv;

-- Insert 100 famous Scottish castles
INSERT INTO castles (id, name, region, type, built_century, latitude, longitude, description, visiting_info, best_seasons, admission_fee, managed_by, rank) VALUES
('1', 'Edinburgh Castle', 'Edinburgh', 'Royal Castle', '12th Century', 55.9486, -3.1999, 'Scotland''s most famous castle, perched on Castle Rock overlooking the capital. Home to the Crown Jewels, Stone of Destiny, and the One O''Clock Gun.', 'Open daily with timed entry tickets. Allow 2-3 hours for full visit.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £19.50', 'Historic Environment Scotland', 1),
('2', 'Stirling Castle', 'Stirling', 'Royal Castle', '12th Century', 56.1242, -3.9456, 'One of Scotland''s grandest castles with spectacular views. Witness to many pivotal moments in Scottish history including battles and royal ceremonies.', 'Open daily. Great for families with interactive exhibits and costumed interpreters.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £16.00', 'Historic Environment Scotland', 2),
('3', 'Eilean Donan Castle', 'Highland', 'Clan Castle', '13th Century', 57.2742, -5.5164, 'Scotland''s most photographed castle, situated on a small tidal island. Featured in countless films and offering breathtaking Highland scenery.', 'Open March to October. Popular for weddings and photography. Book ahead in summer.', '{"May", "June", "July", "August", "September"}', 'Adult £10.00', 'Private', 3),
('4', 'Urquhart Castle', 'Highland', 'Historic Fortress', '13th Century', 57.3230, -4.4364, 'Dramatic ruins overlooking Loch Ness. Perfect for monster spotting! One of Scotland''s largest castles with a fascinating visitor centre.', 'Open daily with excellent visitor centre. Great views over Loch Ness.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £11.00', 'Historic Environment Scotland', 4),
('5', 'Caerlaverock Castle', 'Dumfries and Galloway', 'Historic Fortress', '13th Century', 55.0057, -3.5262, 'Unique triangular castle with impressive twin-towered gatehouse. Surrounded by a water-filled moat and set in beautiful countryside.', 'Open daily. Family-friendly with nature reserve nearby. Medieval siege machine demonstrations.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 5),
('6', 'Dunnottar Castle', 'Aberdeenshire', 'Historic Fortress', '14th Century', 56.9461, -2.1969, 'Dramatic clifftop ruins where the Scottish Crown Jewels were once hidden. Spectacular coastal location with breathtaking views.', 'Open daily. Steep walk down to castle. Stunning photography opportunities.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £7.00', 'Private', 6),
('7', 'Glamis Castle', 'Angus', 'Royal Castle', '14th Century', 56.6206, -3.0186, 'Childhood home of the Queen Mother and birthplace of Princess Margaret. Beautiful fairy-tale castle with magnificent gardens.', 'Guided tours of castle and grounds. Famous for its ghosts and royal connections.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £15.50', 'Private', 7),
('8', 'Culzean Castle', 'South Ayrshire', 'Palace', '18th Century', 55.3494, -4.7894, 'Elegant castle designed by Robert Adam, perched on dramatic cliffs. Beautiful country park with beaches and woodland walks.', 'Castle and country park. Perfect for families. Eisenhower exhibition.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £18.50', 'National Trust for Scotland', 8),
('9', 'Inveraray Castle', 'Argyll and Bute', 'Clan Castle', '18th Century', 56.2332, -5.0743, 'Fairy-tale castle and ancestral home of the Duke of Argyll. Beautiful lakeside location with stunning interiors and armory.', 'Open April to October. Famous for Downton Abbey filming. Beautiful gardens.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £13.00', 'Private', 9),
('10', 'Balmoral Castle', 'Aberdeenshire', 'Royal Castle', '19th Century', 57.0435, -3.2269, 'The Royal Family''s private residence in Scotland. Beautiful estate with gardens, exhibitions and stunning Highland scenery.', 'Open April to July only. Ballroom and grounds. Book exhibitions in advance.', '{"April", "May", "June", "July"}', 'Adult £15.00', 'Royal Family', 10),
('11', 'Craigievar Castle', 'Aberdeenshire', 'Historic Fortress', '17th Century', 57.2089, -2.6789, 'Pink fairy-tale castle that inspired Disney. Remarkable seven-story tower house with original painted ceilings.', 'Limited access - exterior viewing and some interior tours. Very popular.', '{"May", "June", "July", "August", "September"}', 'Adult £12.00', 'National Trust for Scotland', 11),
('12', 'Cawdor Castle', 'Highland', 'Clan Castle', '14th Century', 57.5055, -3.9989, 'Beautiful castle associated with Shakespeare''s Macbeth. Stunning gardens and fascinating family history.', 'Open May to October. Private family home with beautiful gardens.', '{"May", "June", "July", "August", "September", "October"}', 'Adult £12.00', 'Private', 12),
('13', 'Castle Fraser', 'Aberdeenshire', 'Historic Fortress', '16th Century', 57.2856, -2.5198, 'Spectacular Z-plan castle, one of the most elaborate tower houses in Scotland. Beautiful parkland and walled garden.', 'Open Easter to October. Family-friendly with adventure playground.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £12.50', 'National Trust for Scotland', 13),
('14', 'Floors Castle', 'Scottish Borders', 'Palace', '18th Century', 55.6067, -2.4567, 'Scotland''s largest inhabited castle, home to the Duke of Roxburghe. Magnificent art collection and beautiful gardens.', 'Open Easter to October. Family home with excellent tearoom.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £12.00', 'Private', 14),
('15', 'Tantallon Castle', 'East Lothian', 'Historic Fortress', '14th Century', 56.0572, -2.6478, 'Spectacular clifftop fortress facing the Bass Rock. Massive red sandstone walls and dramatic coastal setting.', 'Open daily. Excellent for photography and birdwatching. Windy location!', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 15),
('16', 'Doune Castle', 'Stirling', 'Historic Fortress', '14th Century', 56.1859, -4.0506, 'Well-preserved medieval castle famous for Monty Python and Outlander filming. Excellent audio guide narrated by Terry Jones.', 'Open daily. Famous film location. Interactive audio guide included.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 16),
('17', 'Kilchurn Castle', 'Argyll and Bute', 'Clan Castle', '15th Century', 56.4089, -5.0267, 'Romantic ruins on Loch Awe with stunning mountain backdrop. One of Scotland''s most photographed castle ruins.', 'Seasonal access. Free entry. Beautiful for photography. Can be reached by boat.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Free', 'Historic Environment Scotland', 17),
('18', 'Blackness Castle', 'West Lothian', 'Historic Fortress', '15th Century', 55.9825, -3.5156, 'Ship-shaped fortress on the Forth, nicknamed "the ship that never sailed". Featured in Outlander as Fort William.', 'Open daily. Unusual ship-like design. Great views over the Forth.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 18),
('19', 'Crathes Castle', 'Aberdeenshire', 'Historic Fortress', '16th Century', 57.0978, -2.5267, 'Beautiful tower house with remarkable painted ceilings and stunning gardens. Famous for its topiary and herbaceous borders.', 'Open daily. Magnificent gardens. Family-friendly with adventure playground.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £13.50', 'National Trust for Scotland', 19),
('20', 'Duart Castle', 'Isle of Mull', 'Clan Castle', '13th Century', 56.4556, -5.6578, 'Ancestral seat of Clan MacLean on dramatic clifftop overlooking the Sound of Mull. Recently restored with clan exhibitions.', 'Open May to October. Spectacular location. Rich clan history.', '{"May", "June", "July", "August", "September", "October"}', 'Adult £7.50', 'Private', 20),
('21', 'Dunrobin Castle', 'Highland', 'Palace', '13th Century', 57.9779, -3.9483, 'Fairy-tale castle with formal gardens overlooking the North Sea. Seat of the Earl of Sutherland with impressive falconry displays.', 'Open April to October. Magnificent gardens and falconry shows. Museum and tearoom.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £14.00', 'Private', 21),
('22', 'Brodick Castle', 'North Ayrshire', 'Clan Castle', '13th Century', 55.5833, -5.1500, 'Historic castle on the Isle of Arran with stunning gardens. Former seat of the Dukes of Hamilton with Victorian additions.', 'Open April to October. Beautiful woodland and formal gardens. Ferry access from mainland.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £13.50', 'National Trust for Scotland', 22),
('23', 'Huntly Castle', 'Aberdeenshire', 'Historic Fortress', '12th Century', 57.4439, -2.7806, 'Magnificent palace-fortress ruins with elaborate heraldic sculpture. Former seat of the powerful Gordon family.', 'Open daily. Free entry. Impressive carved stonework and architectural details.', '{"April", "May", "June", "July", "August", "September"}', 'Free', 'Historic Environment Scotland', 23),
('24', 'Bothwell Castle', 'South Lanarkshire', 'Historic Fortress', '13th Century', 55.8089, -4.0672, 'One of Scotland''s finest stone castles, strategically positioned on the River Clyde. Massive circular donjon tower.', 'Open daily. Excellent preservation. Beautiful riverside location with picnic areas.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 24),
('25', 'Linlithgow Palace', 'West Lothian', 'Royal Castle', '15th Century', 55.9783, -3.6033, 'Magnificent royal palace ruins, birthplace of Mary Queen of Scots and James V. Stunning loch-side setting.', 'Open daily. Historic royal apartments. Beautiful location by Linlithgow Loch.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £7.50', 'Historic Environment Scotland', 25),
('26', 'Dirleton Castle', 'East Lothian', 'Historic Fortress', '13th Century', 56.0328, -2.7833, 'Romantic castle ruins with beautiful gardens. One of Scotland''s oldest stone fortresses with massive round towers.', 'Open daily. Award-winning gardens. Excellent preservation of medieval architecture.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 26),
('27', 'Caerphilly Castle', 'Dumfries and Galloway', 'Historic Fortress', '13th Century', 55.0889, -3.9167, 'Massive concentric castle with impressive water defenses. One of the finest examples of military architecture.', 'Open daily. Excellent visitor facilities. Great for understanding medieval warfare.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £8.50', 'Historic Environment Scotland', 27),
('28', 'Hermitage Castle', 'Scottish Borders', 'Historic Fortress', '14th Century', 55.2583, -2.7667, 'Sinister-looking border fortress known as the ''guardhouse of the bloodiest valley in Britain''. Massive keep walls.', 'Seasonal opening. Remote location. Excellent example of border warfare architecture.', '{"May", "June", "July", "August", "September"}', 'Adult £5.00', 'Historic Environment Scotland', 28),
('29', 'Drumlanrig Castle', 'Dumfries and Galloway', 'Palace', '17th Century', 55.2917, -3.8167, 'Pink sandstone palace known as the ''Pink Palace''. Home to the Duke of Buccleuch with art collection and country park.', 'Open April to September. Magnificent art collection. Beautiful gardens and adventure playground.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £12.00', 'Private', 29),
('30', 'Kelso Abbey', 'Scottish Borders', 'Ruin', '12th Century', 55.6000, -2.4333, 'Magnificent abbey ruins, once one of the richest abbeys in Scotland. Beautiful Romanesque and Gothic architecture.', 'Open access. Free entry. Historic market town setting. Excellent for photography.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 30),
('31', 'Caisteal Maol', 'Highland', 'Clan Castle', '15th Century', 57.2667, -5.7333, 'Ruined castle on the Isle of Skye overlooking the Sound of Sleat. Former stronghold of Clan MacKinnon.', 'Open access. Free entry. Spectacular views to mainland. Short walk from Kyleakin.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 31),
('32', 'Dunstaffnage Castle', 'Argyll and Bute', 'Historic Fortress', '13th Century', 56.4500, -5.4167, 'Ancient fortress on a rocky outcrop near Oban. Former coronation site of Scottish kings and repository of the Stone of Destiny.', 'Open daily. Rich royal history. Beautiful coastal location with chapel ruins.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 32),
('33', 'Castle Campbell', 'Clackmannanshire', 'Clan Castle', '16th Century', 56.1667, -3.7500, 'Dramatically sited castle in Dollar Glen, former stronghold of Clan Campbell. Known as Castle Gloom until renamed.', 'Open daily. Beautiful glen setting. Excellent walking trails. Spectacular views.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 33),
('34', 'Ruthven Barracks', 'Highland', 'Historic Fortress', '18th Century', 57.0833, -4.1167, 'Jacobite period infantry barracks overlooking Strathspey. Historic site of the last Jacobite gathering after Culloden.', 'Open access. Free entry. Important Jacobite history. Beautiful Highland setting.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 34),
('35', 'Elcho Castle', 'Perth and Kinross', 'Historic Fortress', '16th Century', 56.3500, -3.2833, 'Well-preserved fortified mansion overlooking the River Tay. Complete with original iron yett and defensive features.', 'Seasonal opening. Excellent preservation. Beautiful riverside location.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £5.50', 'Historic Environment Scotland', 35),
('36', 'Lochranza Castle', 'North Ayrshire', 'Historic Fortress', '16th Century', 55.7000, -5.3000, 'Picturesque castle ruins on the Isle of Arran, dramatically sited on a spit of land in Lochranza bay.', 'Open access. Free entry. Beautiful setting for photography. Red deer often nearby.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 36),
('37', 'Skipness Castle', 'Argyll and Bute', 'Clan Castle', '13th Century', 55.7833, -5.3333, 'Coastal castle ruins on the Kintyre peninsula. Former stronghold with impressive hall-house and tower.', 'Open access. Free entry. Remote coastal location. Excellent for wildlife watching.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 37),
('38', 'Castle Sween', 'Argyll and Bute', 'Historic Fortress', '12th Century', 55.9167, -5.6000, 'One of Scotland''s earliest stone castles, magnificently sited on Loch Sween. Ancient seat of the MacSweens.', 'Open access. Free entry. Historic significance. Beautiful loch-side setting.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 38),
('39', 'Carnasserie Castle', 'Argyll and Bute', 'Historic Fortress', '16th Century', 56.1333, -5.4833, 'Tower house castle with Renaissance features. Built by John Carswell, first Protestant Bishop of the Isles.', 'Open access. Free entry. Kilmartin Glen location. Rich archaeological landscape.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 39),
('40', 'Mingary Castle', 'Highland', 'Clan Castle', '13th Century', 56.7167, -6.0167, 'Dramatically sited castle on the Ardnamurchan peninsula. Recently restored after decades as a romantic ruin.', 'Visitor centre open seasonally. Remote location. Stunning west Highland scenery.', '{"May", "June", "July", "August", "September"}', 'Adult £8.00', 'Private', 40),
('41', 'Dunyvaig Castle', 'Argyll and Bute', 'Clan Castle', '14th Century', 55.6333, -6.1833, 'Ruined castle on Islay, former stronghold of the Lords of the Isles. Dramatic clifftop location.', 'Open access. Free entry. Remote location. Important for Hebridean history.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 41),
('42', 'Finlaggan Castle', 'Argyll and Bute', 'Historic Fortress', '14th Century', 55.8500, -6.1167, 'Island castle ruins on Islay, former seat of the Lords of the Isles. Centre of Gaelic power for centuries.', 'Visitor centre open seasonally. Fascinating history. Beautiful loch setting.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £5.00', 'Private', 42),
('43', 'Gylen Castle', 'Argyll and Bute', 'Clan Castle', '16th Century', 56.2833, -5.6500, 'Tower house castle on the island of Kerrera near Oban. Clan MacDougall stronghold with sea views.', 'Open access. Free entry. Island location accessible by ferry. Good walking.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 43),
('44', 'Aros Castle', 'Highland', 'Clan Castle', '14th Century', 56.4833, -6.0000, 'Ruined castle on the Isle of Mull, former stronghold of the Lords of the Isles. Overlooks the Sound of Mull.', 'Open access. Free entry. Beautiful coastal location. Good for wildlife watching.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 44),
('45', 'Breachacha Castle', 'Argyll and Bute', 'Clan Castle', '15th Century', 56.5000, -6.7000, 'Twin castles on the island of Coll. Old castle is a medieval tower, new castle is an 18th-century mansion.', 'Private property. External viewing only. Remote island location. Historic interest.', '{"All Year"}', 'Free', 'Private', 45),
('46', 'Kisimul Castle', 'Western Isles', 'Clan Castle', '15th Century', 56.9500, -7.4833, 'Sea castle on a rocky islet in Castlebay, Barra. Ancestral seat of Clan MacNeil, beautifully restored.', 'Boat trips available seasonally. Unique tidal access. Important clan heritage.', '{"May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 46),
('47', 'Dun Carloway', 'Western Isles', 'Historic Fortress', '1st Century BC', 58.2833, -6.7667, 'Best-preserved Iron Age broch in Scotland, on the Isle of Lewis. Dry-stone tower reaching 9 meters high.', 'Open access. Free entry. Visitor centre nearby. Spectacular Atlantic coast setting.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 47),
('48', 'Carlisle Castle', 'Scottish Borders', 'Historic Fortress', '12th Century', 54.8958, -2.9444, 'Border fortress with nearly 900 years of history. Former prison of Mary Queen of Scots.', 'Open daily. Rich military history. Excellent museum displays. Border reiver history.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £7.50', 'English Heritage', 48),
('49', 'Roxburgh Castle', 'Scottish Borders', 'Historic Fortress', '12th Century', 55.5833, -2.4333, 'Ruins of once-mighty border castle, scene of many sieges. Former royal castle of great strategic importance.', 'Open access. Free entry. Excellent views over Tweed and Teviot valleys.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 49),
('50', 'Cessford Castle', 'Scottish Borders', 'Historic Fortress', '15th Century', 55.5500, -2.3833, 'Ruined tower house of the Kers, one of the most powerful Border families. Massive walls still impressive.', 'Open access. Free entry. Remote location. Important border history.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 50),
('51', 'Smailholm Tower', 'Scottish Borders', 'Historic Fortress', '16th Century', 55.6167, -2.4833, 'Dramatic peel tower on a rocky outcrop. Inspired Sir Walter Scott''s childhood imagination.', 'Open seasonally. Excellent views. Scott exhibition. Beautiful Border countryside.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £5.50', 'Historic Environment Scotland', 51),
('52', 'Greenknowe Tower', 'Scottish Borders', 'Historic Fortress', '16th Century', 55.5833, -2.6333, 'Well-preserved L-plan tower house near Kelso. Excellent example of 16th-century domestic architecture.', 'Open access. Free entry. Beautiful countryside setting. Good preservation.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 52),
('53', 'Fast Castle', 'Scottish Borders', 'Historic Fortress', '16th Century', 55.8667, -2.1333, 'Dramatic clifftop castle ruins on the Berwickshire coast. Inspiration for Wolf''s Crag in Scott''s Bride of Lammermoor.', 'Clifftop walk required. Free entry. Spectacular coastal scenery. Dramatic ruins.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 53),
('54', 'Crichton Castle', 'Midlothian', 'Historic Fortress', '14th Century', 55.7833, -2.9167, 'Magnificent castle ruins with unique diamond-faceted facade. Atmospheric Border castle with Italian Renaissance influence.', 'Open seasonally. Architectural gem. Beautiful valley setting. Rich noble history.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 54),
('55', 'Hailes Castle', 'East Lothian', 'Historic Fortress', '14th Century', 55.9167, -2.7833, 'Picturesque castle ruins beside the River Tyne. Former stronghold of the Hepburn family.', 'Open access. Free entry. Beautiful riverside setting. Rich medieval history.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 55),
('56', 'Yester Castle', 'East Lothian', 'Historic Fortress', '13th Century', 55.8333, -2.8167, 'Mysterious underground chamber known as Hobgoblin Hall. Reputedly built by magic in the 13th century.', 'Woodland walk required. Free entry. Mysterious underground vaulted hall.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 56),
('57', 'Borthwick Castle', 'Midlothian', 'Historic Fortress', '15th Century', 55.7500, -3.0000, 'Massive twin-towered castle, one of the largest and best-preserved tower houses in Scotland.', 'Hotel and restaurant. External viewing. Magnificent preservation. Mary Queen of Scots connection.', '{"All Year"}', 'Hotel Guests', 'Private', 57),
('58', 'Craigmillar Castle', 'Edinburgh', 'Historic Fortress', '15th Century', 55.9167, -3.1333, 'Well-preserved castle near Edinburgh with connection to Mary Queen of Scots. Excellent views over the city.', 'Open daily. Great preservation. City views. Royal connections and intrigue.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 58),
('59', 'Lauriston Castle', 'Edinburgh', 'Palace', '16th Century', 55.9833, -3.3333, 'Elegant tower house extended into Jacobean mansion. Beautiful interiors and gardens overlooking the Forth.', 'Open for tours. Magnificent interiors. Beautiful gardens. Forth views.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £8.50', 'City of Edinburgh Council', 59),
('60', 'Dalmeny House', 'West Lothian', 'Palace', '19th Century', 55.9833, -3.3667, 'Gothic Revival mansion, home of the Earl of Rosebery. Napoleon collection and Tudor Revival architecture.', 'Open July and August. Magnificent collections. Beautiful parkland. Forth views.', '{"July", "August"}', 'Adult £10.00', 'Private', 60),
('61', 'Hopetoun House', 'West Lothian', 'Palace', '17th Century', 55.9833, -3.5000, 'Scotland''s finest stately home, known as Scotland''s Versailles. Magnificent architecture and deer park.', 'Open Easter to September. State apartments. Beautiful grounds. Fine art collection.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £13.50', 'Private', 61),
('62', 'The House of the Binns', 'West Lothian', 'Historic Fortress', '17th Century', 55.9833, -3.5167, 'Historic house with panoramic views over the Forth. Home of the Dalyell family for over 400 years.', 'Open weekends May to September. Historic house tour. Beautiful views.', '{"May", "June", "July", "August", "September"}', 'Adult £8.00', 'National Trust for Scotland', 62),
('63', 'Newliston', 'West Lothian', 'Palace', '18th Century', 55.9500, -3.4167, 'Robert Adam designed house with beautiful designed landscape. Excellent example of Georgian architecture.', 'Private residence. Gardens open occasionally. Beautiful Adam architecture.', '{"Selected Days"}', 'Variable', 'Private', 63),
('64', 'Cairnpapple Hill', 'West Lothian', 'Historic Fortress', 'Neolithic', 55.9167, -3.6333, 'Ancient ceremonial site with 5000 years of history. Stone circles, burial cairns and Bronze Age monuments.', 'Open access. Visitor centre. Ancient ceremonial landscape. Panoramic views.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 64),
('65', 'Beecraigs Country Park', 'West Lothian', 'Historic Fortress', 'Bronze Age', 55.9500, -3.5500, 'Country park with ancient fort remains and beautiful woodland. Red deer herd and fishing loch.', 'Open daily. Country park activities. Deer watching. Family facilities.', '{"All Year"}', 'Parking Fee', 'West Lothian Council', 65),
('66', 'Midhope Castle', 'West Lothian', 'Historic Fortress', '16th Century', 55.9833, -3.5333, 'Ruined tower house, exterior filming location for Lallybroch in Outlander TV series.', 'External viewing only. Private property. Outlander filming location.', '{"All Year"}', 'Free', 'Private', 66),
('67', 'Aberdour Castle', 'Fife', 'Historic Fortress', '12th Century', 56.0500, -3.3000, 'Beautiful castle ruins and gardens overlooking the Forth. One of the oldest stone castles in Scotland.', 'Open daily. Beautiful terraced gardens. Dovecot and medieval hall.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 67),
('68', 'Ravenscraig Castle', 'Fife', 'Historic Fortress', '15th Century', 56.1167, -3.1500, 'Innovative castle built to defend against gunpowder artillery. Unique design for its time.', 'Open access. Free entry. Coastal location. Innovative military architecture.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 68),
('69', 'St Andrews Castle', 'Fife', 'Historic Fortress', '13th Century', 56.3433, -2.7967, 'Clifftop castle ruins associated with dramatic events in Scottish history. Famous bottle dungeon and siege tunnels.', 'Open daily. Famous siege tunnel. Bottle dungeon. Spectacular coastal setting.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £9.00', 'Historic Environment Scotland', 69),
('70', 'Kellie Castle', 'Fife', 'Historic Fortress', '16th Century', 56.2167, -2.6833, 'Beautiful castle rescued from ruin by the Lorimer family. Magnificent plaster ceilings and walled garden.', 'Open Easter to October. Beautiful restoration. Magnificent gardens. Arts and Crafts influence.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £11.50', 'National Trust for Scotland', 70),
('71', 'Scotstarvit Tower', 'Fife', 'Historic Fortress', '17th Century', 56.2833, -2.9167, 'Six-storey L-plan tower house with panoramic views. Restored by the National Trust for Scotland.', 'Open by arrangement. Beautiful views. Well-preserved tower house.', '{"April", "May", "June", "July", "August", "September"}', 'Free', 'National Trust for Scotland', 71),
('72', 'Balvaird Castle', 'Perth and Kinross', 'Historic Fortress', '16th Century', 56.3333, -3.3167, 'Well-preserved L-plan castle with fine architectural details. Former seat of the Murray family.', 'Open access. Free entry. Excellent preservation. Beautiful countryside setting.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 72),
('73', 'Lochleven Castle', 'Perth and Kinross', 'Historic Fortress', '14th Century', 56.2000, -3.3833, 'Island castle famous as the prison of Mary Queen of Scots. Accessed by boat from Kinross.', 'Boat access required. Mary Queen of Scots connection. Beautiful loch setting.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £8.50', 'Historic Environment Scotland', 73),
('74', 'Huntingtower Castle', 'Perth and Kinross', 'Historic Fortress', '15th Century', 56.4167, -3.4833, 'Two towers connected by a later range. Scene of the Gowrie Conspiracy and famous painted ceilings.', 'Open daily. Beautiful painted ceilings. Important historical events. Well preserved.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 74),
('75', 'Blair Castle', 'Perth and Kinross', 'Palace', '13th Century', 56.7667, -3.8500, 'White-turreted castle in spectacular Highland setting. Home of the Duke of Atholl and Europe''s last private army.', 'Open Easter to October. Europe''s last private army. Magnificent collections. Beautiful grounds.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £14.50', 'Private', 75),
('76', 'Castle Menzies', 'Perth and Kinross', 'Historic Fortress', '16th Century', 56.8667, -3.8667, 'Z-plan castle restored by the Menzies Clan Society. Beautiful example of 16th-century architecture.', 'Open April to October. Clan seat. Beautiful restoration. Highland setting.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £8.00', 'Menzies Clan Society', 76),
('77', 'Grandtully Castle', 'Perth and Kinross', 'Historic Fortress', '16th Century', 56.6000, -3.9167, 'Z-plan castle with beautiful painted ceiling. Stunning Highland location overlooking the River Tay.', 'Private residence. External viewing only. Beautiful painted ceiling when open.', '{"All Year"}', 'External Only', 'Private', 77),
('78', 'Balloch Castle', 'West Dunbartonshire', 'Palace', '19th Century', 56.0000, -4.5833, 'Gothic Revival castle in country park setting at the foot of Loch Lomond. Beautiful visitor centre.', 'Country park open daily. Visitor centre. Beautiful loch setting. Family activities.', '{"All Year"}', 'Free', 'Loch Lomond & Trossachs National Park', 78),
('79', 'Dumbarton Castle', 'West Dunbartonshire', 'Historic Fortress', '5th Century', 55.9442, -4.5628, 'Ancient fortress on volcanic rock overlooking the River Clyde. Medieval stronghold with royal connections.', 'Open daily. Ancient rock fortress. Royal connections. Spectacular views over Clyde.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 79),
('80', 'Rothesay Castle', 'Argyll and Bute', 'Historic Fortress', '13th Century', 55.8367, -5.0533, 'Unique circular castle on the Isle of Bute. One of Scotland''s most remarkable medieval castles.', 'Open daily. Unique circular design. Island location. Medieval great hall.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 80),
('81', 'Mount Stuart', 'Argyll and Bute', 'Palace', '19th Century', 55.8167, -5.1167, 'Spectacular Gothic Revival palace on the Isle of Bute. One of the most technologically advanced houses of its time.', 'Open May to September. Stunning architecture. Beautiful gardens. Advanced Victorian technology.', '{"May", "June", "July", "August", "September"}', 'Adult £15.00', 'Private', 81),
('82', 'Torosay Castle', 'Argyll and Bute', 'Palace', '19th Century', 56.4333, -5.7000, 'Victorian mansion on the Isle of Mull with beautiful gardens. Statue walk and magnificent views.', 'Open Easter to October. Beautiful gardens. Statue walk. Mull railway connection.', '{"April", "May", "June", "July", "August", "September", "October"}', 'Adult £8.50', 'Private', 82),
('83', 'Achamore House', 'Argyll and Bute', 'Palace', '20th Century', 55.4333, -5.8000, 'Former home of the Horlicks family on the island of Gigha. Beautiful gardens with rare plants.', 'Gardens open daily. House by arrangement. Stunning island setting. Rare plant collection.', '{"All Year"}', 'Adult £3.00', 'Private', 83),
('84', 'Duntrune Castle', 'Argyll and Bute', 'Clan Castle', '12th Century', 56.1000, -5.5333, 'Scotland''s oldest continuously inhabited castle. Beautiful loch-side setting near Crinan.', 'Private residence. Occasional tours. Oldest continuously inhabited castle.', '{"Selected Days"}', 'By Arrangement', 'Private', 84),
('85', 'Tarbert Castle', 'Argyll and Bute', 'Historic Fortress', '13th Century', 55.8667, -5.4167, 'Ruined castle on a hilltop overlooking Tarbert harbour. Former stronghold controlling sea route to the islands.', 'Open access. Free entry. Excellent harbour views. Strategic importance.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 85),
('86', 'Sadell Castle', 'Argyll and Bute', 'Historic Fortress', '16th Century', 55.6167, -5.6000, 'Tower house castle on the Kintyre peninsula. Well-preserved with carved stone details.', 'Open access. Free entry. Well-preserved architecture. Peaceful rural setting.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 86),
('87', 'Dunadd Fort', 'Argyll and Bute', 'Historic Fortress', '6th Century', 56.0833, -5.4500, 'Ancient hilltop fortress, capital of the kingdom of Dalriada. Coronation site of early Scottish kings.', 'Open access. Free entry. Ancient royal site. Stunning views over Kilmartin Glen.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 87),
('88', 'Castle Lachlan', 'Argyll and Bute', 'Clan Castle', '15th Century', 56.0833, -5.1833, 'Ruined castle of Clan Lachlan on the shores of Loch Fyne. Beautiful Highland setting.', 'Open access. Free entry. Clan heritage. Beautiful loch-side setting.', '{"All Year"}', 'Free', 'Historic Environment Scotland', 88),
('89', 'Ardkinglas House', 'Argyll and Bute', 'Palace', '20th Century', 56.2333, -4.9833, 'Edwardian mansion famous for its champion trees. Beautiful gardens and woodland walks.', 'Woodland garden open daily. House tours by arrangement. Champion trees.', '{"All Year"}', 'Adult £4.00', 'Private', 89),
('90', 'Stonefield Castle', 'Argyll and Bute', 'Palace', '19th Century', 55.9000, -5.4500, 'Former mansion now a hotel with beautiful gardens overlooking Loch Fyne. Victorian architecture and formal gardens.', 'Hotel and restaurant. Gardens accessible. Beautiful loch views.', '{"All Year"}', 'Hotel Guests', 'Private', 90),
('91', 'Castle Toward', 'Argyll and Bute', 'Palace', '19th Century', 55.9167, -4.9833, 'Victorian mansion in beautiful grounds on the Cowal peninsula. Gothic Revival architecture.', 'Outdoor centre. External viewing. Beautiful coastal setting on Holy Loch.', '{"All Year"}', 'External Only', 'Private', 91),
('92', 'Benmore Botanic Garden', 'Argyll and Bute', 'Palace', '19th Century', 56.0333, -4.9833, 'Victorian mansion ruins in spectacular botanic garden setting. World-famous rhododendron collection.', 'Garden open daily. Spectacular plant collections. Beautiful mountain setting.', '{"All Year"}', 'Adult £7.00', 'Royal Botanic Garden Edinburgh', 92),
('93', 'Younger Botanic Garden Benmore', 'Argyll and Bute', 'Palace', '19th Century', 56.0333, -4.9833, 'Spectacular garden with mansion ruins. Famous avenue of giant redwoods and world plant collections.', 'Open daily. World-famous collections. Magnificent redwood avenue.', '{"All Year"}', 'Adult £7.00', 'Royal Botanic Garden Edinburgh', 93),
('94', 'Hill House', 'Argyll and Bute', 'Palace', '20th Century', 55.9333, -4.7500, 'Charles Rennie Mackintosh masterpiece in Helensburgh. Outstanding example of Arts and Crafts architecture.', 'Open daily. Mackintosh masterpiece. Complete Arts and Crafts design.', '{"All Year"}', 'Adult £11.50', 'National Trust for Scotland', 94),
('95', 'Geilston Garden', 'Argyll and Bute', 'Palace', '18th Century', 55.9500, -4.6167, 'Walled garden with beautiful house overlooking the River Clyde. Excellent kitchen garden and herbaceous borders.', 'Garden open daily. Beautiful walled garden. Kitchen garden and herbaceous borders.', '{"All Year"}', 'Adult £6.00', 'National Trust for Scotland', 95),
('96', 'Greenbank Garden', 'South Lanarkshire', 'Palace', '18th Century', 55.7667, -4.3333, 'Georgian house with demonstration garden showing what can be grown in small gardens. Educational and inspiring.', 'Garden open daily. Small garden inspiration. Educational displays.', '{"All Year"}', 'Adult £6.50', 'National Trust for Scotland', 96),
('97', 'Pollok House', 'South Lanarkshire', 'Palace', '18th Century', 55.8333, -4.3167, 'Edwardian mansion in beautiful parkland. Outstanding collection of Spanish art and period interiors.', 'Open daily. Outstanding art collection. Beautiful parkland setting.', '{"All Year"}', 'Free', 'National Trust for Scotland', 97),
('98', 'Holmwood House', 'South Lanarkshire', 'Palace', '19th Century', 55.8167, -4.3000, 'Alexander ''Greek'' Thomson villa, finest example of his domestic architecture. Recently restored.', 'Open weekends. Greek Thomson architecture. Recent restoration.', '{"May", "June", "July", "August", "September"}', 'Adult £8.00', 'National Trust for Scotland', 98),
('99', 'Newark Castle', 'Inverclyde', 'Historic Fortress', '15th Century', 55.9167, -4.7000, 'Well-preserved castle on the River Clyde with fine Renaissance courtyard and great hall.', 'Open daily. Excellent preservation. Fine Renaissance details. River Clyde setting.', '{"April", "May", "June", "July", "August", "September"}', 'Adult £6.00', 'Historic Environment Scotland', 99),
('100', 'Finlaystone', 'Inverclyde', 'Palace', '14th Century', 55.9333, -4.6167, 'Historic house and gardens with Celtic heritage centre. Beautiful woodland walks and formal gardens.', 'Open daily. Celtic heritage centre. Beautiful gardens and woodland walks.', '{"All Year"}', 'Adult £5.50', 'Private', 100);

-- Insert 20 spectacular Scottish lochs
INSERT INTO lochs (id, name, region, type, length_km, max_depth_m, latitude, longitude, description, activities, best_seasons, famous_for, nearest_town, rank) VALUES
('1', 'Loch Ness', 'Highland', 'Freshwater Loch', 36.3, 230, 57.3229, -4.4244, 'Scotland''s most famous loch, home of the legendary Loch Ness Monster. The largest loch by volume in the British Isles, stretching 36km through the Great Glen.', '{"Monster spotting", "Boat trips", "Castle visits", "Hiking", "Photography"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'The Loch Ness Monster (Nessie) and its mysterious depths', 'Inverness', 1),
('2', 'Loch Lomond', 'Central Scotland', 'Freshwater Loch', 36.4, 190, 56.1089, -4.6206, 'Scotland''s largest loch by surface area and part of the first National Park. Beautiful islands and surrounded by mountains, offering endless recreational opportunities.', '{"Boating", "Swimming", "Hiking", "Island hopping", "Cycling", "Fishing"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Being Scotland''s largest loch and the song "The Bonnie Banks"', 'Balloch', 2),
('3', 'Loch Katrine', 'Stirling', 'Freshwater Loch', 12.5, 151, 56.2567, -4.5789, 'The heart of the Trossachs, inspiration for Sir Walter Scott''s "Lady of the Lake". Pure mountain water that supplies Glasgow, surrounded by beautiful Highland scenery.', '{"Steamship cruises", "Cycling", "Hiking", "Photography", "Wildlife watching"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Sir Walter Scott''s "Lady of the Lake" and Victorian steamship cruises', 'Callander', 3),
('4', 'Loch Earn', 'Stirling', 'Freshwater Loch', 10.5, 87, 56.3856, -4.2067, 'Beautiful loch in the heart of Scotland surrounded by mountains. Popular for water sports and home to the famous Lochearnhead Water Sports Centre.', '{"Water skiing", "Jet skiing", "Sailing", "Fishing", "Mountain biking", "Hiking"}', '{"May", "June", "July", "August", "September"}', 'Water sports and the annual Loch Earn Highland Games', 'Lochearnhead', 4),
('5', 'Loch Awe', 'Argyll and Bute', 'Freshwater Loch', 41.0, 94, 56.4089, -5.0267, 'Scotland''s longest freshwater loch, stretching 41km through stunning Highland scenery. Home to the romantic ruins of Kilchurn Castle.', '{"Boat trips", "Fishing", "Castle visits", "Hiking", "Photography", "Kayaking"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Being Scotland''s longest freshwater loch and Kilchurn Castle', 'Oban', 5),
('6', 'Loch Tay', 'Highland', 'Freshwater Loch', 23.2, 150, 56.5167, -4.1133, 'Beautiful Highland loch overlooked by Ben Lawers, Scotland''s 10th highest mountain. Rich in wildlife and archaeological sites including ancient crannogs.', '{"Crannog visits", "Ben Lawers hiking", "Fishing", "Cycling", "Wildlife watching", "Watersports"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Ancient crannogs (lake dwellings) and Ben Lawers National Nature Reserve', 'Aberfeldy', 6),
('7', 'Loch Tummel', 'Highland', 'Freshwater Loch', 11.0, 43, 56.7067, -3.9133, 'Scenic loch in Highland Perthshire, famous for the Queen''s View - one of Scotland''s most photographed viewpoints. Part of beautiful Tummel Valley.', '{"Photography", "Hiking", "Cycling", "Fishing", "Forest walks", "Dam visits"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'The Queen''s View viewpoint and hydroelectric power generation', 'Pitlochry', 7),
('8', 'Loch Achray', 'Stirling', 'Freshwater Loch', 2.5, 25, 56.2333, -4.4667, 'Small but perfectly formed loch in the heart of the Trossachs. Peaceful setting surrounded by woodland and mountains, perfect for quiet contemplation.', '{"Fishing", "Walking", "Photography", "Picnicking", "Wildlife watching", "Quiet reflection"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Tranquil beauty and its role in the Trossachs water cycle', 'Aberfoyle', 8),
('9', 'Loch Vennachar', 'Stirling', 'Freshwater Loch', 6.0, 38, 56.2167, -4.3833, 'Beautiful loch in the Trossachs, popular with anglers and nature lovers. Part of Glasgow''s water supply system with excellent walking opportunities around its shores.', '{"Fishing", "Walking", "Cycling", "Photography", "Birdwatching", "Canoeing"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Excellent brown trout fishing and peaceful woodland walks', 'Callander', 9),
('10', 'Loch Rannoch', 'Highland', 'Freshwater Loch', 15.7, 134, 56.6833, -4.2667, 'Remote and wild loch in Highland Perthshire, gateway to the Rannoch Moor. Stunning mountain scenery and one of Scotland''s most isolated and beautiful lochs.', '{"Hiking", "Photography", "Wildlife watching", "Fishing", "Camping", "Stargazing"}', '{"May", "June", "July", "August", "September"}', 'Gateway to Rannoch Moor and remote Highland wilderness', 'Kinloch Rannoch', 10),
('11', 'Loch Maree', 'Highland', 'Freshwater Loch', 20.0, 114, 57.7167, -5.4833, 'Magnificent loch in Wester Ross surrounded by ancient Caledonian pine forest. Multiple islands and spectacular mountain backdrop including Slioch.', '{"Hiking", "Photography", "Wildlife watching", "Fishing", "Island exploring", "Nature study"}', '{"May", "June", "July", "August", "September", "October"}', 'Ancient Caledonian pine forest and Isle Maree with ancient burial ground', 'Kinlochewe', 11),
('12', 'Loch Torridon', 'Highland', 'Sea Loch', 15.0, 87, 57.5500, -5.6833, 'Dramatic sea loch surrounded by some of Scotland''s most spectacular mountains. Crystal clear waters reflecting towering peaks.', '{"Sea kayaking", "Mountain climbing", "Photography", "Wildlife watching", "Boat trips", "Diving"}', '{"May", "June", "July", "August", "September", "October"}', 'Spectacular Torridon mountains and pristine Highland scenery', 'Torridon', 12),
('13', 'Loch Shiel', 'Highland', 'Freshwater Loch', 28.0, 128, 56.8000, -5.4000, 'Long, narrow loch stretching from Glenfinnan to Acharacle. Famous for its role in Bonnie Prince Charlie''s campaign and Harry Potter films.', '{"Boat trips", "Hiking", "Photography", "Jacobite history", "Film location tours", "Fishing"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Glenfinnan Monument, Jacobite history, and Harry Potter filming location', 'Glenfinnan', 13),
('14', 'Loch Duich', 'Highland', 'Sea Loch', 8.0, 65, 57.2667, -5.5167, 'Beautiful sea loch dominated by the Five Sisters of Kintail mountains. Home to the iconic Eilean Donan Castle.', '{"Castle visits", "Photography", "Hiking", "Kayaking", "Wildlife watching", "Mountain climbing"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Eilean Donan Castle and the Five Sisters of Kintail mountains', 'Kyle of Lochalsh', 14),
('15', 'Loch Assynt', 'Highland', 'Freshwater Loch', 6.0, 85, 58.2000, -4.9167, 'Remote Highland loch surrounded by distinctive Assynt mountains including Suilven and Canisp. Ancient landscape of Lewisian gneiss.', '{"Hiking", "Photography", "Geology study", "Wildlife watching", "Fishing", "Wild camping"}', '{"May", "June", "July", "August", "September"}', 'Distinctive mountain peaks and ancient geological landscape', 'Lochinver', 15),
('16', 'Loch Fyne', 'Argyll and Bute', 'Sea Loch', 65.0, 184, 56.1667, -5.1833, 'Scotland''s longest sea loch, famous for its seafood, particularly oysters and kippers. Beautiful coastal scenery and charming fishing villages.', '{"Seafood dining", "Boat trips", "Fishing", "Coastal walks", "Photography", "Cycling"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'World-famous seafood, particularly Loch Fyne oysters and kippers', 'Inveraray', 16),
('17', 'Loch Etive', 'Argyll and Bute', 'Sea Loch', 30.0, 150, 56.4833, -5.1833, 'Dramatic sea loch stretching inland from Oban. Surrounded by mountains and featuring tidal rapids at the Falls of Lora.', '{"Kayaking", "Photography", "Hiking", "Tidal bore watching", "Mountain climbing", "Wildlife watching"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Tidal rapids at Falls of Lora and dramatic mountain scenery', 'Oban', 17),
('18', 'Loch Long', 'Argyll and Bute', 'Sea Loch', 23.0, 75, 56.1000, -4.8500, 'Scenic sea loch stretching north from the Firth of Clyde. Popular for water sports and surrounded by beautiful hills.', '{"Sailing", "Water skiing", "Kayaking", "Hiking", "Photography", "Diving"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Water sports and beautiful Highland scenery close to Glasgow', 'Arrochar', 18),
('19', 'Loch Coruisk', 'Highland', 'Freshwater Loch', 2.5, 38, 57.2167, -6.1833, 'Remote and dramatic loch in the heart of the Cuillin mountains on Skye. Accessible only by boat or challenging hike.', '{"Boat trips", "Extreme hiking", "Photography", "Rock climbing", "Wild swimming", "Wilderness experience"}', '{"May", "June", "July", "August", "September"}', 'Remote location and dramatic Cuillin mountain setting on Skye', 'Elgol', 19),
('20', 'Loch Linnhe', 'Highland', 'Sea Loch', 50.0, 154, 56.7167, -5.1167, 'Major sea loch extending from Fort William to the Firth of Lorn. Important transportation route with ferry connections.', '{"Ferry travel", "Coastal walks", "Photography", "Wildlife watching", "Kayaking", "Fishing"}', '{"April", "May", "June", "July", "August", "September", "October"}', 'Transportation hub and gateway to the Western Highlands and Islands', 'Fort William', 20);

-- Create triggers to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_castles_updated_at BEFORE UPDATE ON castles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lochs_updated_at BEFORE UPDATE ON lochs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_castle_visits_updated_at BEFORE UPDATE ON castle_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loch_visits_updated_at BEFORE UPDATE ON loch_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Castles and Lochs database schema created successfully! Ready to track your Scottish adventures!' as status;
