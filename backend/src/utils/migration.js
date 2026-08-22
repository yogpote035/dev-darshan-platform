const sequelize = require('../config/database');

const runMigration = async () => {
  console.log('🔄 Running database migrations for referrals and withdrawals...');
  try {
    // 1. settings.razorpay_webhook_secret and commission_percentage
    const [settingsWebhookCols] = await sequelize.query("SHOW COLUMNS FROM settings LIKE 'razorpay_webhook_secret'");
    if (settingsWebhookCols.length === 0) {
      console.log('Adding razorpay_webhook_secret to settings...');
      await sequelize.query("ALTER TABLE settings ADD COLUMN razorpay_webhook_secret VARCHAR(255) NULL;");
    }

    const [settingsCols] = await sequelize.query("SHOW COLUMNS FROM settings LIKE 'commission_percentage'");
    if (settingsCols.length === 0) {
      console.log('Adding commission_percentage to settings...');
      await sequelize.query("ALTER TABLE settings ADD COLUMN commission_percentage DECIMAL(5, 2) DEFAULT 10.00;");
    }

    const [planRazorpayCols] = await sequelize.query("SHOW COLUMNS FROM subscription_plans LIKE 'razorpay_plan_id'");
    if (planRazorpayCols.length === 0) {
      console.log('Adding razorpay_plan_id to subscription_plans...');
      await sequelize.query("ALTER TABLE subscription_plans ADD COLUMN razorpay_plan_id VARCHAR(255) NULL AFTER price");
    }

    // 2. payments.order_id for product order payments
    const [paymentOrderCols] = await sequelize.query("SHOW COLUMNS FROM payments LIKE 'order_id'");
    if (paymentOrderCols.length === 0) {
      console.log('Adding order_id to payments...');
      await sequelize.query("ALTER TABLE payments ADD COLUMN order_id INT NULL AFTER subscription_id");
      await sequelize.query("ALTER TABLE payments ADD INDEX idx_payment_order_id (order_id)");
    }

    const [paymentTypeCols] = await sequelize.query("SHOW COLUMNS FROM payments LIKE 'payment_type'");
    if (paymentTypeCols.length === 0) {
      console.log('Adding payment_type to payments...');
      await sequelize.query("ALTER TABLE payments ADD COLUMN payment_type ENUM('subscription', 'product', 'product_subscription_offer') NULL DEFAULT 'subscription' AFTER order_id");
    }

    const [paymentProductCols] = await sequelize.query("SHOW COLUMNS FROM payments LIKE 'product_id'");
    if (paymentProductCols.length === 0) {
      console.log('Adding product_id to payments...');
      await sequelize.query("ALTER TABLE payments ADD COLUMN product_id INT NULL AFTER order_id");
      await sequelize.query("ALTER TABLE payments ADD INDEX idx_payment_product_id (product_id)");
    }

    const [paymentRzpSubCols] = await sequelize.query("SHOW COLUMNS FROM payments LIKE 'razorpay_subscription_id'");
    if (paymentRzpSubCols.length === 0) {
      console.log('Adding razorpay_subscription_id to payments...');
      await sequelize.query("ALTER TABLE payments ADD COLUMN razorpay_subscription_id VARCHAR(255) NULL AFTER payment_type");
    }

    const [productRazorpayPlanCols] = await sequelize.query("SHOW COLUMNS FROM products LIKE 'razorpay_plan_id'");
    if (productRazorpayPlanCols.length === 0) {
      console.log('Adding razorpay_plan_id to products...');
      await sequelize.query("ALTER TABLE products ADD COLUMN razorpay_plan_id VARCHAR(255) NULL AFTER subscription_plan_id");
    }

    // 3. users.referral_code
    const [usersRefCode] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'referral_code'");
    if (usersRefCode.length === 0) {
      console.log('Adding referral_code to users...');
      await sequelize.query("ALTER TABLE users ADD COLUMN referral_code VARCHAR(50) UNIQUE NULL;");
    }

    // 3. users.referred_by
    const [usersReferredBy] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'referred_by'");
    if (usersReferredBy.length === 0) {
      console.log('Adding referred_by to users...');
      await sequelize.query("ALTER TABLE users ADD COLUMN referred_by INT NULL;");

      // Add foreign key constraint
      try {
        await sequelize.query("ALTER TABLE users ADD CONSTRAINT fk_user_referred_by FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;");
      } catch (err) {
        console.error('Failed to add foreign key fk_user_referred_by (could already exist):', err.message);
      }
    }

    // 4. users.wallet_balance
    const [usersWallet] = await sequelize.query("SHOW COLUMNS FROM users LIKE 'wallet_balance'");
    if (usersWallet.length === 0) {
      console.log('Adding wallet_balance to users...');
      await sequelize.query("ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(10, 2) DEFAULT 0.00;");
    }

    // 5. commissions table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS commissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id INT NOT NULL,
        referred_id INT NOT NULL,
        payment_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        commission_percentage DECIMAL(5, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('commissions table verified.');

    // 6. withdrawals table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('qr_code', 'bank_details') NOT NULL,
        qr_code_image VARCHAR(255) NULL,
        bank_name VARCHAR(150) NULL,
        account_number VARCHAR(50) NULL,
        ifsc_code VARCHAR(50) NULL,
        account_holder_name VARCHAR(150) NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        admin_notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
    console.log('withdrawals table verified.');

    // 7. Update existing settings and admin emails to the new domain & name
    try {
      console.log('Updating settings and admin emails in existing database...');
      await sequelize.query("UPDATE settings SET site_name = 'Dev Darshan Live', support_email = 'support@devdarshanlive.com' WHERE site_name = 'Live Darshan' OR support_email = 'support@livedarshan.com';");
      await sequelize.query("UPDATE admins SET email = 'admin@devdarshanlive.com' WHERE email = 'admin@livedarshan.com';");
      console.log('Database settings and admin email updated to Dev Darshan Live.');
    } catch (dbErr) {
      console.warn('Failed to update site_name or admin email in existing DB:', dbErr.message);
    }

    console.log('✅ Database migrations completed successfully.');
  } catch (error) {
    console.error('❌ Error running database migrations:', error);
  }
};

module.exports = { runMigration };
