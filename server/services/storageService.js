const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const { getDBStatus } = require('../config/db');

// Local fallback store for environments without a live MongoDB instance.
// Persists outside git so offline registrations and analyses survive backend restarts.
const offlineStorePath = process.env.CODEMENTOR_OFFLINE_STORE_PATH ||
  path.join(__dirname, '..', 'data', 'offline-store.json');

const memoryStore = {
  users: new Map(),        // id -> user object
  usersByEmail: new Map(),  // email -> id
  analyses: new Map(),     // id -> analysis object
};

const loadOfflineStore = () => {
  if (process.env.NODE_ENV === 'test' || !fs.existsSync(offlineStorePath)) return;
  try {
    const saved = JSON.parse(fs.readFileSync(offlineStorePath, 'utf8'));
    for (const user of saved.users || []) {
      memoryStore.users.set(user._id, user);
      memoryStore.usersByEmail.set(user.email, user._id);
    }
    for (const analysis of saved.analyses || []) {
      memoryStore.analyses.set(analysis._id, {
        ...analysis,
        isBookmarked: Boolean(analysis.isBookmarked),
        tags: Array.isArray(analysis.tags) ? analysis.tags : [],
      });
    }
  } catch (error) {
    console.error(`[Database Warning] Could not load offline data: ${error.message}`);
  }
};

const persistOfflineStore = () => {
  if (process.env.NODE_ENV === 'test') return;
  const tempPath = `${offlineStorePath}.tmp`;
  try {
    fs.mkdirSync(path.dirname(offlineStorePath), { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify({
      users: [...memoryStore.users.values()],
      analyses: [...memoryStore.analyses.values()],
    }, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tempPath, offlineStorePath);
  } catch (error) {
    try { fs.rmSync(tempPath, { force: true }); } catch (_) { /* best-effort cleanup */ }
    throw new Error(`Could not persist offline account data: ${error.message}`);
  }
};

loadOfflineStore();

/**
 * Migrate existing data from offline-store.json into MongoDB when connected
 * Safe, idempotent migration preserving IDs, timestamps, and pre-hashed passwords.
 */
const migrateOfflineDataToMongo = async () => {
  const dbStatus = getDBStatus();
  if (!dbStatus.connected || mongoose.connection.readyState !== 1) {
    return { usersMigrated: 0, analysesMigrated: 0 };
  }

  if (!fs.existsSync(offlineStorePath)) {
    return { usersMigrated: 0, analysesMigrated: 0 };
  }

  let saved;
  try {
    saved = JSON.parse(fs.readFileSync(offlineStorePath, 'utf8'));
  } catch (err) {
    console.warn(`[Database Migration] Could not parse offline store: ${err.message}`);
    return { usersMigrated: 0, analysesMigrated: 0 };
  }

  let usersMigrated = 0;
  let analysesMigrated = 0;

  // 1. Migrate Users
  for (const offlineUser of saved.users || []) {
    try {
      const normalizedEmail = (offlineUser.email || '').toLowerCase().trim();
      if (!normalizedEmail) continue;

      const userObjectId = mongoose.Types.ObjectId.isValid(offlineUser._id)
        ? new mongoose.Types.ObjectId(offlineUser._id)
        : null;

      const orConditions = [{ email: normalizedEmail }];
      if (userObjectId) {
        orConditions.push({ _id: userObjectId });
      }

      const existingUser = await User.findOne({ $or: orConditions });

      if (!existingUser) {
        // Direct collection insert preserves the existing bcrypt hash without re-hashing
        const userDoc = {
          _id: userObjectId || new mongoose.Types.ObjectId(),
          name: offlineUser.name || 'Developer',
          email: normalizedEmail,
          password: offlineUser.password, // Pre-hashed bcrypt string
          role: offlineUser.role || 'developer',
          createdAt: offlineUser.createdAt ? new Date(offlineUser.createdAt) : new Date(),
          updatedAt: offlineUser.updatedAt ? new Date(offlineUser.updatedAt) : new Date(),
        };

        await User.collection.insertOne(userDoc);
        usersMigrated++;
      }
    } catch (userMigErr) {
      if (userMigErr.code !== 11000) {
        console.warn(`[Database Migration] User migration notice: ${userMigErr.message}`);
      }
    }
  }

  // 2. Migrate Analyses
  for (const offlineAnalysis of saved.analyses || []) {
    try {
      if (!offlineAnalysis._id) continue;

      const analysisObjectId = mongoose.Types.ObjectId.isValid(offlineAnalysis._id)
        ? new mongoose.Types.ObjectId(offlineAnalysis._id)
        : null;

      if (!analysisObjectId) continue;

      const existingAnalysis = await Analysis.findById(analysisObjectId);
      if (!existingAnalysis) {
        const analysisDoc = {
          _id: analysisObjectId,
          userId: (offlineAnalysis.userId && mongoose.Types.ObjectId.isValid(offlineAnalysis.userId))
            ? new mongoose.Types.ObjectId(offlineAnalysis.userId)
            : null,
          code: offlineAnalysis.code,
          language: (offlineAnalysis.language || 'javascript').toLowerCase().trim(),
          isBookmarked: Boolean(offlineAnalysis.isBookmarked),
          tags: Array.isArray(offlineAnalysis.tags) ? offlineAnalysis.tags : [],
          analysis: offlineAnalysis.analysis || {},
          status: offlineAnalysis.status || 'completed',
          createdAt: offlineAnalysis.createdAt ? new Date(offlineAnalysis.createdAt) : new Date(),
          updatedAt: offlineAnalysis.updatedAt ? new Date(offlineAnalysis.updatedAt) : new Date(),
        };

        await Analysis.collection.insertOne(analysisDoc);
        analysesMigrated++;
      }
    } catch (analysisMigErr) {
      if (analysisMigErr.code !== 11000) {
        console.warn(`[Database Migration] Analysis migration notice: ${analysisMigErr.message}`);
      }
    }
  }

  if (usersMigrated > 0 || analysesMigrated > 0) {
    console.log(`[Database Migration] Successfully migrated ${usersMigrated} user(s) and ${analysesMigrated} analysis record(s) from offline store to MongoDB.`);
  }

  return { usersMigrated, analysesMigrated };
};

/**
 * Storage Service: Unified database interface supporting both Mongoose MongoDB
 * as primary store and resilient in-memory fallback.
 */

// ================= USER OPERATIONS ================= //

/**
 * Find user by email
 */
const findUserByEmail = async (email, { includePassword = false } = {}) => {
  if (!email || typeof email !== 'string') return null;
  const normalizedEmail = email.toLowerCase().trim();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    let query = User.findOne({ email: normalizedEmail });
    if (includePassword) {
      query = query.select('+password');
    }
    return await query.exec();
  }

  // Fallback store
  const userId = memoryStore.usersByEmail.get(normalizedEmail);
  if (!userId) return null;
  const user = memoryStore.users.get(userId);
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'developer',
    password: includePassword ? user.password : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    matchPassword: async function (enteredPassword) {
      if (!user.password) return false;
      return await bcrypt.compare(enteredPassword, user.password);
    },
    toJSON: function () {
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'developer',
        createdAt: user.createdAt,
      };
    },
  };
};

/**
 * Find user by ID
 */
const findUserById = async (id, { includePassword = false } = {}) => {
  if (!id) return null;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    let query = User.findById(id);
    if (!includePassword) {
      query = query.select('-password');
    } else {
      query = query.select('+password');
    }
    return await query.exec();
  }

  // Fallback store
  const user = memoryStore.users.get(id.toString());
  if (!user) return null;

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'developer',
    password: includePassword ? user.password : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    matchPassword: async function (enteredPassword) {
      if (!user.password) return false;
      return await bcrypt.compare(enteredPassword, user.password);
    },
    toJSON: function () {
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'developer',
        createdAt: user.createdAt,
      };
    },
  };
};

/**
 * Create a new user
 */
const createUser = async ({ name, email, password, role = 'developer' }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    return await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
    });
  }

  // Fallback store with real bcrypt hashing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const id = new mongoose.Types.ObjectId().toString();
  const now = new Date();

  const newUser = {
    _id: id,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  memoryStore.users.set(id, newUser);
  memoryStore.usersByEmail.set(normalizedEmail, id);
  persistOfflineStore();

  return {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    createdAt: newUser.createdAt,
    matchPassword: async function (enteredPassword) {
      return await bcrypt.compare(enteredPassword, newUser.password);
    },
    toJSON: function () {
      return {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      };
    },
  };
};

/**
 * Update a user's profile information (name and/or password)
 */
const updateUserProfile = async (id, { name, newPassword } = {}) => {
  if (!id) return null;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const user = await User.findById(id).select('+password');
    if (!user) return null;

    if (name && typeof name === 'string' && name.trim().length > 0) {
      user.name = name.trim();
    }
    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
      user.password = newPassword; // Handled by pre-save bcrypt hook
    }

    await user.save();
    return await User.findById(id).select('-password');
  }

  // Fallback store
  const user = memoryStore.users.get(id.toString());
  if (!user) return null;
  if (name && typeof name === 'string' && name.trim().length > 0) {
    user.name = name.trim();
  }
  if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
  }
  user.updatedAt = new Date().toISOString();
  persistOfflineStore();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || 'developer',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// ================= ANALYSIS OPERATIONS ================= //

/**
 * Save an analysis record
 */
const saveAnalysis = async ({ userId, code, language, analysis, isBookmarked = false, tags = [] }) => {
  const dbStatus = getDBStatus();
  const cleanTags = Array.isArray(tags)
    ? tags.map(t => String(t).trim().toLowerCase()).filter(t => t.length > 0).slice(0, 10)
    : [];

  if (dbStatus.connected) {
    const record = new Analysis({
      userId: (userId && mongoose.Types.ObjectId.isValid(userId)) ? userId : null,
      code,
      language: language.toLowerCase().trim(),
      isBookmarked: Boolean(isBookmarked),
      tags: cleanTags,
      analysis,
      status: 'completed',
    });
    return await record.save();
  }

  // Fallback store
  const id = new mongoose.Types.ObjectId().toString();
  const now = new Date().toISOString();
  const record = {
    _id: id,
    userId: userId ? userId.toString() : null,
    code,
    language: language.toLowerCase().trim(),
    isBookmarked: Boolean(isBookmarked),
    tags: cleanTags,
    analysis,
    status: 'completed',
    createdAt: now,
    updatedAt: now,
  };

  memoryStore.analyses.set(id, record);
  persistOfflineStore();
  return record;
};

/**
 * Fetch all analyses belonging to a specific user (with optional filtering)
 */
const getUserAnalyses = async (userId, { limit = 100, isBookmarked, tag, language, search } = {}) => {
  if (!userId) return [];
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];

    const query = { userId };
    if (isBookmarked !== undefined) {
      query.isBookmarked = isBookmarked === true || isBookmarked === 'true';
    }
    if (tag && typeof tag === 'string' && tag.trim().length > 0) {
      query.tags = tag.trim().toLowerCase();
    }
    if (language && typeof language === 'string' && language.trim().length > 0 && language !== 'all') {
      query.language = language.trim().toLowerCase();
    }
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { 'analysis.summary': searchRegex },
        { code: searchRegex },
        { tags: searchRegex },
      ];
    }

    return await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-__v');
  }

  // Fallback store
  const userIdStr = userId.toString();
  const userRecords = [];
  for (const record of memoryStore.analyses.values()) {
    if (record.userId === userIdStr) {
      // Filter isBookmarked
      if (isBookmarked !== undefined) {
        const targetBM = isBookmarked === true || isBookmarked === 'true';
        if (Boolean(record.isBookmarked) !== targetBM) continue;
      }
      // Filter tag
      if (tag && typeof tag === 'string' && tag.trim().length > 0) {
        const normTag = tag.trim().toLowerCase();
        if (!Array.isArray(record.tags) || !record.tags.includes(normTag)) continue;
      }
      // Filter language
      if (language && typeof language === 'string' && language.trim().length > 0 && language !== 'all') {
        if ((record.language || '').toLowerCase() !== language.trim().toLowerCase()) continue;
      }
      // Filter search
      if (search && typeof search === 'string' && search.trim().length > 0) {
        const term = search.trim().toLowerCase();
        const inSummary = (record.analysis?.summary || '').toLowerCase().includes(term);
        const inCode = (record.code || '').toLowerCase().includes(term);
        const inTags = Array.isArray(record.tags) && record.tags.some(t => t.toLowerCase().includes(term));
        if (!inSummary && !inCode && !inTags) continue;
      }

      userRecords.push(record);
    }
  }

  userRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return userRecords.slice(0, limit);
};

/**
 * Fetch a single analysis by ID with user ownership check
 */
const getAnalysisByIdAndUser = async (id, userId) => {
  if (!id || !userId) return null;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    return await Analysis.findOne({ _id: id, userId }).select('-__v').exec();
  }

  // Fallback store
  const record = memoryStore.analyses.get(id.toString());
  if (!record) return null;
  if (record.userId !== userId.toString()) return null;
  return record;
};

/**
 * Toggle or set bookmark status for a specific analysis (Strict Ownership)
 */
const bookmarkAnalysis = async (id, userId, isBookmarked = undefined) => {
  if (!id || !userId) return null;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    const analysis = await Analysis.findOne({ _id: id, userId });
    if (!analysis) return null;

    if (isBookmarked !== undefined) {
      analysis.isBookmarked = Boolean(isBookmarked);
    } else {
      analysis.isBookmarked = !analysis.isBookmarked;
    }

    await analysis.save();
    return analysis;
  }

  // Fallback store
  const record = memoryStore.analyses.get(id.toString());
  if (!record || record.userId !== userId.toString()) return null;

  if (isBookmarked !== undefined) {
    record.isBookmarked = Boolean(isBookmarked);
  } else {
    record.isBookmarked = !record.isBookmarked;
  }
  record.updatedAt = new Date().toISOString();
  persistOfflineStore();
  return record;
};

/**
 * Fetch all bookmarked analyses for current user
 */
const getBookmarkedAnalyses = async (userId) => {
  return await getUserAnalyses(userId, { isBookmarked: true });
};

/**
 * Update tags for a specific analysis (Strict Ownership)
 */
const updateAnalysisTags = async (id, userId, rawTags) => {
  if (!id || !userId) return null;
  const cleanTags = Array.isArray(rawTags)
    ? [...new Set(rawTags.map(t => String(t).trim().toLowerCase()).filter(t => t.length > 0 && t.length <= 30))].slice(0, 10)
    : [];

  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    const analysis = await Analysis.findOne({ _id: id, userId });
    if (!analysis) return null;

    analysis.tags = cleanTags;
    await analysis.save();
    return analysis;
  }

  // Fallback store
  const record = memoryStore.analyses.get(id.toString());
  if (!record || record.userId !== userId.toString()) return null;

  record.tags = cleanTags;
  record.updatedAt = new Date().toISOString();
  persistOfflineStore();
  return record;
};

/**
 * Delete a single analysis with user ownership check
 */
const deleteAnalysisByIdAndUser = async (id, userId) => {
  if (!id || !userId) return null;
  const dbStatus = getDBStatus();

  if (dbStatus.connected) {
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return null;
    }
    return await Analysis.findOneAndDelete({ _id: id, userId }).exec();
  }

  // Fallback store
  const record = memoryStore.analyses.get(id.toString());
  if (!record) return null;
  if (record.userId !== userId.toString()) return null;
  memoryStore.analyses.delete(id.toString());
  persistOfflineStore();
  return record;
};

/**
 * Calculate rich statistics and coding insights for a user (Strict Isolation)
 */
const getUserStats = async (userId) => {
  if (!userId) {
    return {
      totalAnalyses: 0,
      analysesThisWeek: 0,
      analysesThisMonth: 0,
      mostUsedLanguage: 'N/A',
      bookmarkedCount: 0,
      totalBugsDetected: 0,
      analysesByLanguage: {},
      averageQualityScore: 0,
      mostUsedTags: [],
      recentActivity: [],
      codingInsights: [],
    };
  }

  const userAnalyses = await getUserAnalyses(userId, { limit: 500 });
  const totalAnalyses = userAnalyses.length;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let analysesThisWeek = 0;
  let analysesThisMonth = 0;
  let bookmarkedCount = 0;
  let totalBugsDetected = 0;
  let scoreSum = 0;
  let scoredCount = 0;

  const analysesByLanguage = {};
  const tagCounts = {};
  const dailyCounts = {};

  for (const item of userAnalyses) {
    const created = item.createdAt ? new Date(item.createdAt) : null;
    if (created) {
      if (created >= oneWeekAgo) analysesThisWeek++;
      if (created >= oneMonthAgo) analysesThisMonth++;

      const dateKey = created.toISOString().split('T')[0];
      dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    }

    if (item.isBookmarked) {
      bookmarkedCount++;
    }

    const lang = (item.language || 'unknown').toLowerCase();
    analysesByLanguage[lang] = (analysesByLanguage[lang] || 0) + 1;

    const bugs = item.analysis?.bugs || [];
    totalBugsDetected += Array.isArray(bugs) ? bugs.length : 0;

    const score = item.analysis?.codeQuality?.score;
    if (typeof score === 'number' && !isNaN(score)) {
      scoreSum += score;
      scoredCount++;
    }

    const tags = Array.isArray(item.tags) ? item.tags : [];
    for (const t of tags) {
      const normTag = t.toLowerCase();
      tagCounts[normTag] = (tagCounts[normTag] || 0) + 1;
    }
  }

  // Determine Most Used Language
  let mostUsedLanguage = 'N/A';
  let maxLangCount = 0;
  for (const [l, count] of Object.entries(analysesByLanguage)) {
    if (count > maxLangCount) {
      maxLangCount = count;
      mostUsedLanguage = l;
    }
  }

  // Average quality score
  const averageQualityScore = scoredCount > 0 ? Math.round(scoreSum / scoredCount) : 0;

  // Most used tags sorted descending
  const mostUsedTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recent 7-day activity array
  const recentActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
    recentActivity.push({
      date: key,
      day: dayName,
      count: dailyCounts[key] || 0,
    });
  }

  // Generate factual, descriptive "Coding Insights" strictly based on data
  const codingInsights = [];

  if (totalAnalyses > 0) {
    if (mostUsedLanguage !== 'N/A') {
      const langPercentage = Math.round((maxLangCount / totalAnalyses) * 100);
      codingInsights.push(
        `${mostUsedLanguage.toUpperCase()} is your most frequently analyzed language, accounting for ${langPercentage}% (${maxLangCount}/${totalAnalyses}) of total submissions.`
      );
    }

    if (analysesThisWeek > 0) {
      codingInsights.push(
        `Active pace: ${analysesThisWeek} code ${analysesThisWeek === 1 ? 'analysis' : 'analyses'} completed in the past 7 days.`
      );
    } else {
      codingInsights.push('No new analyses logged in the last 7 days. Start a new session in Code Mentor to keep skills sharp.');
    }

    if (totalBugsDetected > 0) {
      codingInsights.push(
        `Resolved ${totalBugsDetected} potential issue${totalBugsDetected === 1 ? '' : 's'} across your algorithm submissions.`
      );
    }

    if (mostUsedTags.length > 0) {
      const topTagNames = mostUsedTags.slice(0, 3).map(t => `#${t.tag}`).join(', ');
      codingInsights.push(`Frequently practiced topics & tags: ${topTagNames}.`);
    }

    if (bookmarkedCount > 0) {
      codingInsights.push(`You have saved ${bookmarkedCount} key ${bookmarkedCount === 1 ? 'analysis' : 'analyses'} to your bookmarks for quick reference.`);
    }

    if (averageQualityScore > 0) {
      codingInsights.push(`Average quality score across verified submissions is ${averageQualityScore}/100.`);
    }
  } else {
    codingInsights.push('Welcome to CodeMentor AI! Submit code in the workspace to see detailed coding metrics and personalized insights.');
  }

  return {
    totalAnalyses,
    analysesThisWeek,
    analysesThisMonth,
    mostUsedLanguage,
    bookmarkedCount,
    totalBugsDetected,
    analysesByLanguage,
    averageQualityScore,
    mostUsedTags,
    recentActivity,
    codingInsights,
  };
};

/**
 * Clear in-memory store (useful for unit/integration tests)
 */
const clearMemoryStore = () => {
  memoryStore.users.clear();
  memoryStore.usersByEmail.clear();
  memoryStore.analyses.clear();
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  saveAnalysis,
  getUserAnalyses,
  getAnalysisByIdAndUser,
  bookmarkAnalysis,
  getBookmarkedAnalyses,
  updateAnalysisTags,
  deleteAnalysisByIdAndUser,
  getUserStats,
  migrateOfflineDataToMongo,
  clearMemoryStore,
};
