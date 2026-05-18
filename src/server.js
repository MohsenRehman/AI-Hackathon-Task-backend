import app from './app.js';
import { config, validateEnv } from './config/env.js';

// Validate environment variables on startup
validateEnv();

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`Server running in${config.env} mode on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
