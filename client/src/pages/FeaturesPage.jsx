import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Bug, 
  Clock, 
  Github, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Layers,
  Code2
} from 'lucide-react';
import Badge from '../components/common/Badge';

export const FeaturesPage = () => {
  const navigate = useNavigate();

  const phase1Features = [
    {
      title: 'Monaco Code Editor',
      status: 'Implemented',
      description: 'Professional browser-based editor featuring syntax highlighting, line numbers, shortcuts, and themes.',
      badge: 'Active in Phase 1',
      badgeVariant: 'success',
    },
    {
      title: 'Multi-Language Support (6 Languages)',
      status: 'Implemented',
      description: 'Built-in support with template boilerplates for JavaScript, Python, Java, C++, C, and TypeScript.',
      badge: 'Active in Phase 7.5',
      badgeVariant: 'success',
    },
    {
      title: 'Backend Validation & REST APIs',
      status: 'Implemented',
      description: 'Express endpoints (GET /api/health, POST /api/code/analyze, GET /api/analyses) with error handling.',
      badge: 'Active in Phase 1',
      badgeVariant: 'success',
    },
    {
      title: 'MongoDB Schema Design',
      status: 'Implemented',
      description: 'Database models for Code Analysis and User Profiles with offline resilience.',
      badge: 'Active in Phase 1',
      badgeVariant: 'success',
    },
  ];

  const futureRoadmap = [
    {
      phase: 'Phase 2',
      title: 'AI Code Review & Big-O Engine',
      items: [
        'Live Local AI (Ollama + Qwen2.5-Coder) model integration',
        'Automated time and space complexity derivation',
        'Syntax flaw, vulnerability, and bug detection',
        'Step-by-step code optimization advice',
      ],
      badge: 'Up Next',
      badgeVariant: 'brand',
    },
    {
      phase: 'Phase 3',
      title: 'Interactive Learning & Authentication',
      items: [
        'JWT user authentication & cloud history sync',
        'Interactive CS problem bank with hints',
        'Personalized skill progression dashboards',
        'Code diff visualizer for recommended refactors',
      ],
      badge: 'Planned',
      badgeVariant: 'cyan',
    },
    {
      phase: 'Phase 4',
      title: 'Mock Interviews & GitHub Analysis',
      items: [
        'Simulated technical whiteboard interview voice/text',
        'GitHub repository code quality auditing',
        'Exportable CS portfolio project analysis reports',
      ],
      badge: 'Future',
      badgeVariant: 'purple',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge variant="brand" size="md">Architecture & Roadmap</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Features & Implementation Plan
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Transparent breakdown of currently active Phase 1 features alongside our upcoming engineering milestones.
        </p>
      </div>

      {/* Phase 1 Delivered Features */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Phase 1 Deliverables (Active Now)
            </h2>
            <p className="text-xs text-slate-400">
              Foundational workspace, editor, and API infrastructure.
            </p>
          </div>
          <Badge variant="success" size="md">100% Complete</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phase1Features.map((feat) => (
            <div
              key={feat.title}
              className="p-5 rounded-xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">{feat.title}</h3>
                <Badge variant={feat.badgeVariant} size="sm">{feat.badge}</Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Future Roadmap */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
            Future Development Roadmap
          </h2>
          <p className="text-xs text-slate-400">
            Upcoming phases planned for subsequent releases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {futureRoadmap.map((item) => (
            <div
              key={item.phase}
              className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-400 uppercase">
                    {item.phase}
                  </span>
                  <Badge variant={item.badgeVariant} size="sm">
                    {item.badge}
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-slate-100">
                  {item.title}
                </h3>
                <ul className="space-y-2 text-xs text-slate-400">
                  {item.items.map((subItem, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                      <span>{subItem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-brand-950/60 to-surface-100 border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            Explore the Code Mentor Workspace
          </h3>
          <p className="text-xs text-slate-300">
            Write code and verify Phase 1 backend communication right now.
          </p>
        </div>
        <button
          onClick={() => navigate('/mentor')}
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-2 transition-all whitespace-nowrap"
        >
          <span>Open Workspace</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FeaturesPage;
