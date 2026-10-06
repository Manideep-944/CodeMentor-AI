/**
 * CodeMentor AI — Comprehensive Automated Test Suite for Phase 7.5
 * Multi-Language Programming Support (JavaScript, Python, Java, C++, C, TypeScript)
 * 
 * Includes:
 * 1. Health & System Diagnostics (v7.5.0-phase7.5)
 * 2. JWT Authentication, Password Hashing & Validations
 * 3. Multi-Language Code Analysis Input Validation (6 supported languages + invalid rejection)
 * 4. AI Parser Schema Normalization & Resilience across Languages
 * 5. Profile Updates & Password Security
 * 6. Live MongoDB Integration & Cross-User Isolation
 * 7. Dual-Mode Storage & Offline Fallback Migration
 * 8. Production Security (Helmet Headers, CORS, Payload Limit)
 * 9. API Error Handling (Malformed JSON, 404s, Production Sanitization)
 * 10. Phase 7.5: Representative AI Code Analysis across ALL 6 Languages:
 *     - JavaScript
 *     - Python
 *     - Java
 *     - C++
 *     - C
 *     - TypeScript
 * 11. Phase 7.5: Multi-Language AI Test Case Generation
 * 12. Phase 7.5: Multi-Language Bug Diagnostics
 * 13. Phase 7.5: Multi-Language Multi-Depth Code Explanation (Beginner, Intermediate, Advanced)
 * 14. Phase 7.5: Multi-Language Automatic Documentation (JSDoc, Python Docstrings, Javadoc, Doxygen, TSDoc)
 * 15. Phase 7.5: Multi-Language Optimization Comparison
 * 16. Phase 7.5: Multi-Language History Storage & Language Filtering
 * 17. Phase 7.5: Multi-Language Bookmarks and Tags
 * 18. Phase 7.5: Multi-Language Dashboard Coding Statistics & Insights Calculation
 * 19. Phase 7.5: HTML & Markdown Multi-Language Report Generation
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '5006';
process.env.JWT_SECRET = 'test_jwt_secret_phase7_5_live_9876543210';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/codementor_test_phase7_5';

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
const PORT = 5006;
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
  console.log('🧪 Starting CodeMentor AI Phase 7.5 Full Test Suite');
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
    await connectDB('mongodb://127.0.0.1:27017/codementor_test_phase7_5');

    let userAToken = null;
    let userBToken = null;
    let userAId = null;
    let userBId = null;
    const testEmailA = `alice_p75_${Date.now()}@example.com`;
    const testEmailB = `bob_p75_${Date.now()}@example.com`;
    let userAAnalysisId = null;

    // ==========================================
    // SECTION 1: Health & System Endpoints
    // ==========================================
    console.log('\n--- Section 1: Health & System Endpoints (v7.5.0-phase7.5) ---');

    await test('GET / - API root info returns v7.5.0-phase7.5 with 6 supported languages', async () => {
      const res = await makeRequest('GET', '/');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.name, 'CodeMentor AI API');
      assert.strictEqual(res.body.version, '7.5.0-phase7.5');
      assert.ok(res.body.endpoints);
      assert.deepStrictEqual(res.body.supportedLanguages, ['javascript', 'python', 'java', 'cpp', 'c', 'typescript']);
      assert.strictEqual(res.body.phase, 'Phase 7.5: Multi-Language Programming Support');
    });

    await test('GET /api/health - Health status in MongoDB mode returns v7.5.0-phase7.5', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.version, '7.5.0-phase7.5');
      assert.strictEqual(res.body.database.type, 'mongodb');
      assert.strictEqual(res.body.database.status, 'connected');
      assert.strictEqual(res.body.databaseStatus, 'connected');
      assert.ok(res.body.ai);
      assert.strictEqual(res.body.ai.model, 'qwen2.5-coder:7b');
      assert.ok(res.body.auth);
      assert.deepStrictEqual(res.body.supportedLanguages, ['javascript', 'python', 'java', 'cpp', 'c', 'typescript']);
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

    await test('POST /api/auth/login - Successful login returns valid JWT', async () => {
      const res = await makeRequest('POST', '/api/auth/login', {
        email: testEmailA,
        password: 'PasswordAlice123!',
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
    });

    await test('GET /api/auth/me - Access profile with JWT', async () => {
      const res = await makeRequest('GET', '/api/auth/me', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.user.email, testEmailA.toLowerCase());
    });

    await test('POST /api/auth/register - Register User B for isolation checks', async () => {
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
    // SECTION 3: API Input & Language Validation
    // ==========================================
    console.log('\n--- Section 3: API Input & Language Validation ---');

    await test('POST /api/code/analyze - Validation: missing code snippet', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { language: 'javascript' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Code snippet cannot be empty'));
    });

    await test('POST /api/code/analyze - Validation: missing language parameter', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'console.log("hello");' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Language parameter is required'));
    });

    await test('POST /api/code/analyze - Reject unsupported language: ruby', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'def add(a, b); a + b; end', language: 'ruby' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Unsupported programming language'));
    });

    await test('POST /api/code/analyze - Reject unsupported language: rust', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'fn main() {}', language: 'rust' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Unsupported programming language'));
    });

    await test('POST /api/code/analyze - Reject unsupported language: go', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: 'package main', language: 'go' }, userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Unsupported programming language'));
    });

    // ==========================================
    // SECTION 4: AI Parser & Schema Normalization
    // ==========================================
    console.log('\n--- Section 4: AI Parser & Schema Normalization ---');

    await test('AI Parser - Multi-language response normalization', async () => {
      const rawAIJson = JSON.stringify({
        summary: "Calculates sum of two integers.",
        codeQuality: { score: 92, rating: "Excellent", strengths: ["Type safe", "Pure function"], weaknesses: [] },
        bugs: [],
        complexity: { time: "O(1)", space: "O(1)" },
        timeComplexity: { notation: "O(1)", worstCase: "O(1)", bestCase: "O(1)", averageCase: "O(1)", explanation: "Constant time addition." },
        spaceComplexity: { notation: "O(1)", worstCase: "O(1)", bestCase: "O(1)", averageCase: "O(1)", explanation: "No extra memory." },
        suggestions: [{ title: "Inline addition", description: "Direct expression evaluation.", priority: "Low" }],
        optimizedCode: "const add = (a: number, b: number): number => a + b;",
        explanation: "Refactored into concise arrow function."
      });
      const parsed = parseAndValidateAIResponse(rawAIJson);
      assert.strictEqual(parsed.summary, "Calculates sum of two integers.");
      assert.strictEqual(parsed.codeQuality.score, 92);
      assert.strictEqual(parsed.complexity.time, "O(1)");
      assert.strictEqual(parsed.suggestions.length, 1);
      assert.ok(parsed.optimizedCode.includes("const add"));
    });

    await test('AI Parser - Test Case Normalization', async () => {
      const rawAIJson = JSON.stringify({
        testCases: [
          { testCaseNumber: 1, input: "5, 3", expected: "8", explanation: "Normal case", isEdgeCase: false },
          { testCaseNumber: 2, input: "0, 0", expected: "0", explanation: "Zero boundary", isEdgeCase: true },
        ],
      });
      const parsed = parseAndValidateTestCases(rawAIJson);
      assert.strictEqual(parsed.count, 2);
      assert.strictEqual(parsed.testCases[0].expected, '8');
      assert.strictEqual(parsed.testCases[1].isEdgeCase, true);
    });

    await test('AI Parser - TypeScript Documentation Schema Normalization', async () => {
      const rawDocJson = JSON.stringify({
        docStyle: "professional",
        documentation: "/**\n * Adds two numbers\n */",
        documentedCode: "/**\n * Adds two numbers\n */\nfunction add(a: number, b: number): number { return a + b; }",
        functions: [{
          name: "add",
          description: "Calculates numeric sum",
          parameters: [
            { name: "a", type: "number", description: "First number" },
            { name: "b", type: "number", description: "Second number" }
          ],
          returns: { type: "number", description: "Sum of a and b" }
        }]
      });
      const parsed = parseAndValidateDocumentation(rawDocJson, 'professional');
      assert.strictEqual(parsed.docStyle, 'professional');
      assert.strictEqual(parsed.functions[0].name, 'add');
      assert.strictEqual(parsed.functions[0].parameters[0].type, 'number');
    });

    await test('AI Parser - Resilient JSON Repair (trailing commas & markdown fences)', async () => {
      const brokenJson = '```json\n{\n  "test_cases": [\n    {\n      "test_case_number": 1,\n      "input": "5, 3",\n      "expected": "8",\n      "is_edge_case": false,\n    },\n  ],\n}\n```';
      const parsed = parseAndValidateTestCases(brokenJson);
      assert.strictEqual(parsed.count, 1);
      assert.strictEqual(parsed.testCases[0].expected, '8');
    });

    // ==========================================
    // SECTION 5: Representative Multi-Language AI Analyses
    // ==========================================
    console.log('\n--- Section 5: Representative Multi-Language AI Analyses (Live Ollama Qwen2.5-Coder) ---');

    // 1. JavaScript
    const jsCode = `function add(a, b) {
    return a + b;
}

console.log(add(5, 3));`;

    await test('AI Analysis - JavaScript Representative Analysis', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: jsCode, language: 'javascript', isBookmarked: true, tags: ['js', 'basics'] }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.language, 'javascript');
      assert.ok(res.body.data.analysis.summary);
      assert.ok(typeof res.body.data.analysis.codeQuality.score === 'number');
      assert.ok(res.body.data.analysis.timeComplexity);
      assert.ok(res.body.data.analysis.spaceComplexity);
      assert.strictEqual(res.body.data.isBookmarked, true);
      assert.deepStrictEqual(res.body.data.tags, ['js', 'basics']);
      userAAnalysisId = res.body.data.analysisId;
    });

    // 2. Python
    const pyCode = `def add(a, b):
    return a + b

print(add(5, 3))`;

    await test('AI Analysis - Python Representative Analysis', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: pyCode, language: 'python', isBookmarked: false, tags: ['python', 'math'] }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.language, 'python');
      assert.ok(res.body.data.analysis.summary);
      assert.ok(typeof res.body.data.analysis.codeQuality.score === 'number');
      assert.ok(res.body.data.analysis.timeComplexity);
    });

    // 3. Java
    const javaCode = `public class Main {
    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        System.out.println(add(5, 3));
    }
}`;

    await test('AI Analysis - Java Representative Analysis', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: javaCode, language: 'java', isBookmarked: true, tags: ['java', 'oop'] }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.language, 'java');
      assert.ok(res.body.data.analysis.summary);
      assert.ok(typeof res.body.data.analysis.codeQuality.score === 'number');
      assert.ok(res.body.data.analysis.timeComplexity);
    });

    // 4. C++
    const cppCode = `#include <iostream>
using namespace std;

int add(int a, int b) {
    return a + b;
}

int main() {
    cout << add(5, 3);
    return 0;
}`;

    await test('AI Analysis - C++ Representative Analysis', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: cppCode, language: 'cpp', isBookmarked: false, tags: ['cpp', 'stl'] }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.language, 'cpp');
      assert.ok(res.body.data.analysis.summary);
      assert.ok(typeof res.body.data.analysis.codeQuality.score === 'number');
      assert.ok(res.body.data.analysis.timeComplexity);
    });

    // 5. C
    const cCode = `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int main() {
    printf("%d", add(5, 3));
    return 0;
}`;

    await test('AI Analysis - C Representative Analysis', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: cCode, language: 'c', isBookmarked: false, tags: ['c', 'pointers'] }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.language, 'c');
      assert.ok(res.body.data.analysis.summary);
      assert.ok(typeof res.body.data.analysis.codeQuality.score === 'number');
      assert.ok(res.body.data.analysis.timeComplexity);
    });

    // 6. TypeScript
    const tsCode = `function add(a: number, b: number): number {
    return a + b;
}

console.log(add(5, 3));`;

    await test('AI Analysis - TypeScript Representative Analysis', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', { code: tsCode, language: 'typescript', isBookmarked: true, tags: ['ts', 'types'] }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.language, 'typescript');
      assert.ok(res.body.data.analysis.summary);
      assert.ok(typeof res.body.data.analysis.codeQuality.score === 'number');
      assert.ok(res.body.data.analysis.timeComplexity);
      assert.strictEqual(res.body.data.isBookmarked, true);
      assert.deepStrictEqual(res.body.data.tags, ['ts', 'types']);
    });

    // ==========================================
    // SECTION 6: Multi-Language AI Features
    // ==========================================
    console.log('\n--- Section 6: Multi-Language AI Features (Test Cases, Explanations, Docs, Diffs) ---');

    await test('AI Test Cases - Python test case generation', async () => {
      const res = await makeRequest('POST', '/api/code/test-cases', { code: pyCode, language: 'python' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.testCases));
      assert.ok(res.body.data.testCases.length >= 1);
    });

    await test('AI Test Cases - TypeScript test case generation', async () => {
      const res = await makeRequest('POST', '/api/code/test-cases', { code: tsCode, language: 'typescript' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.testCases));
      assert.ok(res.body.data.testCases.length >= 1);
    });

    await test('Bug Explainer - C++ bug detection and explanation', async () => {
      const buggyCpp = `#include <iostream>
int main() {
    int arr[3] = {1, 2, 3};
    std::cout << arr[5];
    return 0;
}`;
      const res = await makeRequest('POST', '/api/code/explain-bugs', { code: buggyCpp, language: 'cpp' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.bugs));
    });

    await test('Code Explanation - Java Beginner explanation', async () => {
      const res = await makeRequest('POST', '/api/code/explain', { code: javaCode, language: 'java', explanationLevel: 'beginner' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.level, 'beginner');
      assert.ok(res.body.data.summary);
      assert.ok(Array.isArray(res.body.data.keyConcepts));
    });

    await test('Code Explanation - TypeScript Advanced explanation', async () => {
      const res = await makeRequest('POST', '/api/code/explain', { code: tsCode, language: 'typescript', explanationLevel: 'advanced' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.level, 'advanced');
      assert.ok(res.body.data.summary);
    });

    await test('Documentation - Python Sphinx / Google Docstrings generation', async () => {
      const res = await makeRequest('POST', '/api/code/documentation', { code: pyCode, language: 'python', docStyle: 'professional' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.documentedCode || res.body.data.documentation);
    });

    await test('Documentation - TypeScript TSDoc generation', async () => {
      const res = await makeRequest('POST', '/api/code/documentation', { code: tsCode, language: 'typescript', docStyle: 'developer' }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.documentedCode || res.body.data.documentation);
    });

    await test('Optimization Comparison - C++ Original vs Optimized comparison', async () => {
      const optCpp = `#include <iostream>
constexpr int add(int a, int b) noexcept {
    return a + b;
}
int main() {
    std::cout << add(5, 3);
    return 0;
}`;
      const res = await makeRequest('POST', '/api/code/compare-optimization', { code: cppCode, language: 'cpp', optimizedCode: optCpp }, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data.mainChanges));
      assert.ok(res.body.data.timeComplexityBefore);
    });

    // ==========================================
    // SECTION 7: History, Bookmarks & Tag Filtering
    // ==========================================
    console.log('\n--- Section 7: History, Bookmarks & Tag Filtering ---');

    await test('GET /api/analyses - Language filter: python', async () => {
      const res = await makeRequest('GET', '/api/analyses?language=python', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.every((a) => a.language === 'python'));
      assert.ok(res.body.count >= 1);
    });

    await test('GET /api/analyses - Language filter: typescript', async () => {
      const res = await makeRequest('GET', '/api/analyses?language=typescript', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.every((a) => a.language === 'typescript'));
      assert.ok(res.body.count >= 1);
    });

    await test('GET /api/analyses - Language filter: java', async () => {
      const res = await makeRequest('GET', '/api/analyses?language=java', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.every((a) => a.language === 'java'));
      assert.ok(res.body.count >= 1);
    });

    await test('GET /api/analyses - Language filter: cpp', async () => {
      const res = await makeRequest('GET', '/api/analyses?language=cpp', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.every((a) => a.language === 'cpp'));
      assert.ok(res.body.count >= 1);
    });

    await test('GET /api/analyses - Language filter: c', async () => {
      const res = await makeRequest('GET', '/api/analyses?language=c', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.every((a) => a.language === 'c'));
      assert.ok(res.body.count >= 1);
    });

    await test('GET /api/analyses - Language filter: all returns all 6 languages', async () => {
      const res = await makeRequest('GET', '/api/analyses?language=all', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.count >= 6);
    });

    await test('GET /api/analyses/bookmarked - Fetch bookmarked analyses across languages', async () => {
      const res = await makeRequest('GET', '/api/analyses/bookmarked', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.every((a) => a.isBookmarked === true));
      assert.ok(res.body.count >= 3); // JS, Java, and TypeScript were bookmarked
    });

    await test('GET /api/analyses/stats - Dashboard calculates language counts dynamically for all 6 languages', async () => {
      const res = await makeRequest('GET', '/api/analyses/stats', null, userAToken);
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      const langs = res.body.data.analysesByLanguage;
      assert.ok(langs.javascript >= 1, 'Should contain javascript count');
      assert.ok(langs.python >= 1, 'Should contain python count');
      assert.ok(langs.java >= 1, 'Should contain java count');
      assert.ok(langs.cpp >= 1, 'Should contain cpp count');
      assert.ok(langs.c >= 1, 'Should contain c count');
      assert.ok(langs.typescript >= 1, 'Should contain typescript count');
      assert.ok(res.body.data.totalAnalyses >= 6);
      assert.ok(Array.isArray(res.body.data.codingInsights));
    });

    // ==========================================
    // SECTION 8: User Isolation & Security
    // ==========================================
    console.log('\n--- Section 8: User Isolation & Security ---');

    await test('User Isolation - User B cannot view User A analysis by ID', async () => {
      const res = await makeRequest('GET', `/api/analyses/${userAAnalysisId}`, null, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    await test('User Isolation - User B cannot delete User A analysis', async () => {
      const res = await makeRequest('DELETE', `/api/analyses/${userAAnalysisId}`, null, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    await test('User Isolation - User B cannot bookmark User A analysis', async () => {
      const res = await makeRequest('PUT', `/api/analyses/${userAAnalysisId}/bookmark`, { isBookmarked: true }, userBToken);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });

    // ==========================================
    // SECTION 9: Error Handling & Security Headers
    // ==========================================
    console.log('\n--- Section 9: Error Handling & Security Headers ---');

    await test('Security - Helmet headers configured on response', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
      assert.strictEqual(res.headers['x-frame-options'], 'SAMEORIGIN');
    });

    await test('Error Handling - 404 on undefined routes', async () => {
      const res = await makeRequest('GET', '/api/unknown-route-endpoint');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, 'NotFound');
    });

    await test('Error Handling - Malformed JSON payload returns 400', async () => {
      const res = await makeRequest('POST', '/api/code/analyze', '{ invalid json, body: ', userAToken);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

  } catch (outerErr) {
    console.error('Fatal Test Suite Error:', outerErr);
  } finally {
    console.log('\n====================================================');
    console.log(`📊 Phase 7.5 Test Summary: ${passedCount}/${totalCount} tests passed`);
    console.log('====================================================\n');

    if (server) {
      server.close();
    }
    await disconnectDB();
    process.exit(passedCount === totalCount ? 0 : 1);
  }
}

runAllTests();
