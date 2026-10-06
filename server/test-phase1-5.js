/**
 * CodeMentor AI — Comprehensive Automated Test Suite for Phases 1-5
 * Includes:
 * 1. Health & System Diagnostics
 * 2. JWT Authentication & Password Hashing
 * 3. Multi-Language Code Analysis Validation
 * 4. AI Parser Schema Normalization
 * 5. History & User Data Isolation
 * 6. Security & Confidentiality
 * 7. Profile & Password Change Workflows
 * 8. Analysis Details Completeness
 * 9. Phase 5: Live MongoDB Integration (Registration, Login, Analysis, CRUD, Cross-User Isolation)
 * 10. Phase 5: Offline Store Migration to MongoDB
 * 11. Phase 5: Offline Fallback Resilience & Restart Persistence
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.JWT_SECRET = 'test_jwt_secret_phase5_live_1234567890';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/codementor_test';

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
  clearMemoryStore,
  findUserByEmail,
  saveAnalysis,
  migrateOfflineDataToMongo,
} = require('./services/storageService');
const { parseAndValidateAIResponse } = require('./services/aiService');

let server;
const PORT = 5002;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Helper for making HTTP requests in tests
const makeRequest = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
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
  console.log('🧪 Starting CodeMentor AI Phase 1-5 Full Test Suite');
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
    await connectDB('mongodb://127.0.0.1:27017/codementor_test');

    // ==========================================
    // SECTION 1: Health & System Endpoints
    // ==========================================
    console.log('\n--- Section 1: Health & System Endpoints ---');

    await test('GET / - API root info', async () => {
      const res = await makeRequest('GET', '/');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'CodeMentor AI API');
      assert.ok(res.body.endpoints);
      assert.strictEqual(res.body.version, '5.0.0-phase5');
    });

    await test('GET /api/health - Health status in MongoDB mode', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.database, 'mongodb');
      assert.strictEqual(res.body.databaseStatus, 'connected');
      assert.ok(res.body.aiProvider);
      assert.ok(res.body.auth);
    });

    // ==========================================
    // SECTION 2: Authentication & Validations
    // ==========================================
    console.log('\n--- Section 2: Authentication & Validations ---');

    await test('POST /api/auth/register - Validation: missing name', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        email: 'test@example.com',
        password: 'password123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Name is required'));
    });

    await test('POST /api/auth/register - Validation: invalid email format', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alex Developer',
        email: 'invalid-email-address',
        password: 'password123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('valid email'));
    });

    await test('POST /api/auth/register - Validation: short password (< 6 chars)', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alex Developer',
        email: 'alex@example.com',
        password: '123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('at least 6 characters'));
    });

    let userAToken;
    let userAData;

    await test('POST /api/auth/register - Successfully register User A', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alice Turing',
        email: `alice_${Date.now()}@example.com`,
        password: 'securePassword123',
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.name, 'Alice Turing');
      assert.strictEqual(res.body.data.user.password, undefined);

      userAToken = res.body.data.token;
      userAData = res.body.data.user;
    });

    await test('POST /api/auth/register - Duplicate email prevention', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alice Clone',
        email: userAData.email.toUpperCase(),
        password: 'anotherPassword123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.toLowerCase().includes('already exists'));
    });

    await test('POST /api/auth/login - Validation: missing fields', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: userAData.email,
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Incorrect password', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: userAData.email,
        password: 'wrongPassword123',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Invalid email or password'));
    });

    await test('POST /api/auth/login - Unknown email', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'unknown_nonexistent@example.com',
        password: 'somePassword123',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Successful login', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: userAData.email,
        password: 'securePassword123',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.email, userAData.email);
      assert.strictEqual(res.body.data.user.password, undefined);
    });

    await test('GET /api/auth/me - Access protected profile with valid JWT', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Alice Turing');
      assert.strictEqual(res.body.data.user.email, userAData.email);
      assert.strictEqual(res.body.data.user.password, undefined);
    });

    await test('GET /api/auth/me - Missing token (401)', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, null);
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('GET /api/auth/me - Invalid / forged token (401)', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, 'invalid.jwt.token');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('GET /api/auth/me - Expired token (401 with isExpired flag)', async () => {
      const expiredToken = jwt.sign(
        { id: userAData.id },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
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

    // Register User B for user isolation testing
    let userBToken;
    let userBData;
    await test('POST /api/auth/register - Register User B', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Bob Lovelace',
        email: `bob_${Date.now()}@example.com`,
        password: 'bobSecurePassword456',
      });
      assert.strictEqual(res.status, 201);
      userBToken = res.body.data.token;
      userBData = res.body.data.user;
    });

    // ==========================================
    // SECTION 3: Code Analysis API Validation
    // ==========================================
    console.log('\n--- Section 3: Code Analysis API Validation ---');

    await test('POST /api/code/analyze - Validation: missing code snippet', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', {
        language: 'javascript',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Code snippet cannot be empty'));
    });

    await test('POST /api/code/analyze - Validation: empty whitespace code', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', {
        code: '   \n\t  ',
        language: 'javascript',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Code snippet cannot be empty'));
    });

    await test('POST /api/code/analyze - Validation: missing language', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', {
        code: 'console.log("hello");',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Language parameter is required'));
    });

    await test('POST /api/code/analyze - Validation: unsupported language', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', {
        code: 'puts "hello world"',
        language: 'ruby',
      });
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
    // SECTION 4: AI Parser, Schema & Resilience
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
      assert.strictEqual(parsed.bugs[0].severity, 'Low');
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
      assert.strictEqual(parsed.bugs[0].description, 'Potential division by zero');
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
      assert.strictEqual(res.body.data.user.password, undefined);
    });

    await test('PUT /api/auth/me - Validation: empty name rejected', async () => {
      const res = await makeRequest('PUT', '/api/auth/me', { name: '   ' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Name cannot be empty'));
    });

    await test('PUT /api/auth/me - Password change rejected when current password is wrong', async () => {
      const res = await makeRequest(
        'PUT',
        '/api/auth/me',
        {
          currentPassword: 'incorrectOldPassword',
          newPassword: 'brandNewPassword123',
        },
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
        {
          currentPassword: 'securePassword123',
          newPassword: '123',
        },
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
        {
          currentPassword: 'securePassword123',
          newPassword: 'newAliceSecurePassword2026',
        },
        userAToken
      );
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.password, undefined);
    });

    await test('POST /api/auth/login - Old password fails after password update', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: userAData.email,
        password: 'securePassword123',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - New password successfully logs in', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: userAData.email,
        password: 'newAliceSecurePassword2026',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.name, 'Alice Turing PhD');
    });

    // ==========================================
    // SECTION 6: Phase 5 Live MongoDB Integration (Primary Database)
    // ==========================================
    console.log('\n--- Section 6: Phase 5 Live MongoDB Integration & CRUD ---');

    await test('MongoDB Connection Status - Verify Mongoose is in connected state', () => {
      const status = getDBStatus();
      assert.strictEqual(status.connected, true);
      assert.strictEqual(status.mode, 'mongodb');
      assert.strictEqual(status.status, 'connected');
    });

    let adaAnalysisRecord;
    let bobAnalysisRecord;

    await test('MongoDB Analysis - Save and persist analysis for User A in MongoDB', async () => {
      adaAnalysisRecord = await saveAnalysis({
        userId: userAData.id,
        code: 'function twoSum(nums, target) { const map = new Map(); ... }',
        language: 'javascript',
        analysis: {
          summary: 'Two sum hash map solution with linear scan.',
          codeQuality: {
            score: 95,
            rating: 'Excellent',
            strengths: ['Optimal O(n) runtime', 'Clean hash map indexing'],
            weaknesses: [],
          },
          complexity: { time: 'O(n)', space: 'O(n)' },
          timeComplexity: { notation: 'O(n)', worstCase: 'O(n)', explanation: 'Single pass map lookup' },
          spaceComplexity: { notation: 'O(n)', worstCase: 'O(n)', explanation: 'Hash map storage' },
          bugs: [],
          suggestions: [{ title: 'Input validation', description: 'Validate nums array', priority: 'Low' }],
          optimizedCode: 'function twoSum(nums, target) { ... }',
          explanation: 'Already optimal O(n) time.',
        },
      });

      assert.ok(adaAnalysisRecord._id);

      // Verify directly in MongoDB collection
      const doc = await Analysis.findById(adaAnalysisRecord._id);
      assert.ok(doc);
      assert.strictEqual(doc.language, 'javascript');
      assert.strictEqual(doc.userId.toString(), userAData.id);
    });

    await test('MongoDB Analysis - Save and persist analysis for User B in MongoDB', async () => {
      bobAnalysisRecord = await saveAnalysis({
        userId: userBData.id,
        code: 'def binary_search(arr, target): ...',
        language: 'python',
        analysis: {
          summary: 'Iterative binary search algorithm.',
          codeQuality: {
            score: 92,
            rating: 'Excellent',
            strengths: ['Logarithmic time', 'O(1) auxiliary memory'],
            weaknesses: [],
          },
          complexity: { time: 'O(log n)', space: 'O(1)' },
          timeComplexity: { notation: 'O(log n)', worstCase: 'O(log n)', explanation: 'Halving search space' },
          spaceComplexity: { notation: 'O(1)', worstCase: 'O(1)', explanation: 'Scalar pointers only' },
          bugs: [],
          suggestions: [],
          optimizedCode: 'def binary_search(arr, target): ...',
          explanation: 'Standard optimal binary search.',
        },
      });

      assert.ok(bobAnalysisRecord._id);
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
    // SECTION 7: Offline Store Migration
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
    // SECTION 8: Phase 5 Offline Fallback Resilience
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
      assert.strictEqual(healthRes.body.database, 'offline');
      assert.strictEqual(healthRes.body.databaseStatus, 'fallback');

      // New offline user register
      const offlineEmail = `offline_dev_${Date.now()}@example.com`;
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
      await connectDB('mongodb://127.0.0.1:27017/codementor_test');
      const status = getDBStatus();
      assert.strictEqual(status.connected, true);
      assert.strictEqual(status.mode, 'mongodb');
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
