import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Terminal, 
  Sparkles, 
  Bug, 
  Zap, 
  Clock, 
  BookOpen, 
  Users, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Laptop,
  Cpu,
  Layers
} from 'lucide-react';
import Badge from '../components/common/Badge';

export const LandingPage = () => {
  const navigate = useNavigate();

  const featureCards = [
    {
      title: 'AI Code Review',
      description: 'Deep semantic review of code structure, naming conventions, and idiomatic syntax to build professional habits.',
      icon: Sparkles,
      tag: 'Phase 2',
      color: 'brand',
    },
    {
      title: 'Bug Detection',
      description: 'Identify edge-case traps, null dereferences, off-by-one errors, and syntax anomalies before runtime execution.',
      icon: Bug,
      tag: 'Phase 2',
      color: 'warning',
    },
    {
      title: 'Complexity Analysis',
      description: 'Derive algorithmic Big-O time and space complexity with step-by-step mathematical reasoning.',
      icon: Clock,
      tag: 'Phase 2',
      color: 'cyan',
    },
    {
      title: 'Code Optimization',
      description: 'Learn how to refactor brute-force algorithms into optimal solutions using dynamic programming, hash maps, and pointers.',
      icon: Zap,
      tag: 'Phase 2',
      color: 'purple',
    },
    {
      title: 'Learning Mode',
      description: 'Step-by-step pedagogical explanations breaking down complex data structures and CS fundamentals.',
      icon: BookOpen,
      tag: 'Future Phase',
      color: 'emerald',
    },
    {
      title: 'Interview Mode',
      description: 'Simulate real technical interviews with AI-driven follow-up questions, edge case stress-tests, and live hints.',
      icon: Users,
      tag: 'Future Phase',
      color: 'brand',
    },
  ];

  const languages = [
    { name: 'JavaScript', icon: '⚡' },
    { name: 'Python', icon: '🐍' },
    { name: 'Java', icon: '☕' },
    { name: 'C++', icon: '🚀' },
    { name: 'C', icon: '⚙️' },
    { name: 'TypeScript', icon: '🔷' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-surface-400/30">
        {/* Subtle background glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[250px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Phase 1 Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-surface-200/80 border border-brand-500/30 shadow-glow-brand mb-6 text-xs text-slate-200">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="font-semibold text-brand-300">Phase 1 Foundation Live:</span>
            <span className="text-slate-400">Monaco Editor & REST Backend Ready</span>
          </div>

          {/* Hero Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
            CODEMENTOR <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">AI</span>
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-slate-200 mb-4 tracking-tight">
            "Write. Analyze. Understand. Improve."
          </p>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            An intelligent coding mentor that helps you understand your code, identify problems, improve efficiency, and become a better programmer.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/mentor')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white font-semibold text-sm shadow-glow-brand hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 group"
            >
              <Terminal className="w-4 h-4" />
              <span>Start Coding</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/features')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-surface-200/90 hover:bg-surface-300 text-slate-200 hover:text-white border border-surface-400/60 font-semibold text-sm transition-all duration-150 flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Explore Features</span>
            </button>
          </div>

          {/* Supported Languages Ribbon */}
          <div className="mt-14 pt-8 border-t border-surface-400/20 max-w-3xl mx-auto">
            <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold block mb-4">
              Supported Environments & Languages
            </span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {languages.map((lang) => (
                <div
                  key={lang.name}
                  className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-surface-100 border border-surface-400/40 text-xs font-mono text-slate-300"
                >
                  <span>{lang.icon}</span>
                  <span>{lang.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURE CARDS SECTION */}
      <section className="py-20 bg-[#0c1018] border-b border-surface-400/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Comprehensive Mentorship Capabilities
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Designed to emulate 1-on-1 mentorship with senior software engineers and Computer Science professors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-xl bg-surface-100/90 border border-surface-400/40 hover:border-brand-500/40 transition-all duration-200 flex flex-col justify-between group shadow-subtle"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-200 border border-surface-400/40 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 text-brand-400" />
                      </div>
                      <Badge variant="default" size="sm">
                        {feat.tag}
                      </Badge>
                    </div>
                    <h3 className="text-base font-semibold text-slate-100 mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (PHASE 1 WORKFLOW) */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              How CodeMentor Works
            </h2>
            <p className="text-sm text-slate-400">
              A frictionless workflow built directly in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-surface-100 border border-surface-400/40 space-y-3">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 text-brand-400 font-bold flex items-center justify-center text-sm font-mono border border-brand-500/30">
                1
              </div>
              <h3 className="text-base font-semibold text-slate-100">Write or Paste Code</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use our integrated Monaco editor supporting JavaScript, Python, C, C++, and Java with full syntax highlighting.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-100 border border-surface-400/40 space-y-3">
              <div className="w-8 h-8 rounded-full bg-cyan-600/20 text-cyan-400 font-bold flex items-center justify-center text-sm font-mono border border-cyan-500/30">
                2
              </div>
              <h3 className="text-base font-semibold text-slate-100">Click Analyze Code</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send your code to our Express REST API backend which validates, formats, and manages analysis workflows.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface-100 border border-surface-400/40 space-y-3">
              <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-sm font-mono border border-purple-500/30">
                3
              </div>
              <h3 className="text-base font-semibold text-slate-100">Receive Detailed Feedback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect structured breakdowns for code quality, potential bugs, Big-O runtime bounds, and actionable improvements.
              </p>
            </div>
          </div>

          {/* Quick CTA Bottom */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 border border-surface-400/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                Ready to try the Phase 1 Workspace?
              </h3>
              <p className="text-xs text-slate-400">
                Test the Monaco editor, language switching, and backend validation now.
              </p>
            </div>
            <button
              onClick={() => navigate('/mentor')}
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-glow-brand transition-all whitespace-nowrap"
            >
              Open Code Mentor
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
