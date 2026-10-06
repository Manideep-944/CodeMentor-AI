const mongoose = require('mongoose');

let isConnected = false;

/**
 * Sanitize MongoDB URI to prevent credential leakage in logs
 */
const sanitizeMongoURI = (uri) => {
  if (!uri) return '';
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)@/, '$1*****@');
};

/**
 * Configure Mongoose Connection Listeners
 */
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[Database] MongoDB disconnected. Operating with persistent offline fallback.');
  }
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  if (process.env.NODE_ENV !== 'test') {
    console.log('[Database] MongoDB connection re-established.');
  }
});

/**
 * Connect to MongoDB database instance
 * Supports local MongoDB and MongoDB Atlas URIs from environment variables
 */
const connectDB = async (customURI = null) => {
  const mongoURI = customURI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codementor';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3s instead of hanging if offline
    });

    isConnected = true;
    const dbName = conn.connection.name || 'codementor';
    const host = conn.connection.host || '127.0.0.1';

    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Database] MongoDB Connected successfully: ${host}/${dbName}`);
    }

    // Trigger offline data migration on successful MongoDB connection
    try {
      const { migrateOfflineDataToMongo } = require('../services/storageService');
      if (typeof migrateOfflineDataToMongo === 'function') {
        await migrateOfflineDataToMongo();
      }
    } catch (migErr) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[Database Migration] Notice: ${migErr.message}`);
      }
    }

    return conn;
  } catch (error) {
    isConnected = false;
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Database Warning] MongoDB connection failed: ${error.message}`);
      console.warn('[Database Warning] Running in offline database mode. Resilient fallback (server/data/offline-store.json) active.');
    }
    return null;
  }
};

/**
 * Disconnect from MongoDB instance (clean teardown)
 */
const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    isConnected = false;
  } catch (error) {
    console.error(`[Database Error] Disconnect error: ${error.message}`);
  }
};

/**
 * Get comprehensive database health & connection status
 */
const getDBStatus = () => {
  const ready = mongoose.connection.readyState === 1;
  return {
    connected: isConnected && ready,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'none',
    database: mongoose.connection.name || 'codementor',
    mode: (isConnected && ready) ? 'mongodb' : 'offline',
    status: (isConnected && ready) ? 'connected' : 'fallback',
  };
};

module.exports = { connectDB, disconnectDB, getDBStatus, sanitizeMongoURI };
