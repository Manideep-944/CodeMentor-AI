const express = require('express');
const router = express.Router();
const {
  analyzeCode,
  generateTestCases,
  explainBugs,
  explainCode,
  generateDocumentation,
  compareOptimization,
  getAnalyses,
  getAnalysisById,
  toggleBookmark,
  getBookmarkedAnalyses,
  updateAnalysisTags,
  getUserStats,
  deleteAnalysis,
} = require('../controllers/codeController');
const { protect, optionalAuth } = require('../middleware/auth');

// POST /api/code/analyze (optional auth: records userId if logged in)
router.post('/analyze', optionalAuth, analyzeCode);

// Phase 7 AI Feature Endpoints (protected)
router.post('/test-cases', protect, generateTestCases);
router.post('/explain-bugs', protect, explainBugs);
router.post('/explain', protect, explainCode);
router.post('/documentation', protect, generateDocumentation);
router.post('/generate-docs', protect, generateDocumentation); // Alias for convenience
router.post('/compare-optimization', protect, compareOptimization);

// Analysis History & Management Endpoints
router.get('/analyses/stats', protect, getUserStats);
router.get('/analyses/bookmarked', protect, getBookmarkedAnalyses);
router.get('/analyses', protect, getAnalyses);
router.get('/analyses/:id', protect, getAnalysisById);
router.put('/analyses/:id/bookmark', protect, toggleBookmark);
router.put('/analyses/:id/tags', protect, updateAnalysisTags);
router.delete('/analyses/:id', protect, deleteAnalysis);

module.exports = router;
