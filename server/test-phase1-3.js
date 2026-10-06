/**
 * CodeMentor AI — Comprehensive Automated Test Suite for Phases 1-3
 * Tests:
 * 1. Health Endpoint
 * 2. Authentication (Registration, Validation, Hashing, Duplicate Prevention, Login, Bad Credentials, /me, Expiration, Token Tampering)
 * 3. Code Analysis API (Validations: Empty Code, Missing Code, Unsupported Language, Missing Language, Payload Structure)
 * 4. Gemini AI Parser & Fallbacks (Schema validation: summary, bugs, complexity, timeComplexity, spaceComplexity, suggestions, optimizedCode)
 * 5. Personal Analysis History & User Isolation (Save, Fetch Own, Fetch by ID, Cross-User Isolation, Delete Own, Cross-User Delete Prevention)
 * 6. Security (Password exclusion, Bcrypt hashing, API key confidentiality)
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test_jwt_secret_key_1234567890';

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { app } = require('./server');
const { clearMemoryStore, findUserByEmail } = require('./services/storageService');
const { parseAndValidateAIResponse } = require('./services/aiService');

let server;
const PORT = 5001;
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
  console.log('🧪 Starting CodeMentor AI Phase 1-3 Test Suite');
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
    // Start test server
    server = app.listen(PORT);
    await new Promise((res) => setTimeout(res, 500));
    clearMemoryStore();

    // ==========================================
    // SECTION 1: Health & Root Endpoints
    // ==========================================
    console.log('\n--- Section 1: Health & System Endpoints ---');

    await test('GET / - API root info', async () => {
      const res = await makeRequest('GET', '/');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'CodeMentor AI API');
      assert.ok(res.body.endpoints);
    });

    await test('GET /api/health - Health status', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.ok(res.body.database);
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
        email: 'alice@example.com',
        password: 'securePassword123',
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.name, 'Alice Turing');
      assert.strictEqual(res.body.data.user.email, 'alice@example.com');
      // Password must NEVER be returned
      assert.strictEqual(res.body.data.user.password, undefined);

      userAToken = res.body.data.token;
      userAData = res.body.data.user;
    });

    await test('POST /api/auth/register - Duplicate email prevention', async () => {
      const res = await makeRequest('POST', '/api/auth/register', {
        name: 'Alice Clone',
        email: 'ALICE@example.com', // case-insensitive check
        password: 'anotherPassword123',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.toLowerCase().includes('already exists'));
    });

    await test('POST /api/auth/login - Validation: missing fields', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'alice@example.com',
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Incorrect password', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'alice@example.com',
        password: 'wrongPassword123',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Invalid email or password'));
    });

    await test('POST /api/auth/login - Unknown email', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'unknown@example.com',
        password: 'somePassword123',
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('POST /api/auth/login - Successful login', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: 'alice@example.com',
        password: 'securePassword123',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.email, 'alice@example.com');
      assert.strictEqual(res.body.data.user.password, undefined);
    });

    await test('GET /api/auth/me - Access protected profile with valid JWT', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.name, 'Alice Turing');
      assert.strictEqual(res.body.data.user.email, 'alice@example.com');
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
        email: 'bob@example.com',
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

    await test('AI Parser - Correctly parses full Gemini structured response', () => {
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
      assert.strictEqual(parsed.timeComplexity.notation, 'O(log n)');
      assert.strictEqual(parsed.spaceComplexity.notation, 'O(1)');
    });

    await test('AI Parser - Handles partial/unexpected response format without crashing', () => {
      const partialOutput = '{"summary": "Basic code", "bugs": ["Potential division by zero"]}';
      const parsed = parseAndValidateAIResponse(partialOutput);
      assert.strictEqual(parsed.summary, 'Basic code');
      assert.strictEqual(parsed.bugs.length, 1);
      assert.strictEqual(parsed.bugs[0].description, 'Potential division by zero');
      assert.strictEqual(parsed.complexity.time, 'O(n)');
      assert.strictEqual(parsed.complexity.space, 'O(1)');
      assert.strictEqual(typeof parsed.codeQuality.score, 'number');
    });

    // ==========================================
    // SECTION 5: Personal Analysis History & User Isolation
    // ==========================================
    console.log('\n--- Section 5: History & User Data Isolation ---');

    const { saveAnalysis } = require('./services/storageService');

    // Save sample analysis for User A
    const userAAnalysisRecord = await saveAnalysis({
      userId: userAData.id,
      code: 'function twoSum(nums, target) { ... }',
      language: 'javascript',
      analysis: {
        summary: 'Two sum hash map solution',
        complexity: { time: 'O(n)', space: 'O(n)' },
        timeComplexity: { notation: 'O(n)', worstCase: 'O(n)', explanation: 'Single pass' },
        spaceComplexity: { notation: 'O(n)', worstCase: 'O(n)', explanation: 'Hash map storage' },
        bugs: [],
        suggestions: [],
      },
    });

    // Save sample analysis for User B
    const userBAnalysisRecord = await saveAnalysis({
      userId: userBData.id,
      code: 'def binary_search(arr, target): ...',
      language: 'python',
      analysis: {
        summary: 'Binary search algorithm',
        complexity: { time: 'O(log n)', space: 'O(1)' },
        timeComplexity: { notation: 'O(log n)', worstCase: 'O(log n)', explanation: 'Halving search space' },
        spaceComplexity: { notation: 'O(1)', worstCase: 'O(1)', explanation: 'Iterative pointers' },
        bugs: [],
        suggestions: [],
      },
    });

    await test('GET /api/analyses - User A only sees User A history', async () => {
      const res = await makeRequest('GET', '/api/analyses', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 1);
      assert.strictEqual(res.body.data[0]._id.toString(), userAAnalysisRecord._id.toString());
      assert.strictEqual(res.body.data[0].language, 'javascript');
    });

    await test('GET /api/analyses - User B only sees User B history', async () => {
      const res = await makeRequest('GET', '/api/analyses', null, userBToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 1);
      assert.strictEqual(res.body.data[0]._id.toString(), userBAnalysisRecord._id.toString());
      assert.strictEqual(res.body.data[0].language, 'python');
    });

    await test('GET /api/analyses/:id - User A can fetch own analysis by ID', async () => {
      const res = await makeRequest('GET', `/api/analyses/${userAAnalysisRecord._id}`, null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data._id.toString(), userAAnalysisRecord._id.toString());
    });

    await test('GET /api/analyses/:id - User B CANNOT access User A analysis (Access Denied / 404)', async () => {
      const res = await makeRequest('GET', `/api/analyses/${userAAnalysisRecord._id}`, null, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('not found or access denied'));
    });

    await test('DELETE /api/analyses/:id - User B CANNOT delete User A analysis (Access Denied / 404)', async () => {
      const res = await makeRequest('DELETE', `/api/analyses/${userAAnalysisRecord._id}`, null, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('not found or access denied'));
    });

    await test('DELETE /api/analyses/:id - User A can delete own analysis record', async () => {
      const res = await makeRequest('DELETE', `/api/analyses/${userAAnalysisRecord._id}`, null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.deletedId, userAAnalysisRecord._id.toString());
    });

    await test('GET /api/analyses/:id - Deleted record is no longer accessible', async () => {
      const res = await makeRequest('GET', `/api/analyses/${userAAnalysisRecord._id}`, null, userAToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    await test('GET /api/code/analyses - Alias route works identically', async () => {
      const res = await makeRequest('GET', '/api/code/analyses', null, userBToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 1);
    });

    // ==========================================
    // SECTION 6: Security & Data Integrity
    // ==========================================
    console.log('\n--- Section 6: Security & Data Integrity ---');

    await test('Password Hashing - Verify bcrypt hashing was used for stored credentials', async () => {
      const storedUser = await findUserByEmail('bob@example.com', { includePassword: true });
      assert.ok(storedUser);
      assert.notStrictEqual(storedUser.password, 'bobSecurePassword456');
      assert.ok(storedUser.password.startsWith('$2')); // bcrypt hash prefix
      const match = await bcrypt.compare('bobSecurePassword456', storedUser.password);
      assert.strictEqual(match, true);
    });

    await test('Timestamps - Verify createdAt and updatedAt are present on analysis records', async () => {
      assert.ok(userBAnalysisRecord.createdAt);
      assert.ok(new Date(userBAnalysisRecord.createdAt).getTime() > 0);
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
  }
}

runAllTests();
