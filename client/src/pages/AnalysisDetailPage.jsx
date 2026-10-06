import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Trash2, 
  Copy, 
  Check, 
  Terminal, 
  Calendar, 
  AlertTriangle, 
  Loader2, 
  Code2, 
  History,
  CheckCircle2,
  Bookmark,
  Tag,
  Plus,
  X,
  Download,
  Share2
} from 'lucide-react';
import { 
  fetchAnalysisById, 
  deleteAnalysis, 
  bookmarkAnalysis, 
  updateAnalysisTags 
} from '../services/api';
import AnalysisPanel from '../components/editor/AnalysisPanel';
import Badge from '../components/common/Badge';
import { downloadReport } from '../utils/reportGenerator';

const QUICK_TAG_SUGGESTIONS = [
  'algorithms',
  'bugs',
  'interview',
  'practice',
  'project',
  'important',
];

export const AnalysisDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analysisRecord, setAnalysisRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Phase 7: Bookmark & Tag states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [tagMessage, setTagMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAnalysis = async () => {
      setLoading(true);
      setError(null);
      const res = await fetchAnalysisById(id);
      if (isMounted) {
        if (res.success && res.data) {
          setAnalysisRecord(res.data);
          setIsBookmarked(Boolean(res.data.isBookmarked));
          setTags(Array.isArray(res.data.tags) ? res.data.tags : []);
        } else {
          setError(res.error || 'Analysis record not found or access denied.');
        }
        setLoading(false);
      }
    };

    if (id) {
      loadAnalysis();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleCopyCode = () => {
    if (!analysisRecord?.code) return;
    navigator.clipboard.writeText(analysisRecord.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleBookmark = async () => {
    if (!id || isTogglingBookmark) return;
    setIsTogglingBookmark(true);
    const newStatus = !isBookmarked;
    setIsBookmarked(newStatus);

    const res = await bookmarkAnalysis(id, newStatus);
    setIsTogglingBookmark(false);

    if (!res.success) {
      // Revert on failure
      setIsBookmarked(!newStatus);
    }
  };

  const handleAddTag = async (tagToAdd) => {
    const clean = String(tagToAdd).trim().toLowerCase();
    if (!clean || tags.includes(clean) || tags.length >= 10 || clean.length > 30) {
      return;
    }

    const updatedTags = [...tags, clean];
    setTags(updatedTags);
    setNewTagInput('');
    setIsUpdatingTags(true);

    const res = await updateAnalysisTags(id, updatedTags);
    setIsUpdatingTags(false);
    if (res.success) {
      setTagMessage('Tags updated');
      setTimeout(() => setTagMessage(''), 2000);
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    setTags(updatedTags);
    setIsUpdatingTags(true);

    const res = await updateAnalysisTags(id, updatedTags);
    setIsUpdatingTags(false);
    if (res.success) {
      setTagMessage('Tag removed');
      setTimeout(() => setTagMessage(''), 2000);
    }
  };

  const handleDownload = (fmt) => {
    if (!analysisRecord) return;
    downloadReport({
      ...analysisRecord,
      isBookmarked,
      tags,
    }, fmt);
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setIsDeleting(true);
    const res = await deleteAnalysis(id);
    setIsDeleting(false);
    if (res.success) {
      navigate('/history');
    } else {
      setError(res.error || 'Failed to delete analysis record.');
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading analysis details...</p>
      </div>
    );
  }

  if (error || !analysisRecord) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Analysis Not Found</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          {error || 'The requested analysis record does not exist or you do not have permission to view it.'}
        </p>
        <div className="pt-2 flex items-center justify-center space-x-3">
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2.5 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Return to History</span>
          </button>
          <button
            onClick={() => navigate('/mentor')}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-2 transition-colors"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch Workspace</span>
          </button>
        </div>
      </div>
    );
  }

  const { code, language, analysis, createdAt } = analysisRecord;
  const score = analysis?.codeQuality?.score;
  const lineCount = code ? code.split('\n').length : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-400/30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/history')}
            className="p-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-300 hover:text-white border border-surface-400/40 transition-colors"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Analysis Report
              </h1>
              <span className="text-xs font-mono font-bold text-brand-300 uppercase px-2.5 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/30">
                {language}
              </span>
              {typeof score === 'number' && (
                <Badge variant={score >= 70 ? 'success' : 'warning'} size="sm">
                  Score: {score}/100
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {createdAt
                  ? new Date(createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent'}
              </span>
              <span>&bull;</span>
              <span>{lineCount} lines</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Bookmark, Download Report, Workspace, Delete */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Bookmark Toggle */}
          <button
            onClick={handleToggleBookmark}
            disabled={isTogglingBookmark}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              isBookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-surface-200 hover:bg-surface-300 text-slate-300 border-surface-400/40'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this Analysis'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          {/* Download Report Button */}
          <button
            onClick={() => handleDownload('html')}
            className="px-3.5 py-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-semibold border border-surface-400/40 flex items-center space-x-1.5 transition-colors"
            title="Download formatted HTML Report"
          >
            <Download className="w-3.5 h-3.5 text-brand-400" />
            <span>Download Report</span>
          </button>

          <button
            onClick={() => navigate('/mentor')}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open in Workspace</span>
          </button>

          <button
            onClick={() => setShowDeleteDialog(true)}
            className="px-3 py-2 rounded-xl bg-surface-200 hover:bg-rose-500/20 text-rose-300 border border-surface-400/40 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* TAGS MANAGER (FEATURE 7) */}
      <div className="p-4 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Analysis Tags
            </h3>
            {tagMessage && (
              <span className="text-[11px] text-emerald-400 font-medium animate-fade-in">
                ✓ {tagMessage}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {tags.length}/10 tags &bull; Tag topics, algorithms, or practice areas
          </span>
        </div>

        {/* Current Tag Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono"
            >
              <span>#{t}</span>
              <button
                onClick={() => handleRemoveTag(t)}
                className="hover:text-rose-400 p-0.5 rounded transition-colors"
                title={`Remove tag #${t}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Add Tag Input */}
          {tags.length < 10 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTag(newTagInput);
              }}
              className="inline-flex items-center space-x-1"
            >
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="+ Add tag..."
                className="px-2.5 py-1 text-xs rounded-lg bg-surface-200 border border-surface-400/50 text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono w-28"
                maxLength={30}
              />
            </form>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-500">Suggested:</span>
          {QUICK_TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).slice(0, 5).map((sug) => (
            <button
              key={sug}
              onClick={() => handleAddTag(sug)}
              className="px-2 py-0.5 rounded-md bg-surface-200 hover:bg-surface-300 text-slate-400 hover:text-slate-200 border border-surface-400/30 font-mono transition-colors"
            >
              +{sug}
            </button>
          ))}
        </div>
      </div>

      {/* Code Snippet Card */}
      <div className="rounded-2xl bg-[#090c14] border border-surface-400/40 overflow-hidden shadow-subtle">
        <div className="px-4 py-3 bg-[#111622] border-b border-surface-400/30 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
            <Code2 className="w-4 h-4 text-brand-400" />
            <span>analyzed_source.{language}</span>
            <span className="text-slate-500">({lineCount} lines)</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-300 text-slate-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
          >
            {copiedCode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Source</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto max-h-72 leading-relaxed selection:bg-brand-500">
          <code>{code}</code>
        </pre>
      </div>

      {/* Detailed Analysis Panel Breakdown (Tabs: Overview, Quality, Bugs, Complexity, Suggestions, Optimized, Test Cases, Explanation, Documentation) */}
      <div className="min-h-[500px]">
        <AnalysisPanel
          analysisResult={analysisRecord}
          isAnalyzing={false}
          error={null}
          sourceCode={code}
          language={language}
          isBookmarked={isBookmarked}
          onBookmarkToggle={handleToggleBookmark}
        />
      </div>

      {/* MODAL: Confirm Delete Dialog */}
      {showDeleteDialog && (
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
                onClick={() => setShowDeleteDialog(false)}
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

export default AnalysisDetailPage;
