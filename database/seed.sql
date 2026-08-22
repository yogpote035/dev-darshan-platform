USE u360284363_livedarshan;

-- ==========================
-- DEFAULT PLANS
-- ==========================
INSERT INTO subscription_plans (plan_name, price, duration_days, description, status) VALUES
('Free', 0.00, 3650, 'Enjoy free access to standard live streams and latest videos with ads.', 1),
('Monthly', 99.00, 30, 'Ad-free premium access, high quality streams, and priority updates.', 1),
('Quarterly', 249.00, 90, 'Save 15% on premium live darshan across all channels. Ad-free experience.', 1),
('Yearly', 899.00, 365, 'Best value! Ultimate year-long premium access to all live feeds. Ad-free.', 1);

-- ==========================
-- DEFAULT ADMIN
-- Email: admin@devdarshanlive.com
-- Password: admin123
-- Hash: $2b$10$RnILhElV3YYMP1FOeJh8Fesgabpr7n6ealHPO.mM8taxVlBmbn3d6
-- ==========================
INSERT INTO admins (name, email, password, role, status) VALUES
('Super Admin', 'admin@devdarshanlive.com', '$2b$10$RnILhElV3YYMP1FOeJh8Fesgabpr7n6ealHPO.mM8taxVlBmbn3d6', 'super_admin', 1);

-- ==========================
-- DEFAULT APP SETTINGS
-- ==========================
INSERT INTO settings (site_name, logo, support_email, support_phone, razorpay_key_id, razorpay_secret, free_user_ads_enabled, maintenance_mode) VALUES
('Live Darshan', '/images/logo-placeholder.png', 'support@livedarshan.com', '+919876543210', 'rzp_test_placeholder_key', 'rzp_test_placeholder_secret', 1, 0);

-- ==========================
-- DEFAULT CATEGORIES
-- ==========================
INSERT INTO categories (category_name, image, status) VALUES
('Vaishno Devi', '/images/categories/vaishno_devi.jpg', 1),
('Kedarnath', '/images/categories/kedarnath.jpg', 1),
('Siddhivinayak', '/images/categories/siddhivinayak.jpg', 1),
('Golden Temple', '/images/categories/golden_temple.jpg', 1),
('Somnath', '/images/categories/somnath.jpg', 1);

-- ==========================
-- DEFAULT VIDEOS
-- ==========================
INSERT INTO videos (category_id, title, description, youtube_url, thumbnail, is_live, featured, total_views, status) VALUES
(1, 'Maa Vaishno Devi Aarti Live Feed', 'Live morning and evening Aarti from Holy Shrine of Shri Mata Vaishno Devi Ji, Katra.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/videos/vaishno_devi_live.jpg', 1, 1, 1054, 1),
(2, 'Kedarnath Dham Daily Darshan', 'Daily live darshan and evening dynamic Aarti of Shri Kedarnath Jyotirlinga Temple.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/videos/kedarnath_live.jpg', 1, 1, 2309, 1),
(3, 'Shree Siddhivinayak Temple Live Darshan', 'Live feed of Shree Siddhivinayak Ganapati Temple, Prabhadevi, Mumbai.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/videos/siddhivinayak_live.jpg', 1, 0, 503, 1),
(4, 'Harmandir Sahib Live Gurbani Kirtan', 'Live Gurbani Kirtan and Darshan from Shri Harmandir Sahib (Golden Temple), Amritsar.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/videos/golden_temple_live.jpg', 1, 1, 8432, 1),
(5, 'Somnath Jyotirlinga Live Arti', 'Special live broadcast of Shringar Darshan and Aarti of Somnath Temple, Gujarat.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/videos/somnath_live.jpg', 0, 0, 128, 1);

-- ==========================
-- DEFAULT BANNERS
-- ==========================
INSERT INTO banners (title, image, link, status) VALUES
('Experience Divineness: Kedarnath Dham Live', '/images/banners/kedarnath_banner.jpg', '/video/2', 1),
('Chardham Yatra 2026 Special Broadcasts', '/images/banners/chardham_banner.jpg', '/categories', 1),
('Golden Temple Sri Harmandir Sahib Live Darshan', '/images/banners/golden_temple_banner.jpg', '/video/4', 1);

-- ==========================
-- DEFAULT ADVERTISEMENTS
-- ==========================
INSERT INTO advertisements (title, image, redirect_url, display_after_minutes, display_after_videos, status) VALUES
('Pooja Thali & Divine Kits - 20% Off', '/images/ads/pooja_kit_ad.jpg', 'https://example.com/shop/pooja-kit', 5, 2, 1),
('Chardham Yatra Travel Packages 2026', '/images/ads/chardham_travel_ad.jpg', 'https://example.com/travel/chardham', 10, 3, 1);
