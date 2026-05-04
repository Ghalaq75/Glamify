require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { seedDemoData } = require('./utils/seed');

const PORT = process.env.PORT || 8080;

connectDB()
  .then(async () => {
    try {
      await seedDemoData();
    } catch (err) {
      console.error('[seed] Failed to seed demo data:', err && err.message);
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  });
