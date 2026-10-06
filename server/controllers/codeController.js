const {
  saveAnalysis,
  getUserAnalyses,
  getAnalysisByIdAndUser,
  deleteAnalysisByIdAndUser,
  bookmarkAnalysis,
  getBookmarkedAnalyses: fetchBookmarkedAnalyses,
  updateAnalysisTags: setAnalysisTags,
  getUserStats: fetchUserStats,
} = require('../services/storageService');

const {
  analyzeCodeWithOllama,
  generateTestCasesWithOllama,
  explainBugsWithOllama,
  explainCodeWithOllama,
  generateDocumentationWithOllama,
  compareOptimizationWithOllama,
} = require('../services/aiService');

// Supported languages and payload constraints
const ALLOWED_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'c', 'typescript'];
const MAX_CODE_LENGTH = 50000; // 50KB limit

/**
 * Validate code and language input payload
 */
const validateCodePayload = (req, res) => {
  if (!req.body || typeof req.body !== 'object') {
    return {
      isValid: false,
      response: res.status(400).json({
        success: false,
        message: 'Invalid request body. JSON payload is required.',
      }),
    };
  }

  const { code, language } = req.body;

  if (code === undefined || code === null || typeof code !== 'string' || code.trim().length === 0) {
    return {
      isValid: false,
      response: res.status(400).json({
        success: false,
        message: 'Code snippet cannot be empty.',
      }),
    };
  }

  if (code.length > MAX_CODE_LENGTH) {
    return {
      isValid: false,
      response: res.status(400).json({
        success: false,
        message: `Code snippet exceeds maximum permitted size (${MAX_CODE_LENGTH} characters).`,
      }),
    };
  }

  if (!language || typeof language !== 'string' || language.trim().length === 0) {
    return {
      isValid: false,
      response: res.status(400).json({
        success: false,
        message: 'Language parameter is required.',
      }),
    };
  }

  const normalizedLang = language.toLowerCase().trim();
  if (!ALLOWED_LANGUAGES.includes(normalizedLang)) {
    return {
      isValid: false,
      response: res.status(400).json({
        success: false,
        message: `Unsupported programming language "${language}". Supported languages are: ${ALLOWED_LANGUAGES.join(', ')}`,
      }),
    };
  }

  return { isValid: true, code, normalizedLang };
};

/**
 * @desc    Submit code for AI analysis (with optional user association if authenticated)
 * @route   POST /api/code/analyze
 * @access  Public / Optional Auth
 */
const analyzeCode = async (req, res, next) => {
  try {
    const validation = validateCodePayload(req, res);
    if (!validation.isValid) return validation.response;

    const { code, normalizedLang } = validation;
    const { isBookmarked = false, tags = [] } = req.body;

    // Call Ollama AI Service
    let aiAnalysisResult;
    try {
      aiAnalysisResult = await analyzeCodeWithOllama(code, normalizedLang);
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'AI analysis failed. Please try again.',
        errorCode: aiError.code || 'AI_ERROR',
      });
    }

    // Persist analysis with userId if authenticated
    let savedRecord = null;
    try {
      savedRecord = await saveAnalysis({
        userId: req.user ? req.user._id : null,
        code,
        language: normalizedLang,
        analysis: aiAnalysisResult,
        isBookmarked: Boolean(isBookmarked),
        tags: Array.isArray(tags) ? tags : [],
      });
    } catch (dbErr) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Database] Failed to save analysis record:', dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        analysisId: savedRecord ? savedRecord._id : `analysis_${Date.now()}`,
        language: normalizedLang,
        analysis: aiAnalysisResult,
        isBookmarked: savedRecord ? Boolean(savedRecord.isBookmarked) : false,
        tags: savedRecord && Array.isArray(savedRecord.tags) ? savedRecord.tags : [],
        createdAt: savedRecord ? savedRecord.createdAt : new Date().toISOString(),
        isSaved: Boolean(req.user && savedRecord),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate structured AI test cases for submitted code
 * @route   POST /api/code/test-cases
 * @access  Private
 */
const generateTestCases = async (req, res, next) => {
  try {
    const validation = validateCodePayload(req, res);
    if (!validation.isValid) return validation.response;

    const { code, normalizedLang } = validation;

    try {
      const result = await generateTestCasesWithOllama(code, normalizedLang);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'Failed to generate test cases.',
        errorCode: aiError.code || 'AI_ERROR',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Explain bugs and vulnerabilities with detailed mechanics and fixes
 * @route   POST /api/code/explain-bugs
 * @access  Private
 */
const explainBugs = async (req, res, next) => {
  try {
    const validation = validateCodePayload(req, res);
    if (!validation.isValid) return validation.response;

    const { code, normalizedLang } = validation;

    try {
      const result = await explainBugsWithOllama(code, normalizedLang);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'Failed to explain code bugs.',
        errorCode: aiError.code || 'AI_ERROR',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Explain code by selected skill mode (Beginner, Intermediate, Advanced)
 * @route   POST /api/code/explain
 * @access  Private
 */
const explainCode = async (req, res, next) => {
  try {
    const validation = validateCodePayload(req, res);
    if (!validation.isValid) return validation.response;

    const { code, normalizedLang } = validation;
    const { explanationLevel = 'intermediate' } = req.body;

    const validLevels = ['beginner', 'intermediate', 'advanced'];
    const levelStr = String(explanationLevel).toLowerCase().trim();
    if (!validLevels.includes(levelStr)) {
      return res.status(400).json({
        success: false,
        message: `Invalid explanationLevel "${explanationLevel}". Allowed levels: beginner, intermediate, advanced.`,
      });
    }

    try {
      const result = await explainCodeWithOllama(code, normalizedLang, levelStr);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'Failed to explain code.',
        errorCode: aiError.code || 'AI_ERROR',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate structured comments and documentation (Simple, Professional, Developer)
 * @route   POST /api/code/documentation
 * @access  Private
 */
const generateDocumentation = async (req, res, next) => {
  try {
    const validation = validateCodePayload(req, res);
    if (!validation.isValid) return validation.response;

    const { code, normalizedLang } = validation;
    const { docStyle = 'professional' } = req.body;

    const validStyles = ['simple', 'professional', 'developer'];
    const styleStr = String(docStyle).toLowerCase().trim();
    if (!validStyles.includes(styleStr)) {
      return res.status(400).json({
        success: false,
        message: `Invalid docStyle "${docStyle}". Allowed styles: simple, professional, developer.`,
      });
    }

    try {
      const result = await generateDocumentationWithOllama(code, normalizedLang, styleStr);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'Failed to generate code documentation.',
        errorCode: aiError.code || 'AI_ERROR',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Compare Original vs Optimized Code with detailed complexity analysis
 * @route   POST /api/code/compare-optimization
 * @access  Private
 */
const compareOptimization = async (req, res, next) => {
  try {
    const validation = validateCodePayload(req, res);
    if (!validation.isValid) return validation.response;

    const { code, normalizedLang } = validation;
    const { optimizedCode } = req.body;

    if (!optimizedCode || typeof optimizedCode !== 'string' || optimizedCode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Optimized code snippet is required for comparison.',
      });
    }

    try {
      const result = await compareOptimizationWithOllama(code, normalizedLang, optimizedCode);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (aiError) {
      const statusCode = aiError.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: aiError.message || 'Failed to compare code optimization.',
        errorCode: aiError.code || 'AI_ERROR',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personal historical analyses for current authenticated user
 * @route   GET /api/analyses
 * @access  Private
 */
const getAnalyses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { isBookmarked, tag, language, search, limit } = req.query;

    const analyses = await getUserAnalyses(userId, {
      isBookmarked: isBookmarked !== undefined ? (isBookmarked === 'true' || isBookmarked === true) : undefined,
      tag,
      language,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
    });

    return res.status(200).json({
      success: true,
      count: analyses.length,
      data: analyses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single analysis by ID (strictly verified to belong to current user)
 * @route   GET /api/analyses/:id
 * @access  Private
 */
const getAnalysisById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const analysis = await getAnalysisByIdAndUser(id, userId);
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid analysis ID format.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Toggle or set bookmark status on owned analysis
 * @route   PUT /api/analyses/:id/bookmark
 * @access  Private
 */
const toggleBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { isBookmarked } = req.body || {};

    const updatedRecord = await bookmarkAnalysis(id, userId, isBookmarked);
    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Analysis ${updatedRecord.isBookmarked ? 'bookmarked' : 'unbookmarked'} successfully.`,
      data: updatedRecord,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid analysis ID format.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get all bookmarked analyses for logged-in user
 * @route   GET /api/analyses/bookmarked
 * @access  Private
 */
const getBookmarkedAnalyses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const bookmarkedList = await fetchBookmarkedAnalyses(userId);

    return res.status(200).json({
      success: true,
      count: bookmarkedList.length,
      data: bookmarkedList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update tags for owned analysis
 * @route   PUT /api/analyses/:id/tags
 * @access  Private
 */
const updateAnalysisTags = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags must be provided as an array of strings.',
      });
    }

    if (tags.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'A maximum of 10 tags is allowed per analysis.',
      });
    }

    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.trim().length === 0 || tag.trim().length > 30) {
        return res.status(400).json({
          success: false,
          message: 'Each tag must be a non-empty string under 30 characters.',
        });
      }
    }

    const updatedRecord = await setAnalysisTags(id, userId, tags);
    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Analysis tags updated successfully.',
      data: updatedRecord,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid analysis ID format.',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get user's coding statistics & insights
 * @route   GET /api/analyses/stats
 * @access  Private
 */
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const stats = await fetchUserStats(userId);

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete single analysis by ID (strictly verified to belong to current user)
 * @route   DELETE /api/analyses/:id
 * @access  Private
 */
const deleteAnalysis = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const deletedRecord = await deleteAnalysisByIdAndUser(id, userId);
    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Analysis record not found or access denied.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Analysis record deleted successfully.',
      deletedId: id,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Invalid analysis ID format.',
      });
    }
    next(error);
  }
};

module.exports = {
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
};
