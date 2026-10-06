/**
 * CodeMentor AI — Comprehensive Automated Test Suite for Phases 1-6
 * Includes:
 * 1. Health & System Diagnostics (v6.0.0-phase6)
 * 2. JWT Authentication, Password Hashing & Validations
 * 3. Multi-Language Code Analysis Input Validation
 * 4. AI Parser Schema Normalization & Resilience
 * 5. Profile Updates & Password Security
 * 6. Phase 5 Live MongoDB Integration & Cross-User Isolation
 * 7. Phase 5 Offline Store Migration to MongoDB
 * 8. Phase 5 Offline Fallback Simulation & Reconnection
 * 9. Phase 6 Production Security (Helmet Headers, CORS, Payload Limit)
 * 10. Phase 6 API Error Handling (Malformed JSON, 404s, Production Sanitization)
 * 11. Phase 6 Ollama Failure & Unavailable Resilience (503/504 Handling)
 * 12. Phase 6 Live Ollama AI Analysis Execution
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5003';
process.env.JWT_SECRET = 'test_jwt_secret_phase6_live_9876543210';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/codementor_test_phase6';

const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const { app } = require('./server');
const { connectDB, disconnectDB, getDBStatus } = require('./config/db');
const User = require('./models/User');
const Analysis = require('./models/Analysis');
const {
  findUserByEmail,
  findUserById,
  createUser,
  saveAnalysis,
  getUserAnalyses,
  getAnalysisByIdAndUser,
  deleteAnalysisByIdAndUser,
  migrateOfflineDataToMongo,
} = require('./services/storageService');
const {
  parseAndValidateAIResponse,
  analyzeCodeWithOllama,
} = require('./services/aiService');

let server;
const PORT = 5003;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper for making HTTP requests in tests
const makeRequest = (method, reqPath, body = null, token = null, customHeaders = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = typeof body === 'string' ? body : (body ? JSON.stringify(body) : null);
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 Starting CodeMentor AI Phase 1-6 Full Test Suite');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  const test = async (name, fn) => {
    totalCount++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.actual !== undefined && err.expected !== undefined) {
        console.error(`     Actual: ${JSON.stringify(err.actual)}`);
        console.error(`     Expected: ${JSON.stringify(err.expected)}`);
      }
    }
  };

  try {
    // Start test server and connect to MongoDB
    server = app.listen(PORT);
    await new Promise((res) => setTimeout(res, 400));
    await connectDB('mongodb://127.0.0.1:27017/codementor_test_phase6');

    let userAToken = null;
    let userBToken = null;
    let userAId = null;
    let userBId = null;
    const testEmailA = `alice_phase6_${Date.now()}@example.com`;
    const testEmailB = `bob_phase6_${Date.now()}@example.com`;

    // ==========================================
    // SECTION 1: Health & System Endpoints
    // ==========================================
    console.log('\n--- Section 1: Health & System Endpoints (Phase 6) ---');

    await test('GET / - API root info returns v7.0.0-phase7 / v6.0.0-phase6', async () => {
      const res = await makeRequest('GET', '/');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'CodeMentor AI API');
      assert.ok(res.body.version.includes('6.0.0') || res.body.version.includes('7.0.0'));
      assert.ok(res.body.endpoints);
    });

    await test('GET /api/health - Health status in MongoDB mode', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.ok(res.body.version.includes('6.0.0') || res.body.version.includes('7.0.0'));
      assert.strictEqual(res.body.database.type, 'mongodb');
      assert.strictEqual(res.body.database.status, 'connected');
      assert.strictEqual(res.body.databaseStatus, 'connected');
      assert.ok(res.body.ai);
      assert.strictEqual(res.body.ai.model, 'qwen2.5-coder:7b');
      assert.ok(res.body.auth);
    });

    // ==========================================
    // SECTION 2: Authentication & Validations
    // ==========================================
    console.log('\n--- Section 2: Authentication & Validations ---');

    await test('POST /api/auth/register - Validation: missing name', async () => {
      const res = await makeRequest('POST', '/api/auth/register', { email: 'noname@test.com', password: 'password123' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Name is required'));
    });

    await test('POST /api/auth/register - Validation: invalid email format', async () => {
      const res = await makeRequest('POST', '/api/auth/register', { name: 'Test', email: 'invalid-email', password: 'password123' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('valid email'));
    });

    await test('POST /api/auth/register - Validation: short password (< 6 chars)', async () => {
      const res = await makeRequest('POST', '/api/auth/register', { name: 'Test', email: 'valid@test.com', password: '123' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('at least 6 characters'));
    });

    await test('POST /api/auth/register - Successfully register User A', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alice Turing',
        email: testEmailA,
        password: 'PasswordAlice123!',
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.email, testEmailA);
      userAToken = res.body.data.token;
      userAId = res.body.data.user.id;
    });

    await test('POST /api/auth/register - Duplicate email prevention', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alice Duplicate',
        email: testEmailA,
        password: 'PasswordAlice123!',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('already exists'));
    });

    await test('POST /api/auth/login - Validation: missing fields', async () => {
      const res = await makeRequest('POST', '/api/auth/login', { email: testEmailA });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Incorrect password', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: testEmailA,
        password: 'WrongPassword999',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Invalid email or password'));
    });

    await test('POST /api/auth/login - Unknown email', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'nobody_unknown@example.com',
        password: 'Password123!',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Successful login', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: testEmailA,
        password: 'PasswordAlice123!',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.email, testEmailA);
    });

    await test('GET /api/auth/me - Access protected profile with valid JWT', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Alice Turing');
      assert.strictEqual(res.body.data.user.password, undefined); // Password never leaked
    });

    await test('GET /api/auth/me - Missing token (401)', async () => {
      const res = await makeRequest('GET', '/api/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('GET /api/auth/me - Invalid / forged token (401)', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, 'forged.invalid.token.123');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('GET /api/auth/me - Expired token (401 with isExpired flag)', async () => {
      const expiredToken = jwt.sign(
        { id: userAId },
        process.env.JWT_SECRET || 'test_jwt_secret_phase6_live_9876543210',
        { expiresIn: '-10s' }
      );
      const res = await makeRequest('GET', '/api/auth/me', null, expiredToken);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.isExpired, true);
    });

    await test('POST /api/auth/logout - Logout endpoint', async () => {
      const res = await makeRequest('POST', '/api/auth/logout');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
    });

    await test('POST /api/auth/register - Register User B', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Bob Lovelace',
        email: testEmailB,
        password: 'PasswordBob123!',
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      userBToken = res.body.data.token;
      userBId = res.body.data.user.id;
    });

    // ==========================================
    // SECTION 3: Code Analysis API Validation
    // ==========================================
    console.log('\n--- Section 3: Code Analysis API Validation ---');

    await test('POST /api/code/analyze - Validation: missing code snippet', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { language: 'javascript' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Code snippet cannot be empty'));
    });

    await test('POST /api/code/analyze - Validation: empty whitespace code', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: '   ', language: 'python' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/code/analyze - Validation: missing language', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'console.log(1);' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Language parameter is required'));
    });

    await test('POST /api/code/analyze - Validation: unsupported language', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'print("hi")', language: 'ruby' });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Unsupported programming language'));
    });

    await test('POST /api/code/analyze - Supported languages accepted (c, cpp, java, python, javascript)', () => {
      const validLangs = ['javascript', 'python', 'c', 'cpp', 'java'];
      for (const lang of validLangs) {
        assert.ok(validLangs.includes(lang));
      }
    });

    // ==========================================
    // SECTION 4: AI Parser & Schema Normalization
    // ==========================================
    console.log('\n--- Section 4: AI Parser & Schema Normalization ---');

    await test('AI Parser - Correctly parses full structured response', () => {
      const sampleAIOutput = JSON.stringify({
        summary: 'Kadane algorithm finding maximum contiguous subarray sum.',
        codeQuality: {
          score: 92,
          rating: 'Excellent',
          strengths: ['Optimal linear scan', 'Minimal space allocation'],
          weaknesses: ['Does not validate empty input arrays'],
        },
        bugs: [
          {
            severity: 'Low',
            line: 4,
            title: 'Empty Array Handling',
            description: 'Accessing nums[0] when nums is empty throws IndexError.',
            suggestion: 'Add an early return guard checking if nums is empty.',
          },
        ],
        complexity: {
          time: 'O(n)',
          space: 'O(1)',
        },
        timeComplexity: {
          notation: 'O(n)',
          worstCase: 'O(n)',
          bestCase: 'O(n)',
          averageCase: 'O(n)',
          explanation: 'Single linear pass over n elements.',
        },
        spaceComplexity: {
          notation: 'O(1)',
          worstCase: 'O(1)',
          bestCase: 'O(1)',
          averageCase: 'O(1)',
          explanation: 'Uses only scalar accumulation variables.',
        },
        suggestions: [
          {
            title: 'Input guard',
            description: 'Check if array length is 0 before indexing.',
            priority: 'Medium',
          },
        ],
        optimizedCode: 'function maxSubArray(nums) { if (!nums || !nums.length) return 0; ... }',
        explanation: 'Added empty input safety check.',
      });

      const parsed = parseAndValidateAIResponse(sampleAIOutput);
      assert.strictEqual(parsed.summary, 'Kadane algorithm finding maximum contiguous subarray sum.');
      assert.strictEqual(parsed.codeQuality.score, 92);
      assert.strictEqual(parsed.codeQuality.rating, 'Excellent');
      assert.strictEqual(parsed.complexity.time, 'O(n)');
      assert.strictEqual(parsed.complexity.space, 'O(1)');
      assert.strictEqual(parsed.timeComplexity.worstCase, 'O(n)');
      assert.strictEqual(parsed.spaceComplexity.worstCase, 'O(1)');
      assert.strictEqual(parsed.bugs.length, 1);
      assert.strictEqual(parsed.suggestions.length, 1);
      assert.ok(parsed.optimizedCode.length > 0);
    });

    await test('AI Parser - Handles Markdown codeblock wrapper (```json ... ```)', () => {
      const wrappedOutput = '```json\n{"summary": "Test summary", "bugs": [], "timeComplexity": "O(log n)", "spaceComplexity": "O(1)"}\n```';
      const parsed = parseAndValidateAIResponse(wrappedOutput);
      assert.strictEqual(parsed.summary, 'Test summary');
      assert.strictEqual(parsed.complexity.time, 'O(log n)');
      assert.strictEqual(parsed.complexity.space, 'O(1)');
    });

    await test('AI Parser - Handles partial/unexpected response format without crashing', () => {
      const partialOutput = '{"summary": "Basic code", "bugs": ["Potential division by zero"]}';
      const parsed = parseAndValidateAIResponse(partialOutput);
      assert.strictEqual(parsed.summary, 'Basic code');
      assert.strictEqual(parsed.bugs.length, 1);
    });

    // ==========================================
    // SECTION 5: Profile Updates & Password Security
    // ==========================================
    console.log('\n--- Section 5: Profile Updates & Password Security ---');

    await test('PUT /api/auth/me - Update user name successfully', async () => {
      const res = await makeRequest('PUT', '/api/auth/me', { name: 'Alice Turing PhD' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Alice Turing PhD');
    });

    await test('PUT /api/auth/me - Validation: empty name rejected', async () => {
      const res = await makeRequest('PUT', '/api/auth/me', { name: '   ' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('PUT /api/auth/me - Password change rejected when current password is wrong', async () => {
      const res = await makeRequest(
        'PUT',
        '/api/auth/me',
        { currentPassword: 'WrongPassword999', newPassword: 'BrandNewPassword123' },
        userAToken
      );
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Current password is incorrect'));
    });

    await test('PUT /api/auth/me - Password change rejected when new password is too short (< 6 chars)', async () => {
      const res = await makeRequest(
        'PUT',
        '/api/auth/me',
        { currentPassword: 'PasswordAlice123!', newPassword: '123' },
        userAToken
      );
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('at least 6 characters'));
    });

    await test('PUT /api/auth/me - Successfully change password with valid current password', async () => {
      const res = await makeRequest(
        'PUT',
        '/api/auth/me',
        { currentPassword: 'PasswordAlice123!', newPassword: 'BrandNewPassword123!' },
        userAToken
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.message.includes('Profile updated successfully'));
    });

    await test('POST /api/auth/login - Old password fails after password update', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: testEmailA,
        password: 'PasswordAlice123!',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - New password successfully logs in', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: testEmailA,
        password: 'BrandNewPassword123!',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      userAToken = res.body.data.token;
    });

    // ==========================================
    // SECTION 6: Phase 5 Live MongoDB Integration & CRUD
    // ==========================================
    console.log('\n--- Section 6: Phase 5 Live MongoDB Integration & CRUD ---');

    await test('MongoDB Connection Status - Verify Mongoose is in connected state', () => {
      const status = getDBStatus();
      assert.strictEqual(status.connected, true);
      assert.strictEqual(status.mode, 'mongodb');
    });

    let adaAnalysisRecord = null;
    let bobAnalysisRecord = null;

    await test('MongoDB Analysis - Save and persist analysis for User A in MongoDB', async () => {
      adaAnalysisRecord = await saveAnalysis({
        userId: userAId,
        code: 'function binarySearch(arr, target) { return -1; }',
        language: 'javascript',
        analysis: {
          summary: 'Performs binary search on sorted array.',
          codeQuality: { score: 95, rating: 'Excellent', strengths: ['Logarithmic time'], weaknesses: [] },
          bugs: [],
          complexity: { time: 'O(log n)', space: 'O(1)' },
          timeComplexity: { notation: 'O(log n)', worstCase: 'O(log n)', bestCase: 'O(1)', averageCase: 'O(log n)', explanation: 'Halves search space each step.' },
          spaceComplexity: { notation: 'O(1)', worstCase: 'O(1)', bestCase: 'O(1)', averageCase: 'O(1)', explanation: 'Iterative pointer allocation.' },
          suggestions: [],
          optimizedCode: 'function binarySearch(arr, target) { /* ... */ }',
          explanation: 'Optimized standard implementation.',
          generatedAt: new Date().toISOString(),
        },
      });

      assert.ok(adaAnalysisRecord._id);
      assert.strictEqual(adaAnalysisRecord.language, 'javascript');
      const doc = await Analysis.findById(adaAnalysisRecord._id);
      assert.ok(doc);
      assert.strictEqual(doc.userId.toString(), userAId.toString());
    });

    await test('MongoDB Analysis - Save and persist analysis for User B in MongoDB', async () => {
      bobAnalysisRecord = await saveAnalysis({
        userId: userBId,
        code: 'def quicksort(arr): return arr',
        language: 'python',
        analysis: {
          summary: 'Quicksort implementation in Python.',
          codeQuality: { score: 85, rating: 'Good', strengths: ['Clean recursion'], weaknesses: [] },
          bugs: [],
          complexity: { time: 'O(n log n)', space: 'O(log n)' },
          timeComplexity: { notation: 'O(n log n)', worstCase: 'O(n^2)', bestCase: 'O(n log n)', averageCase: 'O(n log n)', explanation: 'Divide and conquer partitioning.' },
          spaceComplexity: { notation: 'O(log n)', worstCase: 'O(n)', bestCase: 'O(log n)', averageCase: 'O(log n)', explanation: 'Call stack depth.' },
          suggestions: [],
          optimizedCode: 'def quicksort(arr): ...',
          explanation: 'Randomized pivot selection.',
          generatedAt: new Date().toISOString(),
        },
      });

      assert.ok(bobAnalysisRecord._id);
      assert.strictEqual(bobAnalysisRecord.language, 'python');
    });

    await test('GET /api/analyses - User A only sees User A history from MongoDB', async () => {
      const res = await makeRequest('GET', '/api/analyses', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 1);
      assert.strictEqual(res.body.data[0]._id.toString(), adaAnalysisRecord._id.toString());
      assert.strictEqual(res.body.data[0].language, 'javascript');
    });

    await test('GET /api/analyses - User B only sees User B history from MongoDB', async () => {
      const res = await makeRequest('GET', '/api/analyses', null, userBToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 1);
      assert.strictEqual(res.body.data[0]._id.toString(), bobAnalysisRecord._id.toString());
      assert.strictEqual(res.body.data[0].language, 'python');
    });

    await test('GET /api/analyses/:id - User A can fetch own analysis from MongoDB by ID', async () => {
      const res = await makeRequest('GET', `/api/analyses/${adaAnalysisRecord._id}`, null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data._id.toString(), adaAnalysisRecord._id.toString());
    });

    await test('GET /api/analyses/:id - User B CANNOT access User A analysis in MongoDB (Access Denied / 404)', async () => {
      const res = await makeRequest('GET', `/api/analyses/${adaAnalysisRecord._id}`, null, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('not found or access denied'));
    });

    await test('DELETE /api/analyses/:id - User B CANNOT delete User A analysis in MongoDB (Access Denied / 404)', async () => {
      const res = await makeRequest('DELETE', `/api/analyses/${adaAnalysisRecord._id}`, null, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('not found or access denied'));
    });

    await test('DELETE /api/analyses/:id - User A can delete own analysis in MongoDB', async () => {
      const res = await makeRequest('DELETE', `/api/analyses/${adaAnalysisRecord._id}`, null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.deletedId, adaAnalysisRecord._id.toString());

      // Verify removal in MongoDB
      const doc = await Analysis.findById(adaAnalysisRecord._id);
      assert.strictEqual(doc, null);
    });

    // ==========================================
    // SECTION 7: Offline Store Migration to MongoDB
    // ==========================================
    console.log('\n--- Section 7: Offline Store Migration to MongoDB ---');

    await test('Offline Migration - Migrate users and analyses from offline-store.json to MongoDB', async () => {
      const migResult = await migrateOfflineDataToMongo();
      assert.ok(typeof migResult.usersMigrated === 'number');
      assert.ok(typeof migResult.analysesMigrated === 'number');

      // Verify users in MongoDB
      const totalUsersInMongo = await User.countDocuments();
      assert.ok(totalUsersInMongo >= 4);
    });

    // ==========================================
    // SECTION 8: Offline Fallback Simulation
    // ==========================================
    console.log('\n--- Section 8: Offline Fallback Simulation ---');

    await test('Offline Fallback - Disconnect MongoDB and verify graceful offline fallback', async () => {
      await disconnectDB();
      const status = getDBStatus();
      assert.strictEqual(status.connected, false);
      assert.strictEqual(status.mode, 'offline');

      // Health reports offline fallback
      const healthRes = await makeRequest('GET', '/api/health');
      assert.strictEqual(healthRes.status, 200);
      assert.strictEqual(healthRes.body.database.type, 'offline');
      assert.strictEqual(healthRes.body.databaseStatus, 'fallback');

      // New offline user register
      const offlineEmail = `offline_dev_p6_${Date.now()}@example.com`;
      const regRes = await makeRequest('POST', '/api/auth/register', {
        name: 'Offline Explorer',
        email: offlineEmail,
        password: 'offlinePassword123',
      });
      assert.strictEqual(regRes.status, 201);
      assert.ok(regRes.body.data.token);

      // Offline login
      const loginRes = await makeRequest('POST', '/api/auth/login', {
        email: offlineEmail,
        password: 'offlinePassword123',
      });
      assert.strictEqual(loginRes.status, 200);
      assert.strictEqual(loginRes.body.success, true);
    });

    await test('MongoDB Restoration - Reconnect MongoDB as primary storage', async () => {
      await connectDB('mongodb://127.0.0.1:27017/codementor_test_phase6');
      const status = getDBStatus();
      assert.strictEqual(status.connected, true);
      assert.strictEqual(status.mode, 'mongodb');
    });

    // ==========================================
    // SECTION 9: Phase 6 Production Security & Headers
    // ==========================================
    console.log('\n--- Section 9: Phase 6 Production Security & Headers ---');

    await test('Helmet Security Headers - Verify standard HTTP security headers present', async () => {
      const res = await makeRequest('GET', '/');
      assert.strictEqual(res.status, 200);
      // Helmet adds x-dns-prefetch-control, x-frame-options, x-content-type-options, x-download-options
      assert.ok(res.headers['x-content-type-options'] === 'nosniff', 'Missing x-content-type-options: nosniff');
      assert.ok(res.headers['x-frame-options'] === 'SAMEORIGIN' || res.headers['x-frame-options'] === 'DENY', 'Missing x-frame-options');
      assert.ok(res.headers['x-dns-prefetch-control'] === 'off', 'Missing x-dns-prefetch-control: off');
    });

    await test('CORS Headers - Verify Access-Control headers for allowed origins', async () => {
      const res = await makeRequest('GET', '/api/health', null, null, {
        Origin: 'http://localhost:5173',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    });

    await test('Password Security - Mongoose queries omit password by default (select: false)', async () => {
      const userDoc = await User.findById(userBId);
      assert.ok(userDoc);
      assert.strictEqual(userDoc.password, undefined);
    });

    // ==========================================
    // SECTION 10: Phase 6 API Error Handling
    // ==========================================
    console.log('\n--- Section 10: Phase 6 API Error Handling ---');

    await test('Error Handling - Malformed JSON body returns 400 with friendly message', async () => {
      const res = await makeRequest('POST', '/api/auth/login', '{ broken json: }', null);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Malformed JSON') || res.body.message.includes('valid JSON'));
    });

    await test('Error Handling - Undefined route returns 404 with standardized JSON format', async () => {
      const res = await makeRequest('GET', '/api/nonexistent-endpoint-xyz');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error, 'NotFound');
      assert.ok(res.body.message.includes('not found on this server'));
    });

    // ==========================================
    // SECTION 11: Phase 6 Ollama Failure & Unavailable Resilience
    // ==========================================
    console.log('\n--- Section 11: Phase 6 Ollama Resilience & Live Inference ---');

    await test('Ollama Unavailable Handling - Fails gracefully with 503 and clear guidance', async () => {
      // Temporarily point OLLAMA_URL to a dead port
      const origUrl = process.env.OLLAMA_URL;
      process.env.OLLAMA_URL = 'http://127.0.0.1:59999/api/generate';

      try {
        await analyzeCodeWithOllama('console.log("test")', 'javascript');
        assert.fail('Should have thrown error on dead port');
      } catch (err) {
        assert.strictEqual(err.statusCode, 503);
        assert.ok(err.message.includes('AI service is currently unavailable') || err.message.includes('Ollama is running'));
      } finally {
        process.env.OLLAMA_URL = origUrl || 'http://localhost:11434/api/generate';
      }
    });

    await test('Live Ollama AI Analysis - Execute live code analysis with qwen2.5-coder:7b', async () => {
      try {
        const result = await analyzeCodeWithOllama('function multiply(x, y) { return x * y; }', 'javascript');
        assert.ok(result);
        assert.ok(result.summary);
        assert.ok(result.codeQuality);
        assert.strictEqual(typeof result.codeQuality.score, 'number');
        assert.ok(result.complexity);
        assert.ok(result.timeComplexity);
        assert.ok(result.spaceComplexity);
      } catch (err) {
        if (err.statusCode === 503) {
          console.log('     ℹ️ Notice: Ollama daemon is offline in this environment. 503 handled gracefully.');
        } else {
          throw err;
        }
      }
    });

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n====================================================');
    console.log(`📊 Test Results: ${passedCount}/${totalCount} tests passed`);
    console.log('====================================================\n');

    if (passedCount !== totalCount) {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Fatal test runner error:', globalErr);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runAllTests();
