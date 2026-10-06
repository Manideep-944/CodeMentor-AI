const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const healthRoutes = require('./routes/healthRoutes');
const codeRoutes = require('./routes/codeRoutes');
const authRoutes = require('./routes/authRoutes');
const { protect } = require('./middleware/auth');
const {
  getAnalyses,
  getAnalysisById,
  deleteAnalysis,
  toggleBookmark,
  getBookmarkedAnalyses,
  updateAnalysisTags,
  getUserStats,
} = require('./controllers/codeController');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (Primary: MongoDB, Fallback: server/data/offline-store.json)
connectDB();

// Production Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Dynamic CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
];

if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server tests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Request parsing middlewares with size limit protection
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Request Logging (Dev mode)
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Route Registrations
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);

// Direct convenience routes for personal analysis history, stats & bookmarks
app.get('/api/analyses/stats', protect, getUserStats);
app.get('/api/analyses/bookmarked', protect, getBookmarkedAnalyses);
app.get('/api/analyses', protect, getAnalyses);
app.get('/api/analyses/:id', protect, getAnalysisById);
app.put('/api/analyses/:id/bookmark', protect, toggleBookmark);
app.put('/api/analyses/:id/tags', protect, updateAnalysisTags);
app.delete('/api/analyses/:id', protect, deleteAnalysis);

// Root index route with API metadata
app.get('/', (req, res) => {
  res.json({
    name: 'CodeMentor AI API',
    version: '7.5.0-phase7.5',
    description: 'Intelligent Multi-Language Coding Mentor Backend with MongoDB Primary Database, Ollama AI (Qwen2.5-Coder), & Advanced AI Coding Features',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      updateProfile: 'PUT /api/auth/me',
      analyze: 'POST /api/code/analyze',
      testCases: 'POST /api/code/test-cases',
      explainBugs: 'POST /api/code/explain-bugs',
      explain: 'POST /api/code/explain',
      documentation: 'POST /api/code/documentation',
      compareOptimization: 'POST /api/code/compare-optimization',
      analyses: 'GET /api/analyses',
      analysisDetail: 'GET /api/analyses/:id',
      bookmarks: 'GET /api/analyses/bookmarked',
      bookmarkToggle: 'PUT /api/analyses/:id/bookmark',
      tagsUpdate: 'PUT /api/analyses/:id/tags',
      stats: 'GET /api/analyses/stats',
      deleteAnalysis: 'DELETE /api/analyses/:id',
    },
    supportedLanguages: ['javascript', 'python', 'java', 'cpp', 'c', 'typescript'],
    phase: 'Phase 7.5: Multi-Language Programming Support',
  });
});

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Endpoint ${req.method} ${req.originalUrl} not found on this server.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start Server
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 CodeMentor AI Backend v7.5.0-phase7.5`);
    console.log(`📡 Port: ${PORT} | Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
    console.log(`💻 Analyze API: http://localhost:${PORT}/api/code/analyze`);
    console.log(`🧪 Test Cases API: http://localhost:${PORT}/api/code/test-cases`);
    console.log(`=============================================`);
  });
}

// Handle unhandled errors safely
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err ? err.message || err : 'Unknown rejection'}`);
});

process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception]: ${err ? err.message || err : 'Unknown exception'}`);
});

module.exports = { app, server };
