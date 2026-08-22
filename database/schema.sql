CREATE DATABASE IF NOT EXISTS live_darshan_db;
USE live_darshan_db;

-- ==========================
-- ADMINS
-- ==========================
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin','admin') DEFAULT 'admin',
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email)
);

-- ==========================
-- USERS
-- ==========================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255) NULL,
    plan_id INT NULL,
    subscription_expiry DATETIME NULL,
    status ENUM('active','blocked') DEFAULT 'active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_phone (phone),
    INDEX idx_user_plan (plan_id)
);

-- ==========================
-- CATEGORIES
-- ==========================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    image VARCHAR(255),
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_status (status)
);

-- ==========================
-- VIDEOS
-- ==========================
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    youtube_url TEXT NOT NULL,
    youtube_id VARCHAR(100),
    embed_url TEXT,
    thumbnail VARCHAR(255),
    is_live TINYINT(1) DEFAULT 0,
    featured TINYINT(1) DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE SET NULL,

    INDEX idx_video_category (category_id),
    INDEX idx_video_status (status),
    INDEX idx_video_live_featured (is_live, featured)
);

-- ==========================
-- SUBSCRIPTION PLANS
-- ==========================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_name VARCHAR(100),
    price DECIMAL(10,2),
    razorpay_plan_id VARCHAR(255),
    duration_days INT,
    description TEXT,
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_plan_status (status)
);

-- ==========================
-- USER SUBSCRIPTIONS
-- ==========================
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(10,2),
    start_date DATETIME,
    end_date DATETIME,
    status ENUM('active','expired','cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(plan_id)
    REFERENCES subscription_plans(id)
    ON DELETE CASCADE,

    INDEX idx_subscription_user (user_id),
    INDEX idx_subscription_plan (plan_id),
    INDEX idx_subscription_status (status)
);

-- ==========================
-- PAYMENTS
-- ==========================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT NULL,
    order_id INT NULL,
    payment_type ENUM('subscription', 'product', 'product_subscription_offer') DEFAULT 'subscription',

    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    razorpay_signature TEXT,

    amount DECIMAL(10,2),
    payment_method VARCHAR(50),

    payment_status ENUM(
        'pending',
        'success',
        'failed',
        'refunded'
    ) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    INDEX idx_payment_user (user_id),
    INDEX idx_payment_order_id (order_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_order (razorpay_order_id)
);

-- ==========================
-- ADVERTISEMENTS
-- ==========================
CREATE TABLE IF NOT EXISTS advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    image VARCHAR(255),
    redirect_url TEXT,
    display_after_minutes INT DEFAULT 5,
    display_after_videos INT DEFAULT 2,
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ad_status (status)
);

-- ==========================
-- WATCH HISTORY
-- ==========================
CREATE TABLE IF NOT EXISTS watch_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    video_id INT,
    watch_time INT DEFAULT 0,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(video_id)
    REFERENCES videos(id)
    ON DELETE CASCADE,

    INDEX idx_history_user (user_id),
    INDEX idx_history_video (video_id)
);

-- ==========================
-- FAVORITES
-- ==========================
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    video_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(video_id)
    REFERENCES videos(id)
    ON DELETE CASCADE,

    UNIQUE KEY uq_user_video (user_id, video_id),
    INDEX idx_favorite_user (user_id)
);

-- ==========================
-- NOTIFICATIONS
-- ==========================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    message TEXT,
    image VARCHAR(255),
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- USER NOTIFICATIONS
-- ==========================
CREATE TABLE IF NOT EXISTS user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    notification_id INT,
    is_read TINYINT(1) DEFAULT 0,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY(notification_id)
    REFERENCES notifications(id)
    ON DELETE CASCADE,

    INDEX idx_user_notification_user (user_id),
    INDEX idx_user_notification_read (is_read)
);

-- ==========================
-- APP SETTINGS
-- ==========================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255),
    logo VARCHAR(255),
    support_email VARCHAR(255),
    support_phone VARCHAR(20),

    razorpay_key_id VARCHAR(255),
    razorpay_secret VARCHAR(255),
    razorpay_webhook_secret VARCHAR(255),

    free_user_ads_enabled TINYINT(1) DEFAULT 1,
    maintenance_mode TINYINT(1) DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================
-- BANNERS
-- ==========================
CREATE TABLE IF NOT EXISTS banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    image VARCHAR(255),
    link TEXT,
    status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_banner_status (status)
);

-- ==========================
-- CONTACT ENQUIRIES
-- ==========================
CREATE TABLE IF NOT EXISTS contact_enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(15),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================
-- PRODUCT STORE
-- ==========================
CREATE TABLE IF NOT EXISTS product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    image VARCHAR(255) NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NULL,
    description TEXT NULL,
    short_description VARCHAR(500) NULL,
    price DECIMAL(10,2) NOT NULL,
    offer_price DECIMAL(10,2) NULL,
    image VARCHAR(255) NULL,
    category_id INT NULL,
    brand VARCHAR(150) NULL,
    sku VARCHAR(100) NULL,
    stock INT NOT NULL DEFAULT 0,
    active TINYINT(1) DEFAULT 1,
    featured TINYINT(1) DEFAULT 0,
    allow_one_rupee_offer TINYINT(1) DEFAULT 0,
    one_rupee_price DECIMAL(10,2) DEFAULT 1.00,
    subscription_plan_id INT NULL,
    subscription_amount DECIMAL(10,2) NULL,
    subscription_trial_days INT DEFAULT 7,
    subscription_enabled TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart_user_product (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(100) UNIQUE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_mode ENUM('one_time','subscription_offer') NOT NULL,
    order_type ENUM('normal_purchase','one_rupee_offer') NOT NULL,
    payment_status ENUM('pending','paid','failed','refunded','partially_refunded') DEFAULT 'pending',
    order_status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
    razorpay_order_id VARCHAR(255) UNIQUE NULL,
    razorpay_payment_id VARCHAR(255) NULL,
    razorpay_signature TEXT NULL,
    razorpay_subscription_id VARCHAR(255) NULL,
    shipping_name VARCHAR(150) NULL,
    shipping_mobile VARCHAR(20) NULL,
    shipping_address TEXT NULL,
    shipping_city VARCHAR(120) NULL,
    shipping_state VARCHAR(120) NULL,
    shipping_pincode VARCHAR(20) NULL,
    shipping_country VARCHAR(120) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS product_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    product_id INT NULL,
    razorpay_subscription_id VARCHAR(255) UNIQUE NULL,
    razorpay_plan_id VARCHAR(255) NULL,
    initial_payment_amount DECIMAL(10,2) DEFAULT 0,
    recurring_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    trial_days INT DEFAULT 7,
    trial_start_at DATETIME NULL,
    trial_end_at DATETIME NULL,
    first_charge_at DATETIME NULL,
    next_charge_at DATETIME NULL,
    status ENUM('pending','trialing','active','paused','cancelled','completed','failed','expired') DEFAULT 'pending',
    subscription_start_at DATETIME NULL,
    subscription_end_at DATETIME NULL,
    cancelled_at DATETIME NULL,
    cancel_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    payload_hash VARCHAR(255) NULL,
    processed TINYINT(1) DEFAULT 0,
    processed_at DATETIME NULL,
    error TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
