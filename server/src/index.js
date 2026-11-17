const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    server = app.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`🚜 TractorConnect Server listening on port ${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🩺 Health check: http://localhost:${config.port}/api/health`);
      console.log(`🔗 API Base URL: http://localhost:${config.port}/api/v1`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error(`Fatal: Failed to start server:`, error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server & MongoDB connection...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed.');
      await disconnectDB();
      console.log('[Server] Process exited gracefully.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

startServer();
