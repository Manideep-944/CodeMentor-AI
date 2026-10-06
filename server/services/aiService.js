/* =========================================
   CodeMentor AI - Ollama AI Service (Phase 7)
   Local AI: Qwen2.5-Coder 7B
   ========================================= */

const getOllamaURL = () => process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const getOllamaModel = () => process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

/* =========================================
   GENERIC OLLAMA EXECUTION HELPER
   ========================================= */

const executeOllamaRequest = async (prompt, { numPredict = 600, temperature = 0.1 } = {}) => {
  const ollamaUrl = getOllamaURL();
  const ollamaModel = getOllamaModel();

  try {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Ollama] Executing request with model: ${ollamaModel}...`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 300000); // 5-minute timeout

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        format: 'json',
        options: {
          temperature,
          num_predict: numPredict,
          num_ctx: 2048,
          num_thread: 8,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Ollama Error Response]', errorText);
      const error = new Error(`AI service responded with status ${response.status}`);
      error.statusCode = 503;
      error.code = 'OLLAMA_ERROR';
      throw error;
    }

    const data = await response.json();

    if (!data.response) {
      const error = new Error('AI service returned an empty response.');
      error.statusCode = 503;
      error.code = 'OLLAMA_EMPTY_RESPONSE';
      throw error;
    }

    return data.response;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[Ollama Service Error]', error.message || error);
    }

    if (error.name === 'AbortError') {
      const timeoutError = new Error('AI service timed out while processing request. Please try again with a shorter code snippet or allow more time.');
      timeoutError.statusCode = 504;
      timeoutError.code = 'OLLAMA_TIMEOUT';
      throw timeoutError;
    }

    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      const connectionError = new Error('AI service is currently unavailable. Please make sure Ollama is running.');
      connectionError.statusCode = 503;
      connectionError.code = 'OLLAMA_NOT_RUNNING';
      throw connectionError;
    }

    if (error.statusCode) {
      throw error;
    }

    const genericErr = new Error(error.message || 'AI processing failed. Please try again.');
    genericErr.statusCode = 500;
    genericErr.code = 'AI_ERROR';
    throw genericErr;
  }
};

/* =========================================
   JSON CLEANER / EXTRACTOR
   ========================================= */

const extractAndParseJSON = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from AI service');
  }

  let cleaned = rawText.trim();

  // Remove Markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  // Check if it's an array or object
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = cleaned.lastIndexOf(']');
  }

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.slice(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    // Attempt repair for common LLM JSON glitches: trailing commas before } or ] and non-printable chars
    try {
      const repaired = cleaned
        .replace(/,\s*([\]}])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => (c === '\n' || c === '\r' || c === '\t' ? c : ''));
      return JSON.parse(repaired);
    } catch (secondError) {
      console.error('[Ollama] Invalid JSON response structure:', cleaned);
      throw new Error('AI service returned an invalid JSON response structure.');
    }
  }
};

/* =========================================
   1. CODE ANALYSIS & REVIEW
   ========================================= */

const buildSystemInstruction = (language) => {
  const langName = language.toUpperCase();
  return `You are CodeMentor AI, an expert programming mentor and algorithm professor.
Language: ${langName}
Analyze the submitted ${langName} code and return ONLY valid JSON matching this schema:
{
  "summary": "Concise 1-2 sentence overview of what the code does",
  "codeQuality": {
    "score": 85,
    "rating": "Good",
    "strengths": ["Clear naming", "Good modularity"],
    "weaknesses": []
  },
  "bugs": [
    {
      "severity": "Critical | High | Medium | Low | Informational",
      "line": 1,
      "title": "Bug title",
      "description": "Why this is a bug",
      "suggestion": "How to fix it"
    }
  ],
  "complexity": {
    "time": "O(n)",
    "space": "O(1)"
  },
  "timeComplexity": {
    "notation": "O(n)",
    "worstCase": "O(n)",
    "bestCase": "O(1)",
    "averageCase": "O(n)",
    "explanation": "Concise time complexity explanation"
  },
  "spaceComplexity": {
    "notation": "O(1)",
    "worstCase": "O(1)",
    "bestCase": "O(1)",
    "averageCase": "O(1)",
    "explanation": "Concise space complexity explanation"
  },
  "suggestions": [
    {
      "title": "Suggestion title",
      "description": "Concise improvement hint",
      "priority": "High | Medium | Low"
    }
  ],
  "optimizedCode": "// Concise refactored/improved ${langName} code",
  "explanation": "Concise summary of optimizations made"
}
Rules:
1. Return ONLY the JSON object. Do not wrap with text.
2. Be concise and educational. Keep descriptions under 25 words each.
3. If no bugs exist, return an empty array for bugs.
4. The optimized code MUST remain in the exact same programming language (${langName}) as the original code. Do NOT convert code from one language to another.`;
};

const parseAndValidateAIResponse = (rawText) => {
  const parsed = extractAndParseJSON(rawText);

  const parseComplexityObject = (compObj, fallbackNotation) => {
    if (typeof compObj === 'string') {
      return {
        notation: compObj,
        worstCase: compObj,
        bestCase: 'O(1)',
        averageCase: compObj,
        explanation: 'Complexity derived from algorithm operations.',
      };
    }
    if (!compObj || typeof compObj !== 'object') {
      return {
        notation: fallbackNotation,
        worstCase: fallbackNotation,
        bestCase: 'O(1)',
        averageCase: fallbackNotation,
        explanation: 'Complexity calculated from loop and operation analysis.',
      };
    }
    const notation = compObj.notation || compObj.worstCase || fallbackNotation;
    return {
      notation,
      worstCase: compObj.worstCase || notation,
      bestCase: compObj.bestCase || 'O(1)',
      averageCase: compObj.averageCase || notation,
      explanation: compObj.explanation || 'Complexity calculated from loop and operation analysis.',
    };
  };

  const simpleTime =
    (parsed.complexity && parsed.complexity.time) ||
    (parsed.timeComplexity && (parsed.timeComplexity.notation || parsed.timeComplexity.worstCase)) ||
    (typeof parsed.timeComplexity === 'string' ? parsed.timeComplexity : 'O(n)');

  const simpleSpace =
    (parsed.complexity && parsed.complexity.space) ||
    (parsed.spaceComplexity && (parsed.spaceComplexity.notation || parsed.spaceComplexity.worstCase)) ||
    (typeof parsed.spaceComplexity === 'string' ? parsed.spaceComplexity : 'O(1)');

  const timeComplexity = parseComplexityObject(parsed.timeComplexity || simpleTime, simpleTime);
  const spaceComplexity = parseComplexityObject(parsed.spaceComplexity || simpleSpace, simpleSpace);

  // Normalize bugs list
  let bugs = [];
  if (Array.isArray(parsed.bugs)) {
    bugs = parsed.bugs.map((bug, index) => {
      if (typeof bug === 'string') {
        return {
          severity: 'Medium',
          line: 0,
          location: '',
          title: `Issue #${index + 1}`,
          description: bug,
          problem: bug,
          whyItHappens: '',
          howToFix: 'Review and address this issue.',
          suggestion: 'Review and address this issue.',
          correctedSnippet: '',
          simpleExplanation: bug,
        };
      }
      return {
        severity: bug.severity || 'Medium',
        line: typeof bug.line === 'number' ? bug.line : 0,
        location: bug.location || (bug.line > 0 ? `Line ${bug.line}` : ''),
        title: bug.title || `Issue #${index + 1}`,
        description: bug.description || bug.problem || '',
        problem: bug.problem || bug.description || '',
        whyItHappens: bug.whyItHappens || '',
        howToFix: bug.howToFix || bug.suggestion || '',
        suggestion: bug.suggestion || bug.howToFix || '',
        correctedSnippet: bug.correctedSnippet || '',
        simpleExplanation: bug.simpleExplanation || bug.description || '',
      };
    });
  }

  // Normalize suggestions list
  let suggestions = [];
  if (Array.isArray(parsed.suggestions)) {
    suggestions = parsed.suggestions.map((item, index) => {
      if (typeof item === 'string') {
        return {
          title: `Suggestion #${index + 1}`,
          description: item,
          priority: 'Medium',
        };
      }
      return {
        title: item.title || `Suggestion #${index + 1}`,
        description: item.description || '',
        priority: item.priority || 'Medium',
      };
    });
  }

  // Calculate or normalize code quality
  const rawScore = parsed.codeQuality?.score;
  const score =
    typeof rawScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(rawScore)))
      : bugs.length === 0
      ? 90
      : Math.max(40, 90 - bugs.length * 15);

  const rating =
    parsed.codeQuality?.rating ||
    (score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor');

  return {
    summary: parsed.summary || 'Code analyzed successfully.',
    codeQuality: {
      score,
      rating,
      strengths: Array.isArray(parsed.codeQuality?.strengths) ? parsed.codeQuality.strengths : [],
      weaknesses: Array.isArray(parsed.codeQuality?.weaknesses) ? parsed.codeQuality.weaknesses : [],
    },
    bugs,
    complexity: {
      time: simpleTime,
      space: simpleSpace,
    },
    timeComplexity,
    spaceComplexity,
    suggestions,
    optimizedCode: typeof parsed.optimizedCode === 'string' ? parsed.optimizedCode : '',
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : '',
    generatedAt: new Date().toISOString(),
  };
};

const analyzeCodeWithOllama = async (code, language) => {
  const systemInstruction = buildSystemInstruction(language);
  const prompt = `${systemInstruction}\n\nLanguage: ${language.toUpperCase()}\n\nAnalyze the following ${language.toUpperCase()} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nReturn ONLY the JSON object:`;
  const rawResponse = await executeOllamaRequest(prompt, { numPredict: 450 });
  return parseAndValidateAIResponse(rawResponse);
};

/* =========================================
   2. AI TEST CASE GENERATOR
   ========================================= */

const parseAndValidateTestCases = (rawText) => {
  const parsed = extractAndParseJSON(rawText);
  const rawCases = Array.isArray(parsed)
    ? parsed
    : (parsed.testCases || parsed.test_cases || parsed.tests || []);

  if (!Array.isArray(rawCases)) {
    throw new Error('AI response did not contain a valid test cases list.');
  }

  const testCases = rawCases.map((tc, index) => {
    const isEdge = Boolean(
      tc.isEdgeCase === true ||
      tc.is_edge_case === true ||
      (typeof tc.edgeCase === 'string' && tc.edgeCase.toLowerCase().startsWith('y')) ||
      (typeof tc.edge_case === 'string' && tc.edge_case.toLowerCase().startsWith('y')) ||
      (typeof tc.edgeCase === 'boolean' && tc.edgeCase) ||
      (typeof tc.edge_case === 'boolean' && tc.edge_case)
    );

    const tcNum = typeof tc.testCaseNumber === 'number'
      ? tc.testCaseNumber
      : typeof tc.test_case_number === 'number'
      ? tc.test_case_number
      : index + 1;

    return {
      testCaseNumber: tcNum,
      input: tc.input !== undefined && tc.input !== null ? (typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input)) : 'N/A',
      expected: tc.expected !== undefined && tc.expected !== null ? (typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : String(tc.expected)) : 'Expected output',
      explanation: typeof tc.explanation === 'string' ? tc.explanation : 'Standard verification test case.',
      isEdgeCase: isEdge,
      edgeCase: isEdge ? 'Yes' : 'No',
    };
  });

  return {
    testCases,
    count: testCases.length,
    generatedAt: new Date().toISOString(),
  };
};

const generateTestCasesWithOllama = async (code, language) => {
  const prompt = `You are CodeMentor AI, an expert programming tutor and QA test architect.
Language: ${language.toUpperCase()}
Generate 4 to 6 structured test cases for this ${language.toUpperCase()} code. Test cases should contain language-appropriate code syntax.
Return ONLY valid JSON matching this schema:
{
  "testCases": [
    {
      "testCaseNumber": 1,
      "input": "5, 10",
      "expected": "15",
      "explanation": "Tests normal positive integer input.",
      "isEdgeCase": false,
      "edgeCase": "No"
    }
  ]
}
Rules:
1. Return ONLY the JSON object. Do not wrap in markdown text.
2. Include standard normal inputs, boundary/edge cases (e.g. empty, zero, negative, extreme values), and error inputs if applicable.
3. For isEdgeCase use boolean true/false, and for edgeCase use "Yes" or "No".
4. Keep explanations clear and under 25 words.

Code to test (${language.toUpperCase()}):
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON:`;

  const rawResponse = await executeOllamaRequest(prompt, { numPredict: 500 });
  return parseAndValidateTestCases(rawResponse);
};

/* =========================================
   3. ADVANCED BUG EXPLAINER
   ========================================= */

const parseAndValidateBugExplanation = (rawText) => {
  const parsed = extractAndParseJSON(rawText);
  const rawBugs = Array.isArray(parsed)
    ? parsed
    : (parsed.bugs || parsed.issues || parsed.defects || []);

  const bugs = rawBugs.map((bug, index) => {
    let normalizedSeverity = 'Medium';
    if (typeof bug.severity === 'string') {
      const match = ['critical', 'high', 'medium', 'low', 'informational'].find(
        (s) => s === bug.severity.trim().toLowerCase()
      );
      if (match) {
        normalizedSeverity = match.charAt(0).toUpperCase() + match.slice(1);
      }
    }

    const lineNum = typeof bug.line === 'number'
      ? bug.line
      : typeof bug.lineNumber === 'number'
      ? bug.lineNumber
      : typeof bug.line_number === 'number'
      ? bug.line_number
      : 0;

    return {
      title: bug.title || `Bug #${index + 1}`,
      severity: normalizedSeverity,
      line: lineNum,
      location: bug.location || (lineNum > 0 ? `Line ${lineNum}` : 'General logic flow'),
      problem: bug.problem || bug.description || 'Potential defect detected in code logic.',
      whyItHappens: bug.whyItHappens || bug.why_it_happens || bug.cause || 'Occurs due to unhandled condition or incorrect operation.',
      howToFix: bug.howToFix || bug.how_to_fix || bug.suggestion || bug.fix || 'Review and refactor with safe boundaries.',
      correctedSnippet: bug.correctedSnippet || bug.corrected_snippet || bug.fix_snippet || '',
      simpleExplanation: bug.simpleExplanation || bug.simple_explanation || bug.problem || bug.description || 'Explainable defect in the function flow.',
    };
  });

  return {
    bugs,
    overallAssessment: parsed.overallAssessment || parsed.overall_assessment || (bugs.length === 0 ? 'No major bugs detected.' : `${bugs.length} potential issue(s) identified.`),
    bugCount: bugs.length,
    generatedAt: new Date().toISOString(),
  };
};

const explainBugsWithOllama = async (code, language) => {
  const prompt = `You are CodeMentor AI, a senior security & code defect analyst.
Language: ${language.toUpperCase()}
Examine this ${language.toUpperCase()} code for bugs, edge case traps, off-by-one errors, memory leaks, type mismatches, or runtime errors.
Return ONLY valid JSON matching this schema:
{
  "bugs": [
    {
      "title": "Bug title",
      "severity": "Critical | High | Medium | Low | Informational",
      "line": 1,
      "location": "Line 1 or Function Name",
      "problem": "What the issue is",
      "whyItHappens": "Why this occurs internally",
      "howToFix": "Specific actions to resolve the defect",
      "correctedSnippet": "// Corrected code line or small block in ${language.toUpperCase()}",
      "simpleExplanation": "Plain English summary for beginners"
    }
  ],
  "overallAssessment": "1-2 sentence overall summary of code correctness"
}
Rules:
1. Return ONLY the JSON object.
2. If no bugs exist, return an empty array [] for "bugs" and "No bugs detected." for overallAssessment.
3. Do not invent fake line numbers. If line is not certain, set line to 0.

Code (${language.toUpperCase()}):
\`\`\`${language}
${code}
\`\`\`

Return ONLY the JSON:`;

  const rawResponse = await executeOllamaRequest(prompt, { numPredict: 600 });
  return parseAndValidateBugExplanation(rawResponse);
};

/* =========================================
   4. CODE EXPLANATION MODES
   ========================================= */

const parseAndValidateCodeExplanation = (rawText, level) => {
  const parsed = extractAndParseJSON(rawText);

  const rawSteps = Array.isArray(parsed.stepByStep)
    ? parsed.stepByStep
    : Array.isArray(parsed.step_by_step)
    ? parsed.step_by_step
    : Array.isArray(parsed.steps)
    ? parsed.steps
    : [];

  let stepByStep = rawSteps.map((s, idx) => {
    if (typeof s === 'string') {
      return { step: idx + 1, title: `Step ${idx + 1}`, description: s };
    }
    return {
      step: typeof s.step === 'number' ? s.step : idx + 1,
      title: s.title || `Step ${idx + 1}`,
      description: s.description || s.explanation || '',
    };
  });

  const rawConcepts = Array.isArray(parsed.keyConcepts)
    ? parsed.keyConcepts
    : Array.isArray(parsed.key_concepts)
    ? parsed.key_concepts
    : Array.isArray(parsed.concepts)
    ? parsed.concepts
    : [];

  return {
    level: level.toLowerCase(),
    summary: parsed.summary || 'Code explained successfully.',
    explanation: parsed.explanation || '',
    keyConcepts: rawConcepts.map((c) => (typeof c === 'string' ? c : c.name || c.title || String(c))),
    stepByStep,
    insights: parsed.insights || parsed.key_insights || parsed.takeaway || '',
    generatedAt: new Date().toISOString(),
  };
};

const explainCodeWithOllama = async (code, language, explanationLevel = 'intermediate') => {
  const normalizedLevel = ['beginner', 'intermediate', 'advanced'].includes(explanationLevel.toLowerCase())
    ? explanationLevel.toLowerCase()
    : 'intermediate';

  let levelInstructions = '';
  if (normalizedLevel === 'beginner') {
    levelInstructions = `Explain for a BEGINNER programmer. Use simple real-world analogies, avoid heavy jargon, and explain step-by-step what the ${language.toUpperCase()} code is doing in friendly language.`;
  } else if (normalizedLevel === 'advanced') {
    levelInstructions = `Explain for an ADVANCED software engineer. Focus on algorithmic time/space complexity, data structure choices, memory layout, system implications, design patterns, and performance trade-offs in ${language.toUpperCase()}.`;
  } else {
    levelInstructions = `Explain for an INTERMEDIATE developer. Focus on program logic, control flow, functions, important language idioms, state transitions, and edge cases in ${language.toUpperCase()}.`;
  }

  const prompt = `You are CodeMentor AI, an expert computer science professor.
Language: ${language.toUpperCase()}
${levelInstructions}
Analyze this ${language.toUpperCase()} code:

\`\`\`${language}
${code}
\`\`\`

Return ONLY valid JSON matching this schema:
{
  "level": "${normalizedLevel}",
  "summary": "1-2 sentence high-level overview",
  "explanation": "Comprehensive explanation written specifically for ${normalizedLevel} level",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "stepByStep": [
    {
      "step": 1,
      "title": "Initialization",
      "description": "Walkthrough of this step"
    }
  ],
  "insights": "Key takeaway, best practice, or performance tip"
}

Return ONLY the JSON:`;

  const rawResponse = await executeOllamaRequest(prompt, { numPredict: 650 });
  return parseAndValidateCodeExplanation(rawResponse, normalizedLevel);
};

/* =========================================
   5. AUTOMATIC CODE DOCUMENTATION
   ========================================= */

const parseAndValidateDocumentation = (rawText, docStyle) => {
  const parsed = extractAndParseJSON(rawText);

  const rawFunctions = Array.isArray(parsed.functions)
    ? parsed.functions
    : Array.isArray(parsed.methods)
    ? parsed.methods
    : [];

  let functions = rawFunctions.map((fn) => {
    const rawParams = Array.isArray(fn.parameters)
      ? fn.parameters
      : Array.isArray(fn.params)
      ? fn.params
      : [];

    let returnsObj = { type: 'void', description: '' };
    if (typeof fn.returns === 'string') {
      returnsObj = { type: 'any', description: fn.returns };
    } else if (fn.returns && typeof fn.returns === 'object') {
      returnsObj = {
        type: fn.returns.type || 'void',
        description: fn.returns.description || '',
      };
    } else if (typeof fn.returnType === 'string') {
      returnsObj = { type: fn.returnType, description: fn.returnDescription || '' };
    }

    return {
      name: fn.name || 'Anonymous function',
      description: fn.description || '',
      parameters: rawParams.map((p) => {
        if (typeof p === 'string') {
          return { name: p, type: 'any', description: '' };
        }
        return {
          name: p.name || 'param',
          type: p.type || 'any',
          description: p.description || '',
        };
      }),
      returns: returnsObj,
      exceptions: Array.isArray(fn.exceptions) ? fn.exceptions : [],
      usageExample: fn.usageExample || fn.usage_example || fn.example || '',
    };
  });

  const notes = Array.isArray(parsed.notes)
    ? parsed.notes
    : typeof parsed.notes === 'string'
    ? [parsed.notes]
    : [];

  return {
    docStyle: docStyle || 'professional',
    documentation: parsed.documentation || '',
    documentedCode: parsed.documentedCode || parsed.documented_code || parsed.documentation || '',
    functions,
    notes,
    generatedAt: new Date().toISOString(),
  };
};

const generateDocumentationWithOllama = async (code, language, docStyle = 'professional') => {
  const normalizedStyle = ['simple', 'professional', 'developer'].includes(docStyle?.toLowerCase())
    ? docStyle.toLowerCase()
    : 'professional';

  let formatConvention = 'JSDoc comments';
  if (language === 'python') formatConvention = 'Python Docstrings (Google / Sphinx style)';
  if (language === 'java') formatConvention = 'Javadoc comments';
  if (language === 'c' || language === 'cpp') formatConvention = 'Doxygen style comments';
  if (language === 'typescript') formatConvention = 'TSDoc / JSDoc comments with TypeScript types';

  const prompt = `You are CodeMentor AI, an expert technical writer and software engineer.
Language: ${language.toUpperCase()}
Generate clean, structured documentation for this ${language.toUpperCase()} code using ${formatConvention} in "${normalizedStyle}" style.

Original Code:
\`\`\`${language}
${code}
\`\`\`

Return ONLY valid JSON matching this schema:
{
  "docStyle": "${normalizedStyle}",
  "documentation": "Formatted comment header and doc blocks",
  "documentedCode": "Complete source code with generated doc comments cleanly inserted",
  "functions": [
    {
      "name": "functionName",
      "description": "What this function does",
      "parameters": [
        { "name": "paramName", "type": "string/int/etc", "description": "Parameter role" }
      ],
      "returns": {
        "type": "returnType",
        "description": "Description of return value"
      },
      "exceptions": [
        { "type": "ErrorType", "description": "When thrown" }
      ],
      "usageExample": "exampleCall();"
    }
  ],
  "notes": ["Key architectural or runtime consideration"]
}

Return ONLY the JSON:`;

  const rawResponse = await executeOllamaRequest(prompt, { numPredict: 700 });
  return parseAndValidateDocumentation(rawResponse, normalizedStyle);
};

/* =========================================
   6. CODE OPTIMIZATION COMPARISON
   ========================================= */

const parseAndValidateOptimizationComparison = (rawText) => {
  const parsed = extractAndParseJSON(rawText);

  const rawChanges = Array.isArray(parsed.mainChanges)
    ? parsed.mainChanges
    : Array.isArray(parsed.main_changes)
    ? parsed.main_changes
    : Array.isArray(parsed.changes)
    ? parsed.changes
    : ['Refactored logic for clarity and efficiency.'];

  const isImproved = typeof parsed.isComplexityImproved === 'boolean'
    ? parsed.isComplexityImproved
    : typeof parsed.is_complexity_improved === 'boolean'
    ? parsed.is_complexity_improved
    : false;

  return {
    mainChanges: rawChanges.map((c) => (typeof c === 'string' ? c : c.description || JSON.stringify(c))),
    whyChangesWereMade: parsed.whyChangesWereMade || parsed.why_changes_were_made || parsed.rationale || 'Optimizations reduce redundant operations and enhance readability.',
    timeComplexityBefore: parsed.timeComplexityBefore || parsed.time_complexity_before || 'O(n)',
    timeComplexityAfter: parsed.timeComplexityAfter || parsed.time_complexity_after || 'O(n)',
    spaceComplexityBefore: parsed.spaceComplexityBefore || parsed.space_complexity_before || 'O(1)',
    spaceComplexityAfter: parsed.spaceComplexityAfter || parsed.space_complexity_after || 'O(1)',
    complexityJustification: parsed.complexityJustification || parsed.complexity_justification || 'Complexity derived from loop and allocation analysis.',
    isComplexityImproved: isImproved,
    generatedAt: new Date().toISOString(),
  };
};

const compareOptimizationWithOllama = async (code, language, optimizedCode) => {
  const prompt = `You are CodeMentor AI, an algorithm optimization specialist.
Language: ${language.toUpperCase()}
Compare this original ${language.toUpperCase()} code with its optimized refactored version.
The optimized code MUST be in ${language.toUpperCase()} as well.
Do not claim complexity improvements unless clearly demonstrated by asymptotic analysis.

Original Code (${language.toUpperCase()}):
\`\`\`${language}
${code}
\`\`\`

Optimized Code (${language.toUpperCase()}):
\`\`\`${language}
${optimizedCode}
\`\`\`

Return ONLY valid JSON matching this schema:
{
  "mainChanges": ["Main change 1", "Main change 2"],
  "whyChangesWereMade": "Clear educational explanation of why the changes improve the code",
  "timeComplexityBefore": "O(n^2)",
  "timeComplexityAfter": "O(n)",
  "spaceComplexityBefore": "O(1)",
  "spaceComplexityAfter": "O(1)",
  "complexityJustification": "Clear justification of whether and why complexity improved",
  "isComplexityImproved": false
}

Return ONLY the JSON:`;

  const rawResponse = await executeOllamaRequest(prompt, { numPredict: 500 });
  return parseAndValidateOptimizationComparison(rawResponse);
};

/* =========================================
   EXPORTS
   ========================================= */

module.exports = {
  analyzeCodeWithOllama,
  analyzeCodeWithGemini: analyzeCodeWithOllama, // Alias for backward compatibility
  generateTestCasesWithOllama,
  explainBugsWithOllama,
  explainCodeWithOllama,
  generateDocumentationWithOllama,
  compareOptimizationWithOllama,
  parseAndValidateAIResponse,
  parseAndValidateTestCases,
  parseAndValidateBugExplanation,
  parseAndValidateCodeExplanation,
  parseAndValidateDocumentation,
  parseAndValidateOptimizationComparison,
  buildSystemInstruction,
  extractAndParseJSON,
};