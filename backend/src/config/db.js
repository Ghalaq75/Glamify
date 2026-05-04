const mongoose = require('mongoose');

let _mongoServer = null;

async function connectDB() {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      _mongoServer = await MongoMemoryServer.create();
      uri = _mongoServer.getUri();
      console.log('[dev] Using in-memory MongoDB:', uri);
    } catch (err) {
      throw new Error('MONGODB_URI is not set and mongodb-memory-server is unavailable: ' + err.message);
    }
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = connectDB;
