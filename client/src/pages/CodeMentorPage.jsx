import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CodeEditor from '../components/editor/CodeEditor';
import AnalysisPanel from '../components/editor/AnalysisPanel';
import { SUPPORTED_LANGUAGES, getLanguageById } from '../constants/languages';
import { analyzeCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Terminal, Layers, Info, UserCheck, Shield } from 'lucide-react';
import Badge from '../components/common/Badge';

export const CodeMentorPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(
    getLanguageById('javascript')?.defaultCode || ''
  );
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Handle language change
  const handleLanguageChange = (newLangId) => {
    setSelectedLanguage(newLangId);
    const langConfig = getLanguageById(newLangId);
    if (langConfig) {
      setCode(langConfig.defaultCode);
    }
    // Reset analysis panel on language change
    setAnalysisResult(null);
    setError(null);
  };

  // Handle Clear Code
  const handleClear = () => {
    setCode('');
    setAnalysisResult(null);
    setError(null);
  };

  // Handle Reset Code to language default
  const handleReset = () => {
    const langConfig = getLanguageById(selectedLanguage);
    if (langConfig) {
      setCode(langConfig.defaultCode);
    }
    setAnalysisResult(null);
    setError(null);
  };

  // Handle Analyze Code API call
  const handleAnalyze = async () => {
    if (!code || code.trim().length === 0) return;

    setIsAnalyzing(true);
    setError(null);

    const result = await analyzeCode(code, selectedLanguage);

    setIsAnalyzing(false);
    if (result.success) {
      setAnalysisResult(result.data);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-400/30">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/40 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-brand-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Code Mentor Workspace
            </h1>
            <Badge variant="brand" size="sm">Level 4 Workspace</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Write or paste algorithms across 6 core languages (JavaScript, Python, Java, C++, C, TypeScript). Receive real AI feedback, Big-O complexity, and optimization hints.
          </p>
        </div>

        {/* Auth status indicator & Phase Info */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2 text-xs text-emerald-300 bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-500/30">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saving as <strong className="font-semibold text-emerald-200">{user?.name}</strong></span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-400 bg-surface-100 px-3 py-1.5 rounded-xl border border-surface-400/40">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Guest Mode &bull; <Link to="/login" className="text-brand-300 hover:text-brand-200 font-semibold underline underline-offset-2">Sign in</Link> to save history</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-surface-100 px-3.5 py-1.5 rounded-xl border border-surface-400/40">
            <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
            <span>Local AI (Ollama)</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Editor + Analysis Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        {/* Left / Top: Code Editor Workspace (7 cols on large screens) */}
        <div className="lg:col-span-7 flex flex-col h-[560px] lg:h-[calc(100vh-14rem)] min-h-[480px]">
          <CodeEditor
            code={code}
            language={selectedLanguage}
            onCodeChange={setCode}
            onLanguageChange={handleLanguageChange}
            onClear={handleClear}
            onReset={handleReset}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Right / Bottom: Analysis Results Panel (5 cols on large screens) */}
        <div className="lg:col-span-5 flex flex-col h-[560px] lg:h-[calc(100vh-14rem)] min-h-[480px]">
          <AnalysisPanel
            analysisResult={analysisResult}
            isAnalyzing={isAnalyzing}
            error={error}
            sourceCode={code}
            language={selectedLanguage}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeMentorPage;
