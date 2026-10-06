import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 300s timeout for local LLM inference
});

// Request Interceptor: Attach JWT Token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('codementor_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.isExpired) {
      localStorage.removeItem('codementor_token');
      localStorage.removeItem('codementor_user');
      window.dispatchEvent(new Event('codementor_auth_expired'));
    }
    return Promise.reject(error);
  }
);

/**
 * Format friendly user-facing network errors
 */
const formatNetworkError = (error, defaultMessage) => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. The local AI model is taking longer than expected.';
    }
    return 'Unable to connect to the CodeMentor server. Please make sure the backend is running.';
  }
  return error.response?.data?.message || defaultMessage || 'An unexpected error occurred.';
};

/**
 * Check backend system health
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Unable to connect to backend server'),
    };
  }
};

/* ================= AUTHENTICATION SERVICES ================= */

/**
 * Register a new user account
 */
export const registerUser = async (name, email, password) => {
  try {
    const response = await apiClient.post('/api/auth/register', {
      name,
      email,
      password,
    });
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Registration failed. Please try again.'),
    };
  }
};

/**
 * Log in with email and password
 */
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password,
    });
    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Invalid email or password.',
      };
    }
    return {
      success: false,
      error: formatNetworkError(error, 'Login failed. Please check your credentials and try again.'),
    };
  }
};

/**
 * Fetch currently logged in user profile
 */
export const getMe = async () => {
  try {
    const response = await apiClient.get('/api/auth/me');
    return {
      success: true,
      data: response.data.data?.user,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Session expired or invalid.'),
    };
  }
};

/**
 * Update current user profile
 */
export const updateProfile = async (name, currentPassword, newPassword) => {
  try {
    const payload = {};
    if (name !== undefined) payload.name = name;
    if (currentPassword && newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    const response = await apiClient.put('/api/auth/me', payload);
    return {
      success: true,
      data: response.data.data?.user,
      message: response.data.message || 'Profile updated successfully.',
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to update profile.'),
    };
  }
};

/**
 * Log out user
 */
export const logoutUser = async () => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (e) {
    // Ignore network error on logout
  }
  localStorage.removeItem('codementor_token');
  localStorage.removeItem('codementor_user');
  return { success: true };
};

/* ================= CODE & ANALYSIS SERVICES ================= */

/**
 * Submit code for Local AI Analysis (Ollama + Qwen2.5-Coder)
 */
export const analyzeCode = async (code, language, options = {}) => {
  try {
    const response = await apiClient.post('/api/code/analyze', {
      code,
      language,
      ...options,
    });
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    let errorMsg = error.response?.data?.message;
    if (!errorMsg) {
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'AI analysis request timed out. Please try again with a shorter code snippet or allow more time.';
      } else if (!error.response) {
        errorMsg = 'Unable to connect to the CodeMentor server. Please check if the backend is running.';
      } else {
        errorMsg = 'Failed to analyze code with AI.';
      }
    }

    return {
      success: false,
      error: errorMsg,
      status: error.response?.status,
      errorCode: error.response?.data?.errorCode,
    };
  }
};

/**
 * Generate Structured AI Test Cases (Feature 1)
 */
export const generateTestCases = async (code, language) => {
  try {
    const response = await apiClient.post('/api/code/test-cases', {
      code,
      language,
    });
    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to generate test cases.'),
      status: error.response?.status,
    };
  }
};

/**
 * Deep Bug Explanation (Feature 2)
 */
export const explainBugs = async (code, language) => {
  try {
    const response = await apiClient.post('/api/code/explain-bugs', {
      code,
      language,
    });
    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to explain bugs.'),
      status: error.response?.status,
    };
  }
};

/**
 * Code Explanation by Mode (Feature 3: Beginner, Intermediate, Advanced)
 */
export const explainCode = async (code, language, explanationLevel = 'intermediate') => {
  try {
    const response = await apiClient.post('/api/code/explain', {
      code,
      language,
      explanationLevel,
    });
    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to explain code.'),
      status: error.response?.status,
    };
  }
};

/**
 * Automatic Code Documentation (Feature 5: Simple, Professional, Developer)
 */
export const generateDocumentation = async (code, language, docStyle = 'professional') => {
  try {
    const response = await apiClient.post('/api/code/documentation', {
      code,
      language,
      docStyle,
    });
    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to generate documentation.'),
      status: error.response?.status,
    };
  }
};

/**
 * Compare Original vs Optimized Code (Feature 4)
 */
export const compareOptimization = async (code, language, optimizedCode) => {
  try {
    const response = await apiClient.post('/api/code/compare-optimization', {
      code,
      language,
      optimizedCode,
    });
    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to compare code optimizations.'),
      status: error.response?.status,
    };
  }
};

/**
 * Fetch personal historical analyses for logged in user (with filters)
 */
export const fetchAnalyses = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/analyses', { params });
    return {
      success: true,
      data: response.data?.data || [],
      count: response.data?.count || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to fetch personal analysis history.'),
      data: [],
    };
  }
};

/**
 * Fetch single analysis by ID
 */
export const fetchAnalysisById = async (id) => {
  try {
    const response = await apiClient.get(`/api/analyses/${id}`);
    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to fetch analysis details.'),
    };
  }
};

/**
 * Toggle / Set bookmark on analysis (Feature 6)
 */
export const bookmarkAnalysis = async (id, isBookmarked = undefined) => {
  try {
    const payload = isBookmarked !== undefined ? { isBookmarked } : {};
    const response = await apiClient.put(`/api/analyses/${id}/bookmark`, payload);
    return {
      success: true,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to update bookmark status.'),
    };
  }
};

/**
 * Fetch bookmarked analyses for current user
 */
export const fetchBookmarkedAnalyses = async () => {
  try {
    const response = await apiClient.get('/api/analyses/bookmarked');
    return {
      success: true,
      data: response.data?.data || [],
      count: response.data?.count || 0,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to fetch bookmarks.'),
      data: [],
    };
  }
};

/**
 * Update analysis tags (Feature 7)
 */
export const updateAnalysisTags = async (id, tags) => {
  try {
    const response = await apiClient.put(`/api/analyses/${id}/tags`, { tags });
    return {
      success: true,
      data: response.data?.data,
      message: response.data?.message,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to update analysis tags.'),
    };
  }
};

/**
 * Fetch user coding statistics & improvement insights (Feature 9 & 10)
 */
export const fetchUserStats = async () => {
  try {
    const response = await apiClient.get('/api/analyses/stats');
    return {
      success: true,
      data: response.data?.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to fetch coding statistics.'),
    };
  }
};

/**
 * Delete single analysis by ID
 */
export const deleteAnalysis = async (id) => {
  try {
    const response = await apiClient.delete(`/api/analyses/${id}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatNetworkError(error, 'Failed to delete analysis.'),
    };
  }
};

export default apiClient;
