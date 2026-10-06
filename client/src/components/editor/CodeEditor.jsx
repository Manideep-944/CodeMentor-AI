import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  RotateCcw, 
  Trash2, 
  Copy, 
  Check, 
  Code, 
  FileCode2, 
  Maximize2,
  Sparkles,
  Play
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

export const CodeEditor = ({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onClear,
  onReset,
  onAnalyze,
  isAnalyzing = false,
}) => {
  const [copied, setCopied] = React.useState(false);
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentLangConfig = SUPPORTED_LANGUAGES.find((l) => l.id === language) || SUPPORTED_LANGUAGES[0];

  const lineCount = code ? code.split('\n').length : 0;
  const charCount = code ? code.length : 0;

  return (
    <div className="flex flex-col h-full bg-[#0d111a] rounded-xl border border-surface-400/40 shadow-xl overflow-hidden">
      {/* Editor Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#111622] border-b border-surface-400/40 gap-2">
        {/* Left: Language Selector & File Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface-300/60 border border-surface-400/40 text-xs text-slate-300 font-mono">
            <FileCode2 className="w-3.5 h-3.5 text-brand-400" />
            <span>workspace{currentLangConfig.extension}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <label htmlFor="language-select" className="text-xs text-slate-400 font-medium">
              Language:
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-surface-200 border border-surface-400/60 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono cursor-pointer transition-colors"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-surface-100 text-slate-200">
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions (Clear, Reset, Copy, Analyze) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            title="Copy Code"
            className="p-1.5 rounded-lg bg-surface-200/80 hover:bg-surface-300 text-slate-300 hover:text-white border border-surface-400/30 text-xs flex items-center space-x-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onReset}
            title="Reset to default template"
            className="p-1.5 rounded-lg bg-surface-200/80 hover:bg-surface-300 text-slate-300 hover:text-white border border-surface-400/30 text-xs flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={onClear}
            title="Clear editor"
            className="p-1.5 rounded-lg bg-surface-200/80 hover:bg-surface-300 text-slate-300 hover:text-rose-300 border border-surface-400/30 text-xs flex items-center space-x-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <div className="h-4 w-px bg-surface-400/40 mx-1" />

          {/* Analyze Code Action Button */}
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !code || code.trim().length === 0}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white text-xs font-semibold shadow-glow-brand hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all"
          >
            {isAnalyzing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-brand-200" />
                <span>Analyze Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Workspace */}
      <div className="relative flex-1 min-h-[380px] w-full">
        <Editor
          height="100%"
          language={currentLangConfig.monacoLang}
          value={code}
          theme="vs-dark"
          onChange={(newVal) => onCodeChange(newVal || '')}
          onMount={handleEditorDidMount}
          options={{
            selectOnLineNumbers: true,
            roundedSelection: true,
            readOnly: false,
            cursorStyle: 'line',
            automaticLayout: true,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
            tabSize: 2,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            smoothScrolling: true,
          }}
          loading={
            <div className="h-full flex items-center justify-center bg-[#0d111a] text-slate-400 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading Monaco Editor...</span>
              </div>
            </div>
          }
        />
      </div>

      {/* Editor Status Bar Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#090c14] border-t border-surface-400/30 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center space-x-3">
          <span>{currentLangConfig.name}</span>
          <span className="text-slate-600">•</span>
          <span>UTF-8</span>
          <span className="text-slate-600">•</span>
          <span>Spaces: 2</span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Lines: {lineCount}</span>
          <span className="text-slate-600">•</span>
          <span>Chars: {charCount}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
