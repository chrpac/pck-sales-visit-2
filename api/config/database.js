const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const dbHost = process.env.DB_HOST || 'mongodb://localhost:27001';
    const dbName = process.env.DB_NAME || 'site-visit-2';
    const connectionString = `${dbHost}/${dbName}`;
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: dbName, // Explicitly specify database name as option
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
