import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Lightbulb, 
  Layers, 
  ShieldAlert, 
  Terminal,
  Activity,
  Copy,
  Check,
  Code2,
  ThumbsUp,
  AlertCircle,
  HelpCircle,
  FileCode,
  ArrowRight,
  BookOpen,
  FlaskConical,
  FileText,
  GitCompare,
  Download,
  Bookmark,
  Share2,
  Loader2,
  Info
} from 'lucide-react';
import Badge from '../common/Badge';
import { 
  generateTestCases, 
  explainCode, 
  generateDocumentation, 
  compareOptimization,
  explainBugs 
} from '../../services/api';
import { downloadReport } from '../../utils/reportGenerator';

const formatDisplayValue = (val) => {
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

export const AnalysisPanel = ({ 
  analysisResult, 
  isAnalyzing, 
  error,
  sourceCode = '',
  language = 'javascript',
  onBookmarkToggle,
  isBookmarked = false,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Phase 7 Feature States
  const [explanationLevel, setExplanationLevel] = useState('intermediate');
  const [explanationData, setExplanationData] = useState(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanationError, setExplanationError] = useState(null);

  const [docStyle, setDocStyle] = useState('professional');
  const [docData, setDocData] = useState(null);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [docError, setDocError] = useState(null);

  const [testCasesData, setTestCasesData] = useState(null);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [testsError, setTestsError] = useState(null);

  const [comparisonData, setComparisonData] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState(null);

  const [comparisonViewMode, setComparisonViewMode] = useState('split'); // 'split' | 'tabs'
  const [activeCompTab, setActiveCompTab] = useState('optimized'); // 'original' | 'optimized'

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'quality', name: 'Code Quality', icon: CheckCircle2 },
    { id: 'bugs', name: 'Bug Explainer', icon: AlertTriangle },
    { id: 'complexity', name: 'Complexity', icon: Clock },
    { id: 'suggestions', name: 'Suggestions', icon: Lightbulb },
    { id: 'optimized', name: 'Original vs Optimized', icon: GitCompare },
    { id: 'testcases', name: 'Test Cases', icon: FlaskConical },
    { id: 'explanation', name: 'Code Explanation', icon: BookOpen },
    { id: 'documentation', name: 'Documentation', icon: FileText },
  ];

  const handleCopyCode = (text, type = 'code') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedDoc(true);
      setTimeout(() => setCopiedDoc(false), 2000);
    }
  };

  // Trigger AI Test Case Generation
  const handleGenerateTestCases = async () => {
    const codeToTest = sourceCode || analysisResult?.code || '';
    const lang = language || analysisResult?.language || 'javascript';
    if (!codeToTest) return;

    setIsGeneratingTests(true);
    setTestsError(null);
    const res = await generateTestCases(codeToTest, lang);
    setIsGeneratingTests(false);

    if (res.success) {
      setTestCasesData(res.data);
    } else {
      setTestsError(res.error);
    }
  };

  // Trigger Code Explanation by Mode
  const handleExplainCode = async (level = explanationLevel) => {
    const codeToExplain = sourceCode || analysisResult?.code || '';
    const lang = language || analysisResult?.language || 'javascript';
    if (!codeToExplain) return;

    setIsExplaining(true);
    setExplanationError(null);
    setExplanationLevel(level);
    const res = await explainCode(codeToExplain, lang, level);
    setIsExplaining(false);

    if (res.success) {
      setExplanationData(res.data);
    } else {
      setExplanationError(res.error);
    }
  };

  // Trigger Code Documentation Generation
  const handleGenerateDoc = async (style = docStyle) => {
    const codeToDoc = sourceCode || analysisResult?.code || '';
    const lang = language || analysisResult?.language || 'javascript';
    if (!codeToDoc) return;

    setIsGeneratingDoc(true);
    setDocError(null);
    setDocStyle(style);
    const res = await generateDocumentation(codeToDoc, lang, style);
    setIsGeneratingDoc(false);

    if (res.success) {
      setDocData(res.data);
    } else {
      setDocError(res.error);
    }
  };

  // Trigger Optimization Comparison
  const handleCompareOptimization = async () => {
    const orig = sourceCode || analysisResult?.code || '';
    const analysisObj = analysisResult?.analysis || analysisResult || {};
    const opt = analysisObj?.optimizedCode || '';
    const lang = language || analysisResult?.language || 'javascript';
    if (!orig || !opt) return;

    setIsComparing(true);
    setComparisonError(null);
    const res = await compareOptimization(orig, lang, opt);
    setIsComparing(false);

    if (res.success) {
      setComparisonData(res.data);
    } else {
      setComparisonError(res.error);
    }
  };

  // 1. Loading State
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 bg-[#0d111a] rounded-xl border border-surface-400/40 text-center">
        <div className="relative mb-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center shadow-glow-brand animate-pulse">
            <Sparkles className="w-7 h-7 text-brand-400 animate-spin" />
          </div>
        </div>
        <h3 className="text-base font-semibold text-slate-100 mb-1">
          Analyzing code with Local AI...
        </h3>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
          Evaluating logic, calculating asymptotic Big-O complexity, and preparing optimization insights with Ollama (Qwen2.5-Coder:7b).
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    const isOllamaError = error.toLowerCase().includes('ollama') || error.toLowerCase().includes('connect') || error.toLowerCase().includes('11434');
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 bg-[#0d111a] rounded-xl border border-rose-500/30 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-rose-400" />
        </div>
        <h3 className="text-base font-semibold text-rose-200 mb-2">
          {isOllamaError ? 'Local AI Service Unavailable' : 'Analysis Request Failed'}
        </h3>
        <div className="text-xs text-slate-300 max-w-md mb-4 bg-surface-200 p-3.5 rounded-xl border border-surface-400/40 text-left font-mono">
          <p className="text-rose-400 font-semibold mb-1">{error}</p>
          {isOllamaError && (
            <p className="text-slate-400 text-[11px] mt-2 font-sans">
              Ensure Ollama is running at <code className="text-brand-300 font-mono">http://localhost:11434</code> with model <code className="text-brand-300 font-mono">qwen2.5-coder:7b</code>:
              <br />
              <code className="text-emerald-300 font-mono block mt-1 bg-surface-100 p-1.5 rounded">
                ollama run qwen2.5-coder:7b
              </code>
            </p>
          )}
        </div>
        <span className="text-xs text-slate-500">
          Backend server is active on port 5000.
        </span>
      </div>
    );
  }

  // 3. Pristine Empty State
  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[420px] p-8 bg-[#0d111a] rounded-xl border border-surface-400/40 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-surface-200/80 border border-surface-400/40 flex items-center justify-center mb-4 shadow-subtle">
          <Terminal className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-2">
          Your code analysis will appear here.
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
          Write or paste code in the editor and click <span className="text-brand-400 font-semibold">"Analyze Code"</span> to receive real-time AI mentorship and complexity breakdowns.
        </p>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md text-left">
          <div className="p-3 rounded-lg bg-surface-200/50 border border-surface-400/30">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              <span>Quality Score & Review</span>
            </div>
            <p className="text-[11px] text-slate-400">Score from 0-100 with strengths & weaknesses</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/50 border border-surface-400/30">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Advanced Bug Explainer</span>
            </div>
            <p className="text-[11px] text-slate-400">Severity, mechanics, root cause, and fixes</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/50 border border-surface-400/30">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Test Cases</span>
            </div>
            <p className="text-[11px] text-slate-400">Generates structured normal & edge test inputs</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-200/50 border border-surface-400/30">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
              <GitCompare className="w-3.5 h-3.5 text-purple-400" />
              <span>Code Comparison</span>
            </div>
            <p className="text-[11px] text-slate-400">Side-by-side original vs optimized view</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Real AI Analysis Presentation
  const analysis = analysisResult.analysis || analysisResult;
  const currentCode = sourceCode || analysisResult.code || '';
  const currentLang = language || analysisResult.language || 'javascript';

  const { 
    summary = '', 
    codeQuality = {}, 
    bugs = [], 
    timeComplexity = {}, 
    spaceComplexity = {}, 
    suggestions = [], 
    optimizedCode = '', 
    explanation = '',
    testCases: initialTestCases = [],
  } = analysis;

  const activeTestCases = testCasesData?.testCases || (Array.isArray(initialTestCases) && initialTestCases.length > 0 ? initialTestCases : null);

  const score = typeof codeQuality.score === 'number' ? codeQuality.score : 0;
  const rating = codeQuality.rating || (score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor');

  const getScoreColor = (sc) => {
    if (sc >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (sc >= 70) return 'text-brand-400 border-brand-500/40 bg-brand-500/10';
    if (sc >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getSeverityBadgeVariant = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'brand';
    }
  };

  const handleDownload = (fmt) => {
    downloadReport({
      code: currentCode,
      language: currentLang,
      createdAt: analysisResult.createdAt || new Date().toISOString(),
      analysis: {
        ...analysis,
        testCases: activeTestCases || [],
      },
    }, fmt);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d111a] rounded-xl border border-surface-400/40 shadow-xl overflow-hidden">
      {/* Header Banner with Actions */}
      <div className="px-4 py-3 bg-[#111622] border-b border-surface-400/40 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
          <h3 className="text-sm font-semibold text-slate-100 truncate">AI Code Intelligence</h3>
          <Badge variant="brand" size="sm">Qwen2.5-Coder</Badge>
          {currentLang && (
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline uppercase">
              {currentLang}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {onBookmarkToggle && (
            <button
              onClick={onBookmarkToggle}
              className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition-colors ${
                isBookmarked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-surface-200 hover:bg-surface-300 text-slate-400 hover:text-slate-200 border-surface-400/40'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Analysis'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}

          {/* Quick Download Report */}
          <button
            onClick={() => handleDownload('html')}
            className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 hover:text-white border border-surface-400/40 text-xs flex items-center space-x-1 transition-colors"
            title="Download Analysis Report (HTML)"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center space-x-1 px-4 py-2 bg-surface-200/50 border-b border-surface-400/30 overflow-x-auto text-xs no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          const bugCount = tab.id === 'bugs' ? bugs.length : 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-brand-600/30 text-brand-300 border border-brand-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-300/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
              {bugCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                  {bugCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Summary & Overview
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {analysis.generatedAt ? new Date(analysis.generatedAt).toLocaleTimeString() : ''}
                </span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {summary || 'Analysis completed successfully.'}
              </p>
            </div>

            {/* Quality Score & Rating Banner */}
            <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Overall Quality Rating</span>
                <div className="text-lg font-bold text-white flex items-center space-x-2">
                  <span>{rating}</span>
                  <Badge variant={score >= 70 ? 'success' : 'warning'} size="sm">
                    {score}/100
                  </Badge>
                </div>
              </div>
              <div className={`px-4 py-2.5 rounded-xl border font-mono font-bold text-xl ${getScoreColor(score)}`}>
                {score}/100
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Complexity Mini Card */}
              <div className="p-3.5 rounded-lg bg-surface-200/40 border border-surface-400/30 space-y-1">
                <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Time: {timeComplexity.notation || timeComplexity.worstCase || 'O(n)'}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {timeComplexity.explanation || 'Derived from loop execution depth.'}
                </p>
              </div>

              {/* Space Mini Card */}
              <div className="p-3.5 rounded-lg bg-surface-200/40 border border-surface-400/30 space-y-1">
                <div className="flex items-center space-x-1.5 text-purple-300 font-semibold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Space: {spaceComplexity.notation || spaceComplexity.worstCase || 'O(1)'}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {spaceComplexity.explanation || 'Auxiliary memory allocations.'}
                </p>
              </div>
            </div>

            {/* Bug count alert */}
            <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
              bugs.length > 0
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center space-x-2">
                {bugs.length > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span className="font-semibold text-xs">
                  {bugs.length > 0 ? `${bugs.length} potential issue(s) detected` : 'No significant issues detected'}
                </span>
              </div>
              <button
                onClick={() => setActiveTab(bugs.length > 0 ? 'bugs' : 'quality')}
                className="text-[11px] underline hover:no-underline font-medium"
              >
                View details
              </button>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => { setActiveTab('testcases'); if (!activeTestCases) handleGenerateTestCases(); }}
                className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-cyan-300 border border-surface-400/40 text-xs flex items-center space-x-1.5 transition-colors"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Generate Test Cases</span>
              </button>
              <button
                onClick={() => { setActiveTab('explanation'); if (!explanationData) handleExplainCode(); }}
                className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-purple-300 border border-surface-400/40 text-xs flex items-center space-x-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Explain Code</span>
              </button>
              <button
                onClick={() => { setActiveTab('documentation'); if (!docData) handleGenerateDoc(); }}
                className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-brand-300 border border-surface-400/40 text-xs flex items-center space-x-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Docs</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CODE QUALITY ================= */}
        {activeTab === 'quality' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-100 text-sm">Quality Assessment</h4>
                <p className="text-slate-400 text-xs">Based on naming, readability, structure, and algorithmic elegance</p>
              </div>
              <div className={`px-4 py-2 rounded-xl border font-mono font-bold text-lg ${getScoreColor(score)}`}>
                {score}/100
              </div>
            </div>

            {/* Strengths */}
            {codeQuality.strengths && codeQuality.strengths.length > 0 && (
              <div className="p-4 rounded-xl bg-surface-200/50 border border-surface-400/30 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Strengths</span>
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  {codeQuality.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses / Areas for Improvement */}
            {codeQuality.weaknesses && codeQuality.weaknesses.length > 0 && (
              <div className="p-4 rounded-xl bg-surface-200/50 border border-surface-400/30 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Areas for Improvement</span>
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  {codeQuality.weaknesses.map((weak, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BUG EXPLAINER (FEATURE 2) ================= */}
        {activeTab === 'bugs' && (
          <div className="space-y-3">
            {bugs.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface-200/40 border border-surface-400/30 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-semibold text-slate-200 text-sm">
                  No critical bugs or defects detected.
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  No obvious syntax defects or logic traps were detected. Generate automated test cases to stress-test corner cases.
                </p>
              </div>
            ) : (
              bugs.map((bug, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-200/60 border border-rose-500/30 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <h4 className="font-semibold text-slate-100 text-xs">
                        {bug.title || `Issue #${idx + 1}`}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {bug.line > 0 && (
                        <Badge variant="default" size="sm">
                          Line {bug.line}
                        </Badge>
                      )}
                      <Badge variant={getSeverityBadgeVariant(bug.severity)} size="sm">
                        {bug.severity || 'Medium'}
                      </Badge>
                    </div>
                  </div>

                  {/* Problem & Mechanics */}
                  <div className="space-y-1.5 text-slate-300">
                    <div>
                      <span className="font-semibold text-rose-300">Problem: </span>
                      <span>{bug.problem || bug.description}</span>
                    </div>
                    {bug.whyItHappens && (
                      <div className="text-slate-400 text-[11px]">
                        <span className="font-semibold text-slate-300">Why it happens: </span>
                        <span>{bug.whyItHappens}</span>
                      </div>
                    )}
                  </div>

                  {/* Remediation */}
                  {(bug.howToFix || bug.suggestion) && (
                    <div className="p-3 rounded-lg bg-surface-100 border border-surface-400/30 text-[11px] text-slate-200 space-y-1">
                      <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span>How to fix:</span>
                      </div>
                      <p className="text-slate-300">{bug.howToFix || bug.suggestion}</p>
                    </div>
                  )}

                  {/* Corrected Code Snippet */}
                  {bug.correctedSnippet && (
                    <div className="rounded-lg bg-[#090c14] border border-surface-400/40 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-[#111622] text-[10px] font-mono text-slate-400 border-b border-surface-400/20">
                        <span>Suggested Fix</span>
                        <button
                          onClick={() => handleCopyCode(bug.correctedSnippet)}
                          className="hover:text-white flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </button>
                      </div>
                      <pre className="p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                        <code>{bug.correctedSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 4: COMPLEXITY ================= */}
        {activeTab === 'complexity' && (
          <div className="space-y-4">
            {/* Time Complexity Card */}
            <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 font-semibold text-slate-200 text-sm">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Time Complexity</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    Worst: {timeComplexity.worstCase || timeComplexity.notation || 'O(n)'}
                  </span>
                  {timeComplexity.averageCase && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-300 text-slate-300 border border-surface-400/50 text-[11px]">
                      Avg: {timeComplexity.averageCase}
                    </span>
                  )}
                  {timeComplexity.bestCase && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px]">
                      Best: {timeComplexity.bestCase}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {timeComplexity.explanation || 'Calculated based on algorithm control flow, inner loops, and recursion depth.'}
              </p>
            </div>

            {/* Space Complexity Card */}
            <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2 font-semibold text-slate-200 text-sm">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  <span>Space Complexity (Memory)</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                    Worst: {spaceComplexity.worstCase || spaceComplexity.notation || 'O(1)'}
                  </span>
                  {spaceComplexity.bestCase && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px]">
                      Best: {spaceComplexity.bestCase}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                {spaceComplexity.explanation || 'Calculated based on auxiliary data structures and stack frame allocations.'}
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 5: SUGGESTIONS ================= */}
        {activeTab === 'suggestions' && (
          <div className="space-y-3">
            {suggestions.length === 0 ? (
              <div className="p-6 rounded-xl bg-surface-200/40 text-center text-slate-400">
                No specific optimization suggestions provided.
              </div>
            ) : (
              suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-100 text-xs flex items-center space-x-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>{sug.title || `Suggestion #${idx + 1}`}</span>
                    </h4>
                    <Badge variant={getPriorityBadgeVariant(sug.priority)} size="sm">
                      {sug.priority || 'Medium'} Priority
                    </Badge>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {sug.description}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 6: ORIGINAL VS OPTIMIZED CODE (FEATURE 4) ================= */}
        {activeTab === 'optimized' && (
          <div className="space-y-4">
            {/* View mode toggle & Compare Button */}
            <div className="flex items-center justify-between bg-surface-200/50 p-2.5 rounded-xl border border-surface-400/30">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-semibold">View Mode:</span>
                <div className="flex bg-surface-100 rounded-lg p-0.5 border border-surface-400/40 text-[11px]">
                  <button
                    onClick={() => setComparisonViewMode('split')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      comparisonViewMode === 'split' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    onClick={() => setComparisonViewMode('tabs')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      comparisonViewMode === 'tabs' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tabs
                  </button>
                </div>
              </div>

              <button
                onClick={handleCompareOptimization}
                disabled={isComparing || !optimizedCode}
                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-300 text-slate-200 text-xs font-semibold border border-surface-400/40 flex items-center space-x-1.5 disabled:opacity-40 transition-colors"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                    <span>Deep Diff Analysis</span>
                  </>
                )}
              </button>
            </div>

            {/* Optimization Rationale Banner */}
            {explanation && (
              <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="uppercase tracking-wider text-slate-400">Optimization Rationale</span>
                  <Badge variant="brand" size="sm">AI Generated</Badge>
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {explanation}
                </p>
              </div>
            )}

            {/* Deep Comparison Analysis Card if generated */}
            {comparisonData && (
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-purple-200 text-xs flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Complexity & Optimization Verdict</span>
                  </h4>
                  <Badge variant={comparisonData.isComplexityImproved ? 'success' : 'default'} size="sm">
                    {comparisonData.isComplexityImproved ? 'Complexity Improved' : 'Refactored / Equivalent'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-100/60 border border-surface-400/30">
                    <span className="text-[10px] text-slate-400 block mb-1">Time Complexity</span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-slate-400">{comparisonData.timeComplexityBefore}</span>
                      <ArrowRight className="w-3 h-3 text-brand-400" />
                      <span className="text-emerald-300 font-bold">{comparisonData.timeComplexityAfter}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-100/60 border border-surface-400/30">
                    <span className="text-[10px] text-slate-400 block mb-1">Space Complexity</span>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-slate-400">{comparisonData.spaceComplexityBefore}</span>
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      <span className="text-purple-300 font-bold">{comparisonData.spaceComplexityAfter}</span>
                    </div>
                  </div>
                </div>

                {comparisonData.mainChanges && comparisonData.mainChanges.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-300">Key Modifications:</span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {comparisonData.mainChanges.map((ch, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{ch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Code Presentation: Split vs Tabs */}
            {comparisonViewMode === 'split' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left: Original Code */}
                <div className="rounded-xl bg-[#090c14] border border-surface-400/40 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#111622] border-b border-surface-400/30 text-xs font-mono text-slate-300">
                    <span className="font-semibold text-amber-300">ORIGINAL CODE</span>
                    <button
                      onClick={() => handleCopyCode(currentCode)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-3 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-80 leading-relaxed">
                    <code>{currentCode || '// Original code'}</code>
                  </pre>
                </div>

                {/* Right: Optimized Code */}
                <div className="rounded-xl bg-[#090c14] border border-surface-400/40 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#111622] border-b border-surface-400/30 text-xs font-mono text-slate-300">
                    <span className="font-semibold text-emerald-300">OPTIMIZED CODE</span>
                    <button
                      onClick={() => handleCopyCode(optimizedCode)}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-80 leading-relaxed">
                    <code>{optimizedCode || '// No refactored code generated'}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-[#090c14] border border-surface-400/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-[#111622] border-b border-surface-400/30">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setActiveCompTab('original')}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                        activeCompTab === 'original' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
                      }`}
                    >
                      ORIGINAL CODE
                    </button>
                    <button
                      onClick={() => setActiveCompTab('optimized')}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-colors ${
                        activeCompTab === 'optimized' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'
                      }`}
                    >
                      OPTIMIZED CODE
                    </button>
                  </div>
                  <button
                    onClick={() => handleCopyCode(activeCompTab === 'original' ? currentCode : optimizedCode)}
                    className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 text-xs flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed">
                  <code>{activeCompTab === 'original' ? currentCode : optimizedCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 7: AI TEST CASES (FEATURE 1) ================= */}
        {activeTab === 'testcases' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-200/50 p-3.5 rounded-xl border border-surface-400/30">
              <div>
                <h4 className="font-semibold text-slate-100 text-xs flex items-center space-x-1.5">
                  <FlaskConical className="w-4 h-4 text-cyan-400" />
                  <span>AI Test Case Suite</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Generates structured verification inputs, expected outputs, and edge cases.
                </p>
              </div>

              <button
                onClick={handleGenerateTestCases}
                disabled={isGeneratingTests || !currentCode}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-1.5 disabled:opacity-40 self-start sm:self-auto transition-all"
              >
                {isGeneratingTests ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Tests...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{activeTestCases ? 'Regenerate Tests' : 'Generate Test Cases'}</span>
                  </>
                )}
              </button>
            </div>

            {testsError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {testsError}
              </div>
            )}

            {/* Test Cases List */}
            {activeTestCases && activeTestCases.length > 0 ? (
              <div className="space-y-3">
                {activeTestCases.map((tc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-xs flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] flex items-center justify-center border border-cyan-500/30">
                          {tc.testCaseNumber || idx + 1}
                        </span>
                        <span>Test Case {tc.testCaseNumber || idx + 1}</span>
                      </span>
                      <Badge variant={tc.isEdgeCase ? 'warning' : 'cyan'} size="sm">
                        {tc.isEdgeCase ? 'Edge Case' : 'Standard Case'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-[#090c14] border border-surface-400/30">
                        <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Input:</span>
                        <span className="text-slate-200">{formatDisplayValue(tc.input)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#090c14] border border-surface-400/30">
                        <span className="text-[10px] text-slate-400 font-sans block mb-0.5">Expected Output:</span>
                        <span className="text-emerald-300 font-bold">{formatDisplayValue(tc.expected)}</span>
                      </div>
                    </div>

                    {tc.explanation && (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        <span className="text-slate-300 font-medium">Why: </span>
                        {tc.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : !isGeneratingTests && (
              <div className="p-8 rounded-xl bg-surface-200/40 border border-surface-400/30 text-center space-y-3">
                <FlaskConical className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click <strong className="text-cyan-300">"Generate Test Cases"</strong> above to produce automated verification suites tailored to this function.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 8: CODE EXPLANATION MODES (FEATURE 3) ================= */}
        {activeTab === 'explanation' && (
          <div className="space-y-4">
            {/* Mode Selectors */}
            <div className="p-4 rounded-xl bg-surface-200/50 border border-surface-400/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-slate-100 text-xs">Explanation Mode</h4>
                  <p className="text-[11px] text-slate-400">Choose your preferred technical depth level</p>
                </div>
                <div className="flex bg-surface-100 rounded-lg p-0.5 border border-surface-400/40 text-xs">
                  {['beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleExplainCode(lvl)}
                      className={`px-3 py-1 rounded-md font-medium capitalize transition-colors ${
                        explanationLevel === lvl ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {explanationError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {explanationError}
              </div>
            )}

            {/* Explanation Content */}
            {isExplaining ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin mx-auto" />
                <p>Generating {explanationLevel} explanation with AI...</p>
              </div>
            ) : explanationData ? (
              <div className="space-y-4">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-brand-400 tracking-wider">
                    {explanationData.level?.toUpperCase()} SUMMARY
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {explanationData.summary}
                  </p>
                </div>

                {/* Key Concepts */}
                {explanationData.keyConcepts && explanationData.keyConcepts.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-slate-300">Key Concepts:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {explanationData.keyConcepts.map((kc, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-surface-100 border border-surface-400/40 text-slate-300 text-[11px]"
                        >
                          {kc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Explanation */}
                <div className="p-4 rounded-xl bg-surface-200/60 border border-surface-400/40 space-y-2">
                  <span className="text-xs font-semibold text-slate-200">Detailed Walkthrough:</span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {explanationData.explanation}
                  </p>
                </div>

                {/* Step-by-Step Breakdown */}
                {explanationData.stepByStep && explanationData.stepByStep.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-200">Step-by-Step Logic Flow:</span>
                    <div className="space-y-2">
                      {explanationData.stepByStep.map((st, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-surface-200/40 border border-surface-400/30 flex items-start space-x-2.5"
                        >
                          <span className="w-5 h-5 rounded bg-brand-500/20 text-brand-300 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5 border border-brand-500/30">
                            {st.step || idx + 1}
                          </span>
                          <div className="space-y-0.5">
                            <h5 className="font-semibold text-slate-200 text-xs">{st.title}</h5>
                            <p className="text-[11px] text-slate-400">{st.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights Box */}
                {explanationData.insights && (
                  <div className="p-3.5 rounded-xl bg-brand-950/30 border border-brand-500/30 flex items-start space-x-2.5 text-xs text-slate-300">
                    <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-brand-300">Core Takeaway: </span>
                      <span>{explanationData.insights}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-surface-200/40 border border-surface-400/30 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a mode above (<strong className="text-brand-300">Beginner, Intermediate, or Advanced</strong>) to generate tailored algorithmic insights.
                </p>
                <button
                  onClick={() => handleExplainCode(explanationLevel)}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand"
                >
                  Explain as {explanationLevel}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 9: AUTOMATIC DOCUMENTATION (FEATURE 5) ================= */}
        {activeTab === 'documentation' && (
          <div className="space-y-4">
            {/* Style Selector & Action */}
            <div className="p-4 rounded-xl bg-surface-200/50 border border-surface-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-semibold text-slate-100 text-xs flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-brand-400" />
                  <span>Documentation Style</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  {currentLang === 'javascript' && 'Generates standardized JSDoc comments'}
                  {currentLang === 'python' && 'Generates Sphinx / Google Docstrings'}
                  {currentLang === 'java' && 'Generates standard Javadoc comments'}
                  {(currentLang === 'c' || currentLang === 'cpp') && 'Generates Doxygen style documentation'}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={docStyle}
                  onChange={(e) => setDocStyle(e.target.value)}
                  className="bg-surface-100 border border-surface-400/50 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="simple">Simple</option>
                  <option value="professional">Professional</option>
                  <option value="developer">Developer Spec</option>
                </select>

                <button
                  onClick={() => handleGenerateDoc(docStyle)}
                  disabled={isGeneratingDoc || !currentCode}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-1.5 disabled:opacity-40 transition-all"
                >
                  {isGeneratingDoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Docs</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {docError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {docError}
              </div>
            )}

            {/* Documentation Presentation */}
            {isGeneratingDoc ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 text-brand-400 animate-spin mx-auto" />
                <p>Generating structured {docStyle} documentation...</p>
              </div>
            ) : docData ? (
              <div className="space-y-4">
                {/* Documented Code Viewer */}
                <div className="rounded-xl bg-[#090c14] border border-surface-400/40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#111622] border-b border-surface-400/30">
                    <span className="text-xs font-mono text-slate-300">
                      documented_source.{currentLang}
                    </span>
                    <button
                      onClick={() => handleCopyCode(docData.documentedCode || docData.documentation, 'doc')}
                      className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 text-xs flex items-center space-x-1 transition-colors"
                    >
                      {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDoc ? 'Copied' : 'Copy Documented Code'}</span>
                    </button>
                  </div>
                  <pre className="p-4 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-80">
                    <code>{docData.documentedCode || docData.documentation}</code>
                  </pre>
                </div>

                {/* Function Specs Table / Cards */}
                {docData.functions && docData.functions.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-semibold text-slate-200 text-xs">Function Specifications</h5>
                    {docData.functions.map((fn, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <code className="text-brand-300 font-bold font-mono">{fn.name}()</code>
                          <span className="text-[11px] font-mono text-cyan-300">
                            Returns: {fn.returns?.type || (typeof fn.returns === 'string' ? fn.returns : 'void')}
                          </span>
                        </div>
                        <p className="text-slate-300">{fn.description}</p>

                        {/* Params */}
                        {fn.parameters && fn.parameters.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Parameters:</span>
                            <div className="space-y-1 mt-1 font-mono text-[11px]">
                              {fn.parameters.map((p, pIdx) => (
                                <div key={pIdx} className="text-slate-300 flex items-start space-x-2">
                                  <span className="text-amber-300">@{p.name} ({p.type}):</span>
                                  <span className="font-sans text-slate-400">{p.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-surface-200/40 border border-surface-400/30 text-center space-y-3">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click <strong className="text-brand-300">"Generate Docs"</strong> to produce standard docstrings and JSDoc blocks for this code without modifying the original source.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
