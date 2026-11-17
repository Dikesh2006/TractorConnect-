const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');

let mongoServer;

const setupTestDB = () => {
  beforeAll(async () => {
    const defaultLocalPath = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
    const opts = {};
    if (fs.existsSync(defaultLocalPath)) {
      opts.binary = { systemBinary: defaultLocalPath };
    }

    mongoServer = await MongoMemoryServer.create(opts);
    const mongoUri = mongoServer.getUri();
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
};

module.exports = { setupTestDB };
