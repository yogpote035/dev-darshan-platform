const app = require('./app');
const { sequelize } = require('./src/models');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Test DB Connection and Start Server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync models in safe mode (does not alter existing structures)
    await sequelize.sync({ alter: false, force: false });
    console.log('Database models synchronized.');

    // Run custom referral/withdrawal schema migrations
    const { runMigration } = require('./src/utils/migration');
    await runMigration();

    // Programmatically seed default records if database is fresh/empty
    const { seedDatabase } = require('./src/utils/seeder');
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Server is running on: http://localhost:${PORT}`);
      console.log(`🌐 Swagger UI Docs:     http://localhost:${PORT}/api/docs`);
      console.log(`⚙️ Admin Panel URL:    http://localhost:${PORT}/admin/login`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    // If database connection fails, run server anyway so developers can edit configurations via admin settings
    app.listen(PORT, () => {
      console.log(`⚠️ Database unavailable. Running server on: http://localhost:${PORT}`);
    });
  }
};

startServer();
