import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Github, Terminal, Layers, ShieldCheck, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-surface-400/30 bg-[#080b11] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/40 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-brand-400" />
              </div>
              <span className="font-bold text-base text-slate-100">
                CodeMentor AI
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-surface-300 text-slate-300 font-mono">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              An intelligent coding learning platform designed for Computer Science students and developers.
              Empowering better understanding of code semantics, algorithmic complexity, and debugging fundamentals.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              <span>Phase 1 Architecture — Ready for Phase 2 AI Integration</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-brand-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/mentor" className="hover:text-brand-400 transition-colors">Code Mentor Workspace</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-brand-400 transition-colors">Developer Dashboard</Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-brand-400 transition-colors">Features & Roadmap</Link>
              </li>
            </ul>
          </div>

          {/* Tech Stack Info */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Stack & Foundation
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                <span>React 18 + Vite</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Monaco Editor Integration</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Node.js & Express REST API</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>MongoDB Schema Design</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-surface-400/20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} CodeMentor AI. Built for Computer Science Excellence.
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/about" className="hover:text-slate-300 transition-colors">About</Link>
            <span className="text-slate-600">•</span>
            <Link to="/features" className="hover:text-slate-300 transition-colors">Roadmap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
