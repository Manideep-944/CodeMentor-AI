/**
 * CodeMentor AI — Report Generator Utility (Phase 7.5)
 * Generates beautifully formatted HTML and Markdown reports for download across all 6 supported languages:
 * JavaScript, Python, Java, C++, C, TypeScript.
 */

export const generateHTMLReport = (analysisRecord) => {
  if (!analysisRecord) return '';

  const {
    code = '',
    language = 'javascript',
    createdAt,
    analysis = {},
    isBookmarked = false,
    tags = [],
  } = analysisRecord;

  const {
    summary = 'No summary provided.',
    codeQuality = {},
    bugs = [],
    timeComplexity = {},
    spaceComplexity = {},
    suggestions = [],
    optimizedCode = '',
    explanation = '',
    testCases = [],
    documentation = null,
    codeExplanation = null,
  } = analysis;

  const score = typeof codeQuality.score === 'number' ? codeQuality.score : 0;
  const rating = codeQuality.rating || (score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor');
  const dateStr = createdAt ? new Date(createdAt).toLocaleString() : new Date().toLocaleString();

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatVal = (val) => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  };

  const getScoreColor = (sc) => {
    if (sc >= 85) return '#10b981';
    if (sc >= 70) return '#6366f1';
    if (sc >= 50) return '#f59e0b';
    return '#f43f5e';
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeMentor AI Analysis Report — ${escapeHtml(language.toUpperCase())}</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --border: #1f293d;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --brand: #6366f1;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #f43f5e;
      --cyan: #06b6d4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 2.5rem 1.5rem;
    }
    .container {
      max-width: 960px;
      margin: 0 auto;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand-title {
      font-size: 1.75rem;
      font-weight: 800;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.25rem;
    }
    .meta-info {
      color: var(--text-muted);
      font-size: 0.85rem;
      font-family: monospace;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-brand { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
    .badge-tag { background: rgba(6,182,212,0.12); color: #67e8f9; border: 1px solid rgba(6,182,212,0.3); margin-right: 0.25rem; }
    .score-badge {
      font-size: 1.5rem;
      font-weight: 800;
      padding: 0.5rem 1.25rem;
      border-radius: 12px;
      border: 2px solid ${getScoreColor(score)};
      color: ${getScoreColor(score)};
      background: rgba(0,0,0,0.3);
      text-align: center;
    }
    .section {
      margin-bottom: 2.25rem;
    }
    .section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 1rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media(max-width: 640px) { .grid-2 { grid-template-columns: 1fr; } }
    .card {
      background: #0d1322;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .card-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #f1f5f9;
      margin-bottom: 0.5rem;
    }
    pre {
      background: #080c14;
      border: 1px solid #1a2234;
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      font-size: 0.85rem;
      color: #e2e8f0;
      line-height: 1.5;
    }
    .bug-card {
      background: rgba(244,63,94,0.05);
      border: 1px solid rgba(244,63,94,0.25);
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .bug-title {
      color: #fda4af;
      font-weight: 700;
      font-size: 0.95rem;
      margin-bottom: 0.35rem;
    }
    .suggestion-card {
      background: rgba(99,102,241,0.06);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 10px;
      padding: 1.25rem;
      margin-bottom: 0.75rem;
    }
    .test-case {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <h1 class="brand-title">CodeMentor AI</h1>
        <p style="color:#94a3b8; font-size:0.95rem; margin-bottom: 0.5rem;">Intelligent Multi-Language Code Analysis & Optimization Report</p>
        <div class="meta-info">
          <span>Language: <strong style="color:#fff;">${escapeHtml(language.toUpperCase())}</strong></span> &bull; 
          <span>Generated: ${escapeHtml(dateStr)}</span>
          ${isBookmarked ? ' &bull; <span style="color:#fbbf24;">★ Bookmarked</span>' : ''}
        </div>
        ${tags.length > 0 ? `
          <div style="margin-top: 0.5rem;">
            ${tags.map(t => `<span class="badge badge-tag">#${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="score-badge">
        ${score}/100
        <div style="font-size: 0.75rem; font-weight: 500; text-transform: uppercase;">${escapeHtml(rating)}</div>
      </div>
    </div>

    <!-- 1. Executive Summary -->
    <div class="section">
      <h2 class="section-title">1. Executive Summary</h2>
      <div class="card">
        <p>${escapeHtml(summary)}</p>
      </div>
    </div>

    <!-- 2. Quality Breakdown -->
    <div class="section">
      <h2 class="section-title">2. Code Quality & Architecture Assessment</h2>
      <div class="grid-2">
        <div class="card">
          <div class="card-title" style="color: #34d399;">✓ Key Strengths</div>
          ${Array.isArray(codeQuality.strengths) && codeQuality.strengths.length > 0
            ? `<ul style="padding-left: 1.2rem; font-size: 0.85rem; color: #cbd5e1;">${codeQuality.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
            : '<p style="color: #64748b; font-size: 0.85rem;">Clean syntax and structure.</p>'
          }
        </div>
        <div class="card">
          <div class="card-title" style="color: #fbbf24;">⚠ Areas for Improvement</div>
          ${Array.isArray(codeQuality.weaknesses) && codeQuality.weaknesses.length > 0
            ? `<ul style="padding-left: 1.2rem; font-size: 0.85rem; color: #cbd5e1;">${codeQuality.weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>`
            : '<p style="color: #64748b; font-size: 0.85rem;">No notable architectural weaknesses identified.</p>'
          }
        </div>
      </div>
    </div>

    <!-- 3. Complexity Analysis -->
    <div class="section">
      <h2 class="section-title">3. Computational Complexity (Big-O)</h2>
      <div class="grid-2">
        <div class="card">
          <div class="card-title" style="color:#38bdf8;">Time Complexity: ${escapeHtml(timeComplexity.notation || timeComplexity.worstCase || 'O(n)')}</div>
          <p style="font-size: 0.85rem; color:#cbd5e1;">${escapeHtml(timeComplexity.explanation || 'Evaluated based on loop depths and operation frequency.')}</p>
        </div>
        <div class="card">
          <div class="card-title" style="color:#c084fc;">Space Complexity: ${escapeHtml(spaceComplexity.notation || spaceComplexity.worstCase || 'O(1)')}</div>
          <p style="font-size: 0.85rem; color:#cbd5e1;">${escapeHtml(spaceComplexity.explanation || 'Evaluated based on auxiliary data structures and stack memory.')}</p>
        </div>
      </div>
    </div>

    <!-- 4. Bug Detection & Explanations -->
    <div class="section">
      <h2 class="section-title">4. Bug Detection & Diagnostic Explanations (${bugs.length})</h2>
      ${bugs.length === 0 ? `
        <div class="card" style="text-align: center; color: #34d399; padding: 1.5rem;">
          ✓ No significant bugs or defects detected in the primary code flow.
        </div>
      ` : bugs.map((b, i) => `
        <div class="bug-card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span class="bug-title">${i + 1}. ${escapeHtml(b.title || 'Issue')}</span>
            <span class="badge" style="background: rgba(244,63,94,0.2); color:#fda4af;">${escapeHtml(b.severity || 'Medium')}</span>
          </div>
          <p style="font-size: 0.85rem; color: #e2e8f0; margin-bottom: 0.5rem;"><strong>Problem:</strong> ${escapeHtml(b.problem || b.description)}</p>
          ${b.whyItHappens ? `<p style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 0.5rem;"><strong>Root Cause:</strong> ${escapeHtml(b.whyItHappens)}</p>` : ''}
          ${b.howToFix || b.suggestion ? `<p style="font-size: 0.85rem; color: #93c5fd; margin-bottom: 0.5rem;"><strong>Remediation:</strong> ${escapeHtml(b.howToFix || b.suggestion)}</p>` : ''}
          ${b.correctedSnippet ? `<pre style="margin-top: 0.5rem;"><code>${escapeHtml(b.correctedSnippet)}</code></pre>` : ''}
        </div>
      `).join('')}
    </div>

    <!-- 5. Optimization Suggestions -->
    ${Array.isArray(suggestions) && suggestions.length > 0 ? `
    <div class="section">
      <h2 class="section-title">5. Optimization Suggestions (${suggestions.length})</h2>
      ${suggestions.map((s, i) => `
        <div class="suggestion-card">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
            <strong style="color: #a5b4fc; font-size: 0.9rem;">${i + 1}. ${escapeHtml(s.title || 'Suggestion')}</strong>
            <span class="badge badge-brand">${escapeHtml(s.priority || 'Medium')} Priority</span>
          </div>
          <p style="font-size: 0.85rem; color: #cbd5e1;">${escapeHtml(s.description)}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- 6. Original Source Code -->
    <div class="section">
      <h2 class="section-title">6. Original Source Code (${escapeHtml(language.toUpperCase())})</h2>
      <pre><code>${escapeHtml(code)}</code></pre>
    </div>

    <!-- 7. Optimized Code -->
    ${optimizedCode ? `
    <div class="section">
      <h2 class="section-title">7. Optimized Refactored Code (${escapeHtml(language.toUpperCase())})</h2>
      ${explanation ? `<div class="card" style="margin-bottom: 0.75rem;"><p style="font-size: 0.85rem;"><strong>Optimization Rationale:</strong> ${escapeHtml(explanation)}</p></div>` : ''}
      <pre><code>${escapeHtml(optimizedCode)}</code></pre>
    </div>
    ` : ''}

    <!-- 8. AI-Generated Test Cases -->
    ${Array.isArray(testCases) && testCases.length > 0 ? `
    <div class="section">
      <h2 class="section-title">8. AI-Generated Test Cases (${testCases.length})</h2>
      ${testCases.map((tc, idx) => `
        <div class="test-case">
          <div style="display:flex; justify-content:space-between; margin-bottom: 0.4rem;">
            <strong style="color:#38bdf8;">Test Case #${tc.testCaseNumber || idx + 1}</strong>
            <span class="badge ${tc.isEdgeCase ? 'badge-brand' : 'badge-tag'}">${tc.isEdgeCase ? 'Edge Case' : 'Standard Case'}</span>
          </div>
          <div style="font-family: monospace; font-size: 0.8rem; margin-bottom: 0.3rem;"><strong>Input:</strong> ${escapeHtml(formatVal(tc.input))}</div>
          <div style="font-family: monospace; font-size: 0.8rem; margin-bottom: 0.3rem; color:#34d399;"><strong>Expected:</strong> ${escapeHtml(formatVal(tc.expected))}</div>
          <p style="font-size: 0.8rem; color:#94a3b8;">${escapeHtml(tc.explanation)}</p>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- 9. Code Explanation (if available) -->
    ${codeExplanation && codeExplanation.explanation ? `
    <div class="section">
      <h2 class="section-title">9. Code Explanation (${escapeHtml((codeExplanation.level || 'Intermediate').toUpperCase())})</h2>
      <div class="card">
        <p style="font-size: 0.85rem; color: #cbd5e1; white-space: pre-line;">${escapeHtml(codeExplanation.explanation)}</p>
        ${codeExplanation.insights ? `<p style="font-size: 0.85rem; color: #a5b4fc; margin-top: 0.75rem;"><strong>Key Takeaway:</strong> ${escapeHtml(codeExplanation.insights)}</p>` : ''}
      </div>
    </div>
    ` : ''}

    <!-- 10. Automated Documentation (if available) -->
    ${documentation && (documentation.documentedCode || documentation.documentation) ? `
    <div class="section">
      <h2 class="section-title">10. Automated Code Documentation</h2>
      <pre><code>${escapeHtml(documentation.documentedCode || documentation.documentation)}</code></pre>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      Generated automatically by <strong>CodeMentor AI</strong> &bull; Powered locally by Ollama (Qwen2.5-Coder:7b)
    </div>
  </div>
</body>
</html>`;
};

export const downloadReport = (analysisRecord, format = 'html') => {
  if (!analysisRecord) return;

  const lang = (analysisRecord.language || 'javascript').toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `codementor-report-${lang}-${timestamp}.${format}`;

  let content = '';
  let mimeType = 'text/plain';

  if (format === 'html') {
    content = generateHTMLReport(analysisRecord);
    mimeType = 'text/html';
  } else if (format === 'md') {
    const analysis = analysisRecord.analysis || {};
    const codeQuality = analysis.codeQuality || {};
    const timeComplexity = analysis.timeComplexity || {};
    const spaceComplexity = analysis.spaceComplexity || {};
    const bugs = analysis.bugs || [];
    const suggestions = analysis.suggestions || [];
    const testCases = analysis.testCases || [];
    const codeExplanation = analysis.codeExplanation || null;
    const documentation = analysis.documentation || null;

    content = `# CodeMentor AI Analysis Report (${lang.toUpperCase()})

**Date:** ${new Date(analysisRecord.createdAt || Date.now()).toLocaleString()}
**Programming Language:** ${lang.toUpperCase()}
**Overall Quality Score:** ${codeQuality.score || 0}/100 (${codeQuality.rating || 'Good'})
**Time Complexity:** ${timeComplexity.notation || timeComplexity.worstCase || 'O(n)'}
**Space Complexity:** ${spaceComplexity.notation || spaceComplexity.worstCase || 'O(1)'}

---

## 1. Executive Summary
${analysis.summary || 'No summary provided.'}

---

## 2. Code Quality Assessment
- **Score:** ${codeQuality.score || 0}/100
- **Rating:** ${codeQuality.rating || 'Good'}
- **Key Strengths:**
${Array.isArray(codeQuality.strengths) && codeQuality.strengths.length > 0 ? codeQuality.strengths.map(s => `  - ${s}`).join('\n') : '  - Clean structure and syntax'}
- **Areas for Improvement:**
${Array.isArray(codeQuality.weaknesses) && codeQuality.weaknesses.length > 0 ? codeQuality.weaknesses.map(w => `  - ${w}`).join('\n') : '  - None identified'}

---

## 3. Computational Complexity (Big-O)
- **Time Complexity:** ${timeComplexity.notation || timeComplexity.worstCase || 'O(n)'}
  - *Details:* ${timeComplexity.explanation || 'Derived from loop execution depth.'}
- **Space Complexity:** ${spaceComplexity.notation || spaceComplexity.worstCase || 'O(1)'}
  - *Details:* ${spaceComplexity.explanation || 'Derived from memory allocation.'}

---

## 4. Bugs & Defects Detected (${bugs.length})
${bugs.length === 0 ? 'No critical bugs or defects detected.' : bugs.map((b, i) => `### ${i + 1}. ${b.title || 'Issue'} [${b.severity || 'Medium'}]
- **Problem:** ${b.problem || b.description}
- **Root Cause:** ${b.whyItHappens || 'Logic flow defect'}
- **Remediation:** ${b.howToFix || b.suggestion}
${b.correctedSnippet ? `\`\`\`${lang}\n${b.correctedSnippet}\n\`\`\`` : ''}`).join('\n\n')}

---

## 5. Suggestions (${suggestions.length})
${suggestions.length === 0 ? 'No additional suggestions.' : suggestions.map((s, i) => `### ${i + 1}. ${s.title || 'Suggestion'} [${s.priority || 'Medium'} Priority]
${s.description}`).join('\n\n')}

---

## 6. Original Source Code
\`\`\`${lang}
${analysisRecord.code}
\`\`\`

---

## 7. Optimized Code (${lang.toUpperCase()})
${analysis.explanation ? `**Optimization Rationale:** ${analysis.explanation}\n` : ''}
\`\`\`${lang}
${analysis.optimizedCode || '// No refactored code generated'}
\`\`\`

---

## 8. AI-Generated Test Cases (${testCases.length})
${testCases.length === 0 ? 'No test cases generated.' : testCases.map((tc, idx) => `### Test Case #${tc.testCaseNumber || idx + 1} (${tc.isEdgeCase ? 'Edge Case' : 'Standard Case'})
- **Input:** \`${typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}\`
- **Expected:** \`${typeof tc.expected === 'object' ? JSON.stringify(tc.expected) : tc.expected}\`
- **Explanation:** ${tc.explanation || 'Verification test'}`).join('\n\n')}

${codeExplanation && codeExplanation.explanation ? `---

## 9. Code Explanation (${(codeExplanation.level || 'Intermediate').toUpperCase()})
${codeExplanation.explanation}
${codeExplanation.insights ? `\n**Key Takeaway:** ${codeExplanation.insights}` : ''}
` : ''}

${documentation && (documentation.documentedCode || documentation.documentation) ? `---

## 10. Automated Documentation
\`\`\`${lang}
${documentation.documentedCode || documentation.documentation}
\`\`\`
` : ''}

---
*Generated by CodeMentor AI — Powered locally by Ollama (Qwen2.5-Coder:7b)*
`;
    mimeType = 'text/markdown';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
