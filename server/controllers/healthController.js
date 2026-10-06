const { getDBStatus } = require('../config/db');

/**
 * @desc    Check system, database, and AI service health
 * @route   GET /api/health
 * @access  Public
 */
const getHealthStatus = (req, res) => {
  const dbStatus = getDBStatus();

  res.status(200).json({
    status: 'ok',
    message: 'CodeMentor AI Backend is operational',
    version: '7.5.0-phase7.5',
    uptime: `${Math.floor(process.uptime())}s`,
    database: {
      type: dbStatus.connected ? 'mongodb' : 'offline',
      status: dbStatus.connected ? 'connected' : 'fallback',
      mode: dbStatus.mode,
      name: dbStatus.database,
    },
    // Top-level compatibility fields
    databaseType: dbStatus.connected ? 'mongodb' : 'offline',
    databaseStatus: dbStatus.connected ? 'connected' : 'fallback',
    dbDetails: {
      connected: dbStatus.connected,
      mode: dbStatus.mode,
      database: dbStatus.database,
      status: dbStatus.connected ? 'Connected' : 'Offline / Standalone Mode',
    },
    ai: {
      provider: 'ollama',
      model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
      endpoint: process.env.OLLAMA_URL || 'http://localhost:11434/api/generate',
      status: 'configured',
    },
    aiProvider: {
      provider: 'Ollama (Local AI)',
      model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
      endpoint: process.env.OLLAMA_URL || 'http://localhost:11434/api/generate',
      configured: true,
    },
    auth: {
      enabled: true,
      strategy: 'JWT (jsonwebtoken) + bcryptjs',
    },
    supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'c', 'typescript'],
    phase: 'Phase 7.5: Multi-Language Programming Support',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealthStatus,
};
