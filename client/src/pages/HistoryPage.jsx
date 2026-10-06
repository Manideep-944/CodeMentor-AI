import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  History, 
  Trash2, 
  Eye, 
  Search, 
  Terminal, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Code2, 
  X, 
  ArrowRight,
  Loader2,
  Bookmark,
  Tag,
  Download,
  Filter
} from 'lucide-react';
import Badge from '../components/common/Badge';
import { fetchAnalyses, deleteAnalysis, bookmarkAnalysis } from '../services/api';
import { downloadReport } from '../utils/reportGenerator';

export const HistoryPage = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const navigate = useNavigate();

  const loadHistory = async () => {
    setLoading(true);
    const res = await fetchAnalyses();
    if (res.success) {
      setAnalyses(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleToggleBookmark = async (e, item) => {
    e.stopPropagation();
    const newStatus = !item.isBookmarked;

    // Optimistic UI update
    setAnalyses((prev) =>
      prev.map((a) => (a._id === item._id ? { ...a, isBookmarked: newStatus } : a))
    );

    const res = await bookmarkAnalysis(item._id, newStatus);
    if (!res.success) {
      // Revert on failure
      setAnalyses((prev) =>
        prev.map((a) => (a._id === item._id ? { ...a, isBookmarked: !newStatus } : a))
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const res = await deleteAnalysis(deleteTargetId);
    setIsDeleting(false);
    if (res.success) {
      setAnalyses((prev) => prev.filter((item) => item._id !== deleteTargetId));
      setDeleteTargetId(null);
      setFeedbackMsg('Analysis deleted successfully.');
      setTimeout(() => setFeedbackMsg(''), 3000);
    }
  };

  // Collect all unique tags across user's analyses
  const allUniqueTags = Array.from(
    new Set(
      analyses.flatMap((a) => (Array.isArray(a.tags) ? a.tags : []))
    )
  ).filter(Boolean);

  const filteredAnalyses = analyses.filter((item) => {
    // Bookmark filter
    if (showBookmarkedOnly && !item.isBookmarked) return false;

    // Language filter
    const matchesLang =
      selectedLanguage === 'all' || item.language?.toLowerCase() === selectedLanguage.toLowerCase();
    if (!matchesLang) return false;

    // Tag filter
    if (selectedTag !== 'all') {
      const itemTags = Array.isArray(item.tags) ? item.tags : [];
      if (!itemTags.includes(selectedTag.toLowerCase())) return false;
    }

    // Search filter
    const summaryText = item.analysis?.summary || '';
    const codeSnippet = item.code || '';
    const itemTagsStr = (Array.isArray(item.tags) ? item.tags : []).join(' ');
    const matchesSearch =
      summaryText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      codeSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemTagsStr.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-400/30">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-500/40 flex items-center justify-center">
              <History className="w-5 h-5 text-brand-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Personal Analysis History
            </h1>
            <Badge variant="brand" size="sm">{analyses.length} Total</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review past code evaluations, filter by bookmarks & tags, and download inspection reports.
          </p>
        </div>

        <button
          onClick={() => navigate('/mentor')}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-2 self-start sm:self-auto transition-all"
        >
          <Terminal className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Success Feedback Alert */}
      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, summary, or #tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-100 border border-surface-400/50 text-slate-200 text-xs focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder:text-slate-500"
            />
          </div>

          {/* Bookmarks Toggle Pill & Language Filter */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Bookmark Filter Toggle */}
            <button
              onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 border transition-all ${
                showBookmarkedOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-surface-100 text-slate-400 hover:text-slate-200 border-surface-400/40'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showBookmarkedOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Bookmarks Only</span>
            </button>

            {/* Language Filter */}
            <div className="flex flex-wrap items-center space-x-1 bg-surface-100 p-0.5 rounded-lg border border-surface-400/40">
              {[
                { id: 'all', label: 'All' },
                { id: 'javascript', label: 'JavaScript' },
                { id: 'python', label: 'Python' },
                { id: 'java', label: 'Java' },
                { id: 'cpp', label: 'C++' },
                { id: 'c', label: 'C' },
                { id: 'typescript', label: 'TypeScript' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLanguage(lang.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    selectedLanguage === lang.id
                      ? 'bg-brand-600 text-white shadow-glow-brand'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tag Filters Bar (if tags exist) */}
        {allUniqueTags.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs py-1">
            <div className="flex items-center space-x-1 text-slate-400 mr-1 shrink-0">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tags:</span>
            </div>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] transition-colors shrink-0 ${
                selectedTag === 'all'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-surface-100 text-slate-400 hover:text-slate-200 border border-surface-400/30'
              }`}
            >
              All Tags
            </button>
            {allUniqueTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? 'all' : t)}
                className={`px-2.5 py-0.5 rounded-md font-mono text-[11px] transition-colors shrink-0 ${
                  selectedTag === t
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-sm'
                    : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 space-y-3">
          <Loader2 className="w-7 h-7 text-brand-400 animate-spin mx-auto" />
          <p>Loading your personal analysis history...</p>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface-100 border border-surface-400/40 p-8 space-y-3">
          <Code2 className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">
            {searchTerm || selectedLanguage !== 'all' || showBookmarkedOnly || selectedTag !== 'all'
              ? 'No matching analyses found'
              : 'No analyses yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || selectedLanguage !== 'all' || showBookmarkedOnly || selectedTag !== 'all'
              ? 'Try adjusting your search terms or active filters.'
              : 'Analyze your first piece of code in the Code Mentor workspace to save records.'}
          </p>
          <button
            onClick={() => navigate('/mentor')}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand inline-flex items-center space-x-2 mt-2"
          >
            <span>Open Code Mentor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAnalyses.map((item) => {
            const score = item.analysis?.codeQuality?.score;
            const summary = item.analysis?.summary || 'Analysis completed.';
            const timeComp = item.analysis?.timeComplexity?.worstCase || item.analysis?.timeComplexity?.notation || 'O(1)';
            const spaceComp = item.analysis?.spaceComplexity?.worstCase || item.analysis?.spaceComplexity?.notation || 'O(1)';
            const bugCount = item.analysis?.bugs?.length || 0;
            const itemTags = Array.isArray(item.tags) ? item.tags : [];

            return (
              <div
                key={item._id}
                className="p-5 rounded-xl bg-surface-100 border border-surface-400/40 hover:border-brand-500/40 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-subtle group"
              >
                {/* Left: Summary & Metadata */}
                <div 
                  onClick={() => navigate(`/analysis/${item._id}`)}
                  className="space-y-2 flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-300 uppercase px-2.5 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/30">
                      {item.language}
                    </span>
                    {typeof score === 'number' && (
                      <Badge variant={score >= 70 ? 'success' : 'warning'} size="sm">
                        Score: {score}/100
                      </Badge>
                    )}
                    <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Time: {timeComp}
                    </span>
                    <span className="text-[11px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Space: {spaceComp}
                    </span>
                    {bugCount > 0 && (
                      <span className="text-[11px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        {bugCount} Issue{bugCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-medium group-hover:text-white transition-colors">
                    {summary}
                  </p>

                  {/* Tags & Date footer */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono pt-1">
                    <span>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                    </span>
                    <span>•</span>
                    <span>{item.code ? item.code.split('\n').length : 0} Lines</span>

                    {itemTags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex flex-wrap gap-1">
                          {itemTags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  {/* Bookmark quick toggle */}
                  <button
                    onClick={(e) => handleToggleBookmark(e, item)}
                    className={`p-2 rounded-lg border text-xs transition-colors ${
                      item.isBookmarked
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                        : 'bg-surface-200 hover:bg-surface-300 text-slate-400 hover:text-slate-200 border-surface-400/40'
                    }`}
                    title={item.isBookmarked ? 'Remove Bookmark' : 'Bookmark Analysis'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${item.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>

                  {/* Quick Report Download */}
                  <button
                    onClick={() => downloadReport(item, 'html')}
                    className="p-2 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 hover:text-white border border-surface-400/40 text-xs transition-colors"
                    title="Download Report"
                  >
                    <Download className="w-3.5 h-3.5 text-brand-400" />
                  </button>

                  {/* View Details */}
                  <button
                    onClick={() => navigate(`/analysis/${item._id}`)}
                    className="px-3 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-200 hover:text-white border border-surface-400/50 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-400" />
                    <span>View</span>
                  </button>

                  {/* Delete Record */}
                  <button
                    onClick={() => setDeleteTargetId(item._id)}
                    className="p-2 rounded-lg bg-surface-200 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-surface-400/40 text-xs transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Confirm Delete Dialog */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-100 border border-rose-500/40 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Analysis Record?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this analysis? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
