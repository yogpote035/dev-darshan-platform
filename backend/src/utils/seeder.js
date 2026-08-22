const {
  Admin,
  SubscriptionPlan,
  Setting,
  Category,
  Video,
  Banner,
  Advertisement
} = require('../models');

const { Op } = require('sequelize');
const sequelize = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('DB SEEDER: Starting count check...');
    // Check if old relative image paths exist in database
    const oldCatCount = await Category.count({
      where: {
        image: {
          [Op.like]: '/images/%'
        }
      }
    });
    console.log('DB SEEDER: oldCatCount is:', oldCatCount);

    if (oldCatCount > 0) {
      console.log('DB SEEDER: 🔄 Old local image paths detected. Clearing old seed data to re-seed with live URLs...');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      console.log('DB SEEDER: Disabled foreign key checks');
      await Category.destroy({ where: {} });
      console.log('DB SEEDER: Cleared categories');
      await Video.destroy({ where: {} });
      console.log('DB SEEDER: Cleared videos');
      await Banner.destroy({ where: {} });
      console.log('DB SEEDER: Cleared banners');
      await Advertisement.destroy({ where: {} });
      console.log('DB SEEDER: Cleared ads');
      await SubscriptionPlan.destroy({ where: {} });
      console.log('DB SEEDER: Cleared plans');
      await Admin.destroy({ where: { email: 'admin@devdarshanlive.com' } });
      console.log('DB SEEDER: Cleared admin');
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('DB SEEDER: Re-enabled foreign key checks');
    }

    // Check if seeding is already done
    const adminCount = await Admin.count();
    console.log('DB SEEDER: adminCount is:', adminCount);
    if (adminCount > 0) {
      console.log('DB SEEDER: Database already seeded. Skipping seeds.');
      return;
    }

    console.log('🌱 Database is empty. Seeding default data...');

    // 1. Seed Subscription Plans
    console.log('-> Seeding subscription plans...');
    const plans = await SubscriptionPlan.bulkCreate([
      {
        plan_name: 'Free',
        price: 0.00,
        duration_days: 3650,
        description: 'Enjoy free access to standard live streams and latest videos with ads.',
        status: 1
      },
      {
        plan_name: 'Monthly',
        price: 99.00,
        duration_days: 30,
        description: 'Ad-free premium access, high quality streams, and priority updates.',
        status: 1
      },
      {
        plan_name: 'Quarterly',
        price: 249.00,
        duration_days: 90,
        description: 'Save 15% on premium dev darshan live across all channels. Ad-free experience.',
        status: 1
      },
      {
        plan_name: 'Yearly',
        price: 899.00,
        duration_days: 365,
        description: 'Best value! Ultimate year-long premium access to all live feeds. Ad-free.',
        status: 1
      }
    ]);

    // 2. Seed Super Admin
    console.log('-> Seeding admin...');
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@devdarshanlive.com',
      password: '$2b$10$RnILhElV3YYMP1FOeJh8Fesgabpr7n6ealHPO.mM8taxVlBmbn3d6', // admin123
      role: 'super_admin',
      status: 1
    });

    // 3. Seed Default App Settings (only if none exist)
    console.log('-> Seeding app settings...');
    const settingsCount = await Setting.count();
    if (settingsCount === 0) {
      await Setting.create({
        site_name: 'Dev Darshan Live',
        logo: '/images/logo-placeholder.png',
        support_email: 'support@devdarshanlive.com',
        support_phone: '+919876543210',
        razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key',
        razorpay_secret: process.env.RAZORPAY_SECRET || 'rzp_test_placeholder_secret',
        free_user_ads_enabled: 1,
        maintenance_mode: 0
      });
    }

    // 4. Seed Categories
    console.log('-> Seeding categories...');
    const catVaishno = await Category.create({ category_name: 'Vaishno Devi', image: 'https://images.unsplash.com/photo-1627894483216-2138af692e2e?w=400', status: 1 });
    const catKedar = await Category.create({ category_name: 'Kedarnath', image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400', status: 1 });
    const catSiddhi = await Category.create({ category_name: 'Siddhivinayak', image: 'https://images.unsplash.com/photo-1567591974574-e85263629509?w=400', status: 1 });
    const catGolden = await Category.create({ category_name: 'Golden Temple', image: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400', status: 1 });
    const catSomnath = await Category.create({ category_name: 'Somnath', image: 'https://images.unsplash.com/photo-1604514281729-eb7cae0b968a?w=400', status: 1 });

    // 5. Seed Videos
    console.log('-> Seeding videos...');
    await Video.bulkCreate([
      {
        category_id: catVaishno.id,
        title: 'Maa Vaishno Devi Aarti Live Feed',
        description: 'Live morning and evening Aarti from Holy Shrine of Shri Mata Vaishno Devi Ji, Katra.',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_id: 'dQw4w9WgXcQ',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        is_live: 1,
        featured: 1,
        total_views: 1054,
        status: 1
      },
      {
        category_id: catKedar.id,
        title: 'Kedarnath Dham Daily Darshan',
        description: 'Daily live darshan and evening dynamic Aarti of Shri Kedarnath Jyotirlinga Temple.',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_id: 'dQw4w9WgXcQ',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        is_live: 1,
        featured: 1,
        total_views: 2309,
        status: 1
      },
      {
        category_id: catSiddhi.id,
        title: 'Shree Siddhivinayak Temple Dev Darshan Live',
        description: 'Live feed of Shree Siddhivinayak Ganapati Temple, Prabhadevi, Mumbai.',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_id: 'dQw4w9WgXcQ',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        is_live: 1,
        featured: 0,
        total_views: 503,
        status: 1
      },
      {
        category_id: catGolden.id,
        title: 'Harmandir Sahib Live Gurbani Kirtan',
        description: 'Live Gurbani Kirtan and Darshan from Shri Harmandir Sahib (Golden Temple), Amritsar.',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_id: 'dQw4w9WgXcQ',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        is_live: 1,
        featured: 1,
        total_views: 8432,
        status: 1
      },
      {
        category_id: catSomnath.id,
        title: 'Somnath Jyotirlinga Live Arti',
        description: 'Special live broadcast of Shringar Darshan and Aarti of Somnath Temple, Gujarat.',
        youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtube_id: 'dQw4w9WgXcQ',
        embed_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        is_live: 0,
        featured: 0,
        total_views: 128,
        status: 1
      }
    ]);

    // 6. Seed Banners
    console.log('-> Seeding banners...');
    await Banner.bulkCreate([
      {
        title: 'Experience Divineness: Kedarnath Dham Live',
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=1000',
        link: '/video/2',
        status: 1
      },
      {
        title: 'Chardham Yatra 2026 Special Broadcasts',
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1000',
        link: '/categories',
        status: 1
      },
      {
        title: 'Golden Temple Sri Harmandir Sahib Dev Darshan Live',
        image: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=1000',
        link: '/video/4',
        status: 1
      }
    ]);

    // 7. Seed Advertisements
    console.log('-> Seeding advertisements...');
    await Advertisement.bulkCreate([
      {
        title: 'Pooja Thali & Divine Kits - 20% Off',
        image: 'https://images.unsplash.com/photo-1609137144814-754668ba458a?w=500',
        redirect_url: 'https://example.com/shop/pooja-kit',
        display_after_minutes: 5,
        display_after_videos: 2,
        status: 1
      },
      {
        title: 'Chardham Yatra Travel Packages 2026',
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=500',
        redirect_url: 'https://example.com/travel/chardham',
        display_after_minutes: 10,
        display_after_videos: 3,
        status: 1
      }
    ]);

    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
  }
};

module.exports = { seedDatabase };
