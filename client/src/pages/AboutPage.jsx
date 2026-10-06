import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code2, 
  GraduationCap, 
  Terminal, 
  Cpu, 
  Clock, 
  Bug, 
  Sparkles, 
  Target, 
  BookOpen, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Badge from '../components/common/Badge';

export const AboutPage = () => {
  const navigate = useNavigate();

  const corePillars = [
    {
      title: 'Understand Programming Concepts',
      description: 'Bridging classroom theory with practical implementation across JavaScript, Python, Java, C++, C, and TypeScript.',
      icon: BookOpen,
      color: 'brand',
    },
    {
      title: 'Improve Code Quality',
      description: 'Instilling clean architecture, proper variable semantics, modular design, and industry-standard formatting.',
      icon: Sparkles,
      color: 'cyan',
    },
    {
      title: 'Learn Debugging & Root Cause Analysis',
      description: 'Moving beyond trial-and-error by understanding why defects occur, how edge cases trigger errors, and how to fix them.',
      icon: Bug,
      color: 'warning',
    },
    {
      title: 'Understand Algorithm Complexity',
      description: 'Demystifying Big-O time and space complexity with structured breakdowns of loop invariants and recursion trees.',
      icon: Clock,
      color: 'purple',
    },
    {
      title: 'Prepare for Technical Interviews',
      description: 'Developing algorithmic intuition, optimal problem breakdown, and concise code communication required by top engineering teams.',
      icon: Target,
      color: 'emerald',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Header / Mission */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 font-semibold">
          <GraduationCap className="w-4 h-4" />
          <span>Empowering Computer Science Students</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          About <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">CodeMentor AI</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          CodeMentor AI is an intelligent coding learning platform crafted specifically for Computer Science students and aspiring software engineers. 
          We believe mastering software engineering requires more than copy-pasting solutions — it demands deep comprehension of how code works, where it fails, and why efficiency matters.
        </p>
      </div>

      {/* Core Educational Pillars */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Our Core Objectives
          </h2>
          <p className="text-xs text-slate-400">
            Engineered to guide learners through the full spectrum of software craftsmanship.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {corePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className={`p-5 rounded-xl bg-surface-100 border border-surface-400/40 shadow-subtle flex items-start space-x-4 ${
                  idx === 4 ? 'md:col-span-2' : ''
                }`}
              >
                <div className="p-3 rounded-lg bg-surface-200 border border-surface-400/40 shrink-0">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-100">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase 1 Architecture Overview */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface-100 border border-surface-400/40 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-surface-400/30">
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">
              Phase 1 Engineering Status
            </h2>
          </div>
          <Badge variant="brand" size="md">Phase 1 Complete</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-surface-200/50 border border-surface-400/30 space-y-2">
            <h4 className="font-semibold text-slate-200">Frontend Layer</h4>
            <p className="text-slate-400 leading-relaxed">
              React 18, Vite, Tailwind CSS, and Monaco Editor supporting JavaScript, Python, Java, C++, C, and TypeScript.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-200/50 border border-surface-400/30 space-y-2">
            <h4 className="font-semibold text-slate-200">Backend API</h4>
            <p className="text-slate-400 leading-relaxed">
              Express.js REST architecture with validation, error management, and health diagnostic endpoints.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-200/50 border border-surface-400/30 space-y-2">
            <h4 className="font-semibold text-slate-200">Database & Models</h4>
            <p className="text-slate-400 leading-relaxed">
              Mongoose schemas designed for historical code analyses and extensible user profile metrics.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-surface-400/20 text-xs text-slate-400">
          <span>Ready to explore the workspace?</span>
          <button
            onClick={() => navigate('/mentor')}
            className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all flex items-center space-x-2"
          >
            <span>Launch Code Mentor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
