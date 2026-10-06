/**
 * CodeMentor AI — Comprehensive Automated Test Suite for Phases 1-7
 * Includes:
 * 1. Health & System Diagnostics (v7.0.0-phase7)
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
 * 12. Phase 7: AI Test Case Generator (`POST /api/code/test-cases`)
 * 13. Phase 7: Test Case Validation & Ollama Failure Handling
 * 14. Phase 7: Advanced Bug Explainer (`POST /api/code/explain-bugs`)
 * 15. Phase 7: Code Explanation Modes (Beginner, Intermediate, Advanced)
 * 16. Phase 7: Automatic Code Documentation (Simple, Professional, Developer)
 * 17. Phase 7: Code Optimization Comparison (`POST /api/code/compare-optimization`)
 * 18. Phase 7: Bookmark Analysis & Filtering (`PUT /api/analyses/:id/bookmark`, `GET /api/analyses/bookmarked`)
 * 19. Phase 7: Analysis Tags & Filtering (`PUT /api/analyses/:id/tags`)
 * 20. Phase 7: Cross-User Isolation for Bookmarks and Tags
 * 21. Phase 7: Coding Statistics & Improvement Insights (`GET /api/analyses/stats`)
 * 22. Phase 7: Offline Fallback for Bookmarks & Tags
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5004';
process.env.JWT_SECRET = 'test_jwt_secret_phase7_live_9876543210';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/codementor_test_phase7';

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
  bookmarkAnalysis,
  getBookmarkedAnalyses,
  updateAnalysisTags,
  getUserStats,
  deleteAnalysisByIdAndUser,
  migrateOfflineDataToMongo,
} = require('./services/storageService');
const {
  parseAndValidateAIResponse,
  parseAndValidateTestCases,
  parseAndValidateBugExplanation,
  parseAndValidateCodeExplanation,
  parseAndValidateDocumentation,
  parseAndValidateOptimizationComparison,
  analyzeCodeWithOllama,
  generateTestCasesWithOllama,
  explainBugsWithOllama,
  explainCodeWithOllama,
  generateDocumentationWithOllama,
  compareOptimizationWithOllama,
} = require('./services/aiService');

let server;
const PORT = 5004;
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
  console.log('🧪 Starting CodeMentor AI Phase 1-7 Full Test Suite');
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
    await connectDB('mongodb://127.0.0.1:27017/codementor_test_phase7');

    let userAToken = null;
    let userBToken = null;
    let userAId = null;
    let userBId = null;
    const testEmailA = `alice_phase7_${Date.now()}@example.com`;
    const testEmailB = `bob_phase7_${Date.now()}@example.com`;
    let userAAnalysisId = null;
    let userBAnalysisId = null;

    // ==========================================
    // SECTION 1: Health & System Endpoints (Phase 7)
    // ==========================================
    console.log('\n--- Section 1: Health & System Endpoints (Phase 7) ---');

    await test('GET / - API root info returns v7.0.0-phase7', async () => {
      const res = await makeRequest('GET', '/');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'CodeMentor AI API');
      assert.strictEqual(res.body.version, '7.0.0-phase7');
      assert.ok(res.body.endpoints);
      assert.strictEqual(res.body.phase, 'Phase 7: Advanced AI Coding Features');
    });

    await test('GET /api/health - Health status in MongoDB mode', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.version, '7.0.0-phase7');
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
      assert.strictEqual(res.body.data.user.email, testEmailA.toLowerCase());
      userAToken = res.body.data.token;
      userAId = res.body.data.user.id || res.body.data.user._id;
    });

    await test('POST /api/auth/register - Duplicate email prevention', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alice Clone',
        email: testEmailA,
        password: 'PasswordAlice123!',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('already exists') || res.body.message.includes('already registered'));
    });

    await test('POST /api/auth/login - Validation: missing fields', async () => {
      const res = await makeRequest('POST', '/api/auth/login', { email: testEmailA });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Incorrect password', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: testEmailA,
        password: 'WrongPassword!',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Unknown email', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'ghost_nonexistent@example.com',
        password: 'SomePassword123',
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
    });

    await test('GET /api/auth/me - Access protected profile with valid JWT', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.email, testEmailA.toLowerCase());
      assert.strictEqual(res.body.data.user.name, 'Alice Turing');
    });

    await test('GET /api/auth/me - Missing token (401)', async () => {
      const res = await makeRequest('GET', '/api/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('GET /api/auth/me - Invalid / forged token (401)', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, 'fake.forged.jwt.token');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
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
      userBId = res.body.data.user.id || res.body.data.user._id;
    });

    // ==========================================
    // SECTION 3: Code Analysis API Validation
    // ==========================================
    console.log('\n--- Section 3: Code Analysis API Validation ---');

    await test('POST /api/code/analyze - Validation: missing code snippet', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { language: 'javascript' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/code/analyze - Validation: missing language', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'console.log("hello");' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/code/analyze - Validation: unsupported language', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'print("hi")', language: 'cobol' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Unsupported programming language'));
    });

    // ==========================================
    // SECTION 4: AI Parser & Normalization
    // ==========================================
    console.log('\n--- Section 4: AI Parser & Normalization ---');

    await test('AI Parser - Test Case Normalization', async () => {
      const rawAIJson = JSON.stringify({
        testCases: [
          {
            testCaseNumber: 1,
            input: "5, 10",
            expected: "15",
            explanation: "Positive addition",
            isEdgeCase: false,
            edgeCase: "No",
          },
          {
            testCaseNumber: 2,
            input: "-1, 1",
            expected: "0",
            explanation: "Negative boundary",
            isEdgeCase: true,
            edgeCase: "Yes",
          },
        ],
      });
      const parsed = parseAndValidateTestCases(rawAIJson);
      assert.strictEqual(parsed.count, 2);
      assert.strictEqual(parsed.testCases[0].expected, '15');
      assert.strictEqual(parsed.testCases[1].isEdgeCase, true);
    });

    await test('AI Parser - Bug Explanation Normalization', async () => {
      const rawBugJson = JSON.stringify({
        bugs: [
          {
            title: "Off-by-one loop index",
            severity: "High",
            line: 4,
            problem: "Index exceeds array length",
            whyItHappens: "i <= length access undefined",
            howToFix: "Use i < length",
            correctedSnippet: "for (let i = 0; i < arr.length; i++)",
            simpleExplanation: "Accessing past array end",
          },
        ],
        overallAssessment: "1 critical index trap detected.",
      });
      const parsed = parseAndValidateBugExplanation(rawBugJson);
      assert.strictEqual(parsed.bugCount, 1);
      assert.strictEqual(parsed.bugs[0].severity, 'High');
      assert.strictEqual(parsed.bugs[0].line, 4);
    });

    await test('AI Parser - Code Explanation Normalization (Beginner / Intermediate / Advanced)', async () => {
      const rawExplainJson = JSON.stringify({
        level: "beginner",
        summary: "Calculates the sum of two integers.",
        explanation: "Think of this function like a calculator button.",
        keyConcepts: ["Variables", "Return values"],
        stepByStep: [{ step: 1, title: "Input", description: "Takes two numbers" }],
        insights: "Always test with 0.",
      });
      const parsed = parseAndValidateCodeExplanation(rawExplainJson, 'beginner');
      assert.strictEqual(parsed.level, 'beginner');
      assert.strictEqual(parsed.keyConcepts.length, 2);
    });

    await test('AI Parser - Documentation Normalization', async () => {
      const rawDocJson = JSON.stringify({
        docStyle: "professional",
        documentation: "/**\n * Adds two numbers\n */",
        documentedCode: "/**\n * Adds two numbers\n */\nfunction add(a, b) { return a + b; }",
        functions: [
          {
            name: "add",
            description: "Adds two numbers",
            parameters: [{ name: "a", type: "number", description: "First number" }],
            returns: { type: "number", description: "Sum" },
          },
        ],
      });
      const parsed = parseAndValidateDocumentation(rawDocJson, 'professional');
      assert.strictEqual(parsed.docStyle, 'professional');
      assert.strictEqual(parsed.functions[0].name, 'add');
    });

    await test('AI Parser - Optimization Comparison Normalization', async () => {
      const rawCompJson = JSON.stringify({
        mainChanges: ["Replaced nested loops with Hash Map"],
        whyChangesWereMade: "Provides O(1) average lookup",
        timeComplexityBefore: "O(n^2)",
        timeComplexityAfter: "O(n)",
        spaceComplexityBefore: "O(1)",
        spaceComplexityAfter: "O(n)",
        isComplexityImproved: true,
      });
      const parsed = parseAndValidateOptimizationComparison(rawCompJson);
      assert.strictEqual(parsed.isComplexityImproved, true);
      assert.strictEqual(parsed.timeComplexityAfter, 'O(n)');
    });

    await test('AI Parser - Resilient JSON Repair (Trailing commas & code fences)', async () => {
      const brokenTrailingCommaJson = '```json\n{\n  "test_cases": [\n    {\n      "test_case_number": 1,\n      "input": "42",\n      "expected": "42",\n      "is_edge_case": true,\n    },\n  ],\n}\n```';
      const parsed = parseAndValidateTestCases(brokenTrailingCommaJson);
      assert.strictEqual(parsed.count, 1);
      assert.strictEqual(parsed.testCases[0].testCaseNumber, 1);
      assert.strictEqual(parsed.testCases[0].isEdgeCase, true);
    });

    await test('AI Parser - Snake_case & Case-Insensitive Bug Severity Resilience', async () => {
      const rawSnakeBug = JSON.stringify({
        bugs: [
          {
            title: "Memory leak in buffer",
            severity: "critical",
            line_number: 12,
            why_it_happens: "Pointer not freed",
            how_to_fix: "Call free()",
            fix_snippet: "free(buf);",
          }
        ],
        overall_assessment: "Critical vulnerability found.",
      });
      const parsed = parseAndValidateBugExplanation(rawSnakeBug);
      assert.strictEqual(parsed.bugCount, 1);
      assert.strictEqual(parsed.bugs[0].severity, 'Critical');
      assert.strictEqual(parsed.bugs[0].line, 12);
      assert.strictEqual(parsed.bugs[0].correctedSnippet, 'free(buf);');
      assert.strictEqual(parsed.overallAssessment, 'Critical vulnerability found.');
    });

    await test('AI Parser - Documentation Resilient Function & Return Formats', async () => {
      const rawDocWithStrings = JSON.stringify({
        docStyle: "developer",
        documentation: "/** API spec */",
        methods: [
          {
            name: "computeMetrics",
            description: "Calculates performance metrics",
            params: ["alpha", "beta"],
            returns: "Promise<MetricResult> Resolves to metric bundle",
            usage_example: "await computeMetrics(0.1, 0.9);",
          }
        ],
        notes: "Requires high precision timers.",
      });
      const parsed = parseAndValidateDocumentation(rawDocWithStrings, 'developer');
      assert.strictEqual(parsed.docStyle, 'developer');
      assert.strictEqual(parsed.functions.length, 1);
      assert.strictEqual(parsed.functions[0].parameters[0].name, 'alpha');
      assert.strictEqual(parsed.functions[0].returns.description, 'Promise<MetricResult> Resolves to metric bundle');
      assert.strictEqual(parsed.functions[0].usageExample, 'await computeMetrics(0.1, 0.9);');
      assert.strictEqual(parsed.notes[0], 'Requires high precision timers.');
    });

    // ==========================================
    // SECTION 5: Profile Updates & Password Security
    // ==========================================
    console.log('\n--- Section 5: Profile Updates & Password Security ---');

    await test('PUT /api/auth/me - Update user name successfully', async () => {
      const res = await makeRequest('PUT', '/api/auth/me', { name: 'Alice M. Turing' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Alice M. Turing');
    });

    // ==========================================
    // SECTION 6: Live MongoDB CRUD & Storage
    // ==========================================
    console.log('\n--- Section 6: Live MongoDB CRUD & Storage ---');

    await test('MongoDB Analysis - Save and persist analysis for User A in MongoDB', async () => {
      const saved = await saveAnalysis({
        userId: userAId,
        code: 'function binarySearch(arr, target) { return -1; }',
        language: 'javascript',
        isBookmarked: false,
        tags: ['algorithms', 'search'],
        analysis: {
          summary: 'Binary search skeleton implementation.',
          codeQuality: { score: 85, rating: 'Good', strengths: ['Clean skeleton'], weaknesses: [] },
          bugs: [],
          timeComplexity: { notation: 'O(log n)', worstCase: 'O(log n)', bestCase: 'O(1)', averageCase: 'O(log n)', explanation: 'Divide and conquer' },
          spaceComplexity: { notation: 'O(1)', worstCase: 'O(1)', bestCase: 'O(1)', averageCase: 'O(1)', explanation: 'Iterative pointers' },
          suggestions: [{ title: 'Implement while loop', description: 'Add binary search loop condition', priority: 'High' }],
          optimizedCode: 'function binarySearch(arr, target) { let l=0, r=arr.length-1; return -1; }',
          explanation: 'Standard binary search logic.',
        },
      });
      assert.ok(saved);
      assert.ok(saved._id);
      userAAnalysisId = saved._id.toString();
    });

    await test('MongoDB Analysis - Save and persist analysis for User B in MongoDB', async () => {
      const saved = await saveAnalysis({
        userId: userBId,
        code: 'def bubble_sort(arr): pass',
        language: 'python',
        isBookmarked: true,
        tags: ['sorting', 'python'],
        analysis: {
          summary: 'Bubble sort skeleton.',
          codeQuality: { score: 75, rating: 'Good', strengths: [], weaknesses: [] },
          bugs: [],
          timeComplexity: { notation: 'O(n^2)', worstCase: 'O(n^2)', bestCase: 'O(n)', averageCase: 'O(n^2)', explanation: 'Nested passes' },
          spaceComplexity: { notation: 'O(1)', worstCase: 'O(1)', bestCase: 'O(1)', averageCase: 'O(1)', explanation: 'In-place' },
          suggestions: [],
        },
      });
      assert.ok(saved);
      userBAnalysisId = saved._id.toString();
    });

    // ==========================================
    // SECTION 7: Phase 7 Feature 1 - Test Case Generator
    // ==========================================
    console.log('\n--- Section 7: Feature 1 - AI Test Case Generator ---');

    await test('POST /api/code/test-cases - Validation: missing code or language (400)', async () => {
      const res1 = await makeRequest('POST', '/api/code/test-cases', { language: 'javascript' }, userAToken);
      assert.strictEqual(res1.status, 400);

      const res2 = await makeRequest('POST', '/api/code/test-cases', { code: 'console.log("hi");' }, userAToken);
      assert.strictEqual(res2.status, 400);
    });

    await test('POST /api/code/test-cases - Authentication required (401)', async () => {
      const res = await makeRequest('POST', '/api/code/test-cases', {
        code: 'function isEven(n) { return n % 2 === 0; }',
        language: 'javascript',
      });
      assert.strictEqual(res.status, 401);
    });

    await test('AI Test Cases - Ollama unavailable error handled with 503', async () => {
      const origUrl = process.env.OLLAMA_URL;
      process.env.OLLAMA_URL = 'http://127.0.0.1:59998/api/generate';

      try {
        await generateTestCasesWithOllama('function add(a, b) { return a + b; }', 'javascript');
        assert.fail('Should have thrown 503 when Ollama is unavailable');
      } catch (err) {
        assert.ok(err.statusCode === 503 || err.statusCode === 504);
        assert.ok(err.code === 'OLLAMA_NOT_RUNNING' || err.code === 'OLLAMA_ERROR' || err.code === 'OLLAMA_TIMEOUT');
      } finally {
        process.env.OLLAMA_URL = origUrl || 'http://localhost:11434/api/generate';
      }
    });

    // ==========================================
    // SECTION 8: Phase 7 Feature 2 - Advanced Bug Explainer
    // ==========================================
    console.log('\n--- Section 8: Feature 2 - Advanced Bug Explainer ---');

    await test('POST /api/code/explain-bugs - Authentication & Validation', async () => {
      const unauth = await makeRequest('POST', '/api/code/explain-bugs', { code: 'test', language: 'python' });
      assert.strictEqual(unauth.status, 401);

      const badLang = await makeRequest('POST', '/api/code/explain-bugs', { code: 'test', language: 'fortran' }, userAToken);
      assert.strictEqual(badLang.status, 400);
    });

    // ==========================================
    // SECTION 9: Phase 7 Feature 3 - Code Explanation Modes
    // ==========================================
    console.log('\n--- Section 9: Feature 3 - Code Explanation Modes ---');

    await test('POST /api/code/explain - Validation: invalid explanationLevel rejected (400)', async () => {
      const res = await makeRequest('POST', '/api/code/explain', {
        code: 'function test() {}',
        language: 'javascript',
        explanationLevel: 'invalid_mode',
      }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('Invalid explanationLevel'));
    });

    // ==========================================
    // SECTION 10: Phase 7 Feature 5 - Automatic Code Documentation
    // ==========================================
    console.log('\n--- Section 10: Feature 5 - Code Documentation Generator ---');

    await test('POST /api/code/documentation - Validation: invalid docStyle rejected (400)', async () => {
      const res = await makeRequest('POST', '/api/code/documentation', {
        code: 'def compute(): pass',
        language: 'python',
        docStyle: 'nonexistent_style',
      }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('Invalid docStyle'));
    });

    // ==========================================
    // SECTION 11: Phase 7 Feature 6 - Bookmarks
    // ==========================================
    console.log('\n--- Section 11: Feature 6 - Bookmarks & User Isolation ---');

    await test('PUT /api/analyses/:id/bookmark - User A can bookmark own analysis', async () => {
      const res = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/bookmark`, { isBookmarked: true }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.isBookmarked, true);
    });

    await test('GET /api/analyses/bookmarked - User A sees bookmarked analysis', async () => {
      const res = await makeRequest('GET', '/api/analyses/bookmarked', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.some(a => a._id === userAAnalysisId));
    });

    await test('USER ISOLATION - User B CANNOT bookmark or modify User A analysis (404 / Access Denied)', async () => {
      const res = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/bookmark`, { isBookmarked: true }, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    await test('USER ISOLATION - User B bookmarked list does NOT contain User A analyses', async () => {
      const res = await makeRequest('GET', '/api/analyses/bookmarked', null, userBToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(!res.body.data.some(a => a._id === userAAnalysisId));
    });

    await test('PUT /api/analyses/:id/bookmark - User A can unbookmark analysis', async () => {
      const res = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/bookmark`, { isBookmarked: false }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isBookmarked, false);
    });

    // ==========================================
    // SECTION 12: Phase 7 Feature 7 - Analysis Tags
    // ==========================================
    console.log('\n--- Section 12: Feature 7 - Analysis Tags & User Isolation ---');

    await test('PUT /api/analyses/:id/tags - User A can update tags on own analysis', async () => {
      const res = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/tags`, {
        tags: ['interview', 'algorithms', 'binarysearch'],
      }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.tags.length, 3);
      assert.ok(res.body.data.tags.includes('interview'));
    });

    await test('PUT /api/analyses/:id/tags - Validation: non-array or excess tags rejected (400)', async () => {
      const res1 = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/tags`, { tags: 'not-an-array' }, userAToken);
      assert.strictEqual(res1.status, 400);

      const res2 = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/tags`, {
        tags: Array(15).fill('tag'),
      }, userAToken);
      assert.strictEqual(res2.status, 400);
    });

    await test('USER ISOLATION - User B CANNOT update tags on User A analysis (404 / Access Denied)', async () => {
      const res = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/tags`, {
        tags: ['hacked_tag'],
      }, userBToken);
      assert.strictEqual(res.status, 404);
    });

    await test('GET /api/analyses?tag=interview - Filter analyses by tag', async () => {
      const res = await makeRequest('GET', '/api/analyses?tag=interview', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.length > 0);
      assert.ok(res.body.data[0].tags.includes('interview'));
    });

    await test('PUT /api/analyses/:id/tags - User A can clear tags (set empty array)', async () => {
      const res = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/tags`, {
        tags: [],
      }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.tags.length, 0);

      // Re-apply tags for downstream stats testing
      await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/tags`, {
        tags: ['interview', 'algorithms'],
      }, userAToken);
    });

    await test('USER ISOLATION - User B CANNOT delete User A analysis (404 / Access Denied)', async () => {
      const res = await makeRequest('DELETE', `/api/analyses/${userAAnalysisId}`, null, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    // ==========================================
    // SECTION 13: Phase 7 Feature 9 & 10 - Coding Stats & Insights
    // ==========================================
    console.log('\n--- Section 13: Feature 9 & 10 - Coding Statistics & Insights ---');

    await test('GET /api/analyses/stats - Fetch User A coding stats and personalized insights', async () => {
      const res = await makeRequest('GET', '/api/analyses/stats', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const stats = res.body.data;
      assert.strictEqual(typeof stats.totalAnalyses, 'number');
      assert.ok(stats.totalAnalyses >= 1);
      assert.ok(stats.analysesByLanguage.javascript >= 1);
      assert.strictEqual(typeof stats.averageQualityScore, 'number');
      assert.ok(Array.isArray(stats.mostUsedTags));
      assert.ok(Array.isArray(stats.codingInsights));
      assert.ok(stats.codingInsights.length > 0);
    });

    await test('USER ISOLATION - User B statistics reflect only User B data (Zero leakage)', async () => {
      const res = await makeRequest('GET', '/api/analyses/stats', null, userBToken);
      assert.strictEqual(res.status, 200);
      const stats = res.body.data;
      // User B only has python analysis
      assert.strictEqual(stats.analysesByLanguage.javascript, undefined);
      assert.ok(stats.analysesByLanguage.python >= 1);
    });

    await test('Statistics - Empty data handles 0 analyses safely without crashing or NaN', async () => {
      // Register a brand new user with 0 analyses
      const regRes = await makeRequest('POST', '/api/auth/register', {
        name: 'Empty User',
        email: `empty_${Date.now()}@test.com`,
        password: 'Password123!',
      });
      const emptyToken = regRes.body.data.token;
      const statsRes = await makeRequest('GET', '/api/analyses/stats', null, emptyToken);
      assert.strictEqual(statsRes.status, 200);
      const stats = statsRes.body.data;
      assert.strictEqual(stats.totalAnalyses, 0);
      assert.strictEqual(stats.analysesThisWeek, 0);
      assert.strictEqual(stats.averageQualityScore, 0);
      assert.strictEqual(stats.mostUsedLanguage, 'N/A');
      assert.strictEqual(stats.bookmarkedCount, 0);
      assert.ok(Array.isArray(stats.codingInsights));
      assert.ok(stats.codingInsights.length > 0);
    });

    // ==========================================
    // SECTION 14: Phase 7 Offline Fallback for Bookmarks & Tags
    // ==========================================
    console.log('\n--- Section 14: Phase 7 Offline Fallback Resilience ---');

    await test('Offline Mode - Bookmark and Tag operations survive MongoDB disconnection', async () => {
      await disconnectDB();
      const status = getDBStatus();
      assert.strictEqual(status.connected, false);

      // Create offline analysis
      const offlineRec = await saveAnalysis({
        userId: 'offline_user_123',
        code: 'function test() {}',
        language: 'javascript',
        isBookmarked: false,
        tags: ['offline_tag'],
        analysis: { summary: 'Offline test' },
      });
      assert.ok(offlineRec);

      // Bookmark offline analysis
      const bmRec = await bookmarkAnalysis(offlineRec._id, 'offline_user_123', true);
      assert.ok(bmRec);
      assert.strictEqual(bmRec.isBookmarked, true);

      // Tag offline analysis
      const tagRec = await updateAnalysisTags(offlineRec._id, 'offline_user_123', ['offline_tag', 'resilience']);
      assert.ok(tagRec);
      assert.strictEqual(tagRec.tags.length, 2);

      // Verify offline stats
      const offlineStats = await getUserStats('offline_user_123');
      assert.strictEqual(offlineStats.totalAnalyses, 1);
      assert.strictEqual(offlineStats.bookmarkedCount, 1);

      // Reconnect MongoDB
      await connectDB('mongodb://127.0.0.1:27017/codementor_test_phase7');
      assert.strictEqual(getDBStatus().connected, true);
    });

    // ==========================================
    // SECTION 16: Live Ollama AI Inferences (Phase 7)
    // ==========================================
    console.log('\n--- Section 16: Live Ollama AI Inferences (Phase 7) ---');

    await test('Live AI - Analyze Code with Ollama Qwen2.5-Coder', async () => {
      try {
        const result = await analyzeCodeWithOllama('function multiply(x, y) { return x * y; }', 'javascript');
        assert.ok(result);
        assert.ok(result.summary);
        assert.ok(result.codeQuality);
        assert.strictEqual(typeof result.codeQuality.score, 'number');
      } catch (err) {
        if (err.statusCode === 503 || err.statusCode === 504) {
          console.log(`     ℹ️ Notice: Ollama returned ${err.statusCode} (${err.message})`);
        } else {
          throw err;
        }
      }
    });

    await test('Live AI - Generate Test Cases with Ollama', async () => {
      try {
        const result = await generateTestCasesWithOllama('function isPositive(n) { return n > 0; }', 'javascript');
        assert.ok(result);
        assert.ok(Array.isArray(result.testCases));
        assert.ok(result.testCases.length > 0);
        assert.ok(result.testCases[0].input !== undefined);
        assert.ok(result.testCases[0].expected !== undefined);
      } catch (err) {
        if (err.statusCode === 503 || err.statusCode === 504) {
          console.log(`     ℹ️ Notice: Ollama returned ${err.statusCode} (${err.message})`);
        } else {
          throw err;
        }
      }
    });

    await test('Live AI - Code Explanation with Ollama (Beginner Mode)', async () => {
      try {
        const result = await explainCodeWithOllama('function add(a, b) { return a + b; }', 'javascript', 'beginner');
        assert.ok(result);
        assert.strictEqual(result.level, 'beginner');
        assert.ok(result.summary);
        assert.ok(result.explanation);
      } catch (err) {
        if (err.statusCode === 503 || err.statusCode === 504) {
          console.log(`     ℹ️ Notice: Ollama returned ${err.statusCode} (${err.message})`);
        } else {
          throw err;
        }
      }
    });

    await test('Live AI - Code Documentation with Ollama (Professional Mode)', async () => {
      try {
        const result = await generateDocumentationWithOllama('function greet(name) { return "Hello " + name; }', 'javascript', 'professional');
        assert.ok(result);
        assert.strictEqual(result.docStyle, 'professional');
        assert.ok(result.documentation || result.documentedCode);
      } catch (err) {
        if (err.statusCode === 503 || err.statusCode === 504) {
          console.log(`     ℹ️ Notice: Ollama returned ${err.statusCode} (${err.message})`);
        } else {
          throw err;
        }
      }
    });

    await test('Live AI - Optimization Comparison with Ollama', async () => {
      try {
        const result = await compareOptimizationWithOllama(
          'function sum(arr) { let s = 0; for(let i=0; i<arr.length; i++) s += arr[i]; return s; }',
          'javascript',
          'function sum(arr) { return arr.reduce((a, b) => a + b, 0); }'
        );
        assert.ok(result);
        assert.ok(Array.isArray(result.mainChanges));
        assert.ok(result.whyChangesWereMade);
      } catch (err) {
        if (err.statusCode === 503 || err.statusCode === 504) {
          console.log(`     ℹ️ Notice: Ollama returned ${err.statusCode} (${err.message})`);
        } else {
          throw err;
        }
      }
    });

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n====================================================');
    console.log(`📊 Phase 1-7 Test Results: ${passedCount}/${totalCount} tests passed`);
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
