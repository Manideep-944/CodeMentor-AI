import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-200 border border-surface-400/40 flex items-center justify-center mb-6 shadow-subtle">
        <Terminal className="w-8 h-8 text-brand-400" />
      </div>
      <h1 className="text-4xl font-extrabold text-white font-mono mb-2">404</h1>
      <h2 className="text-lg font-semibold text-slate-200 mb-2">Page Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The requested page does not exist in the CodeMentor AI workspace.
      </p>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-2 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Return Home</span>
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
