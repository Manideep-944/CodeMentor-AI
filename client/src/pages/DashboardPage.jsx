import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Code2, 
  CheckCircle2, 
  Award, 
  TrendingUp, 
  Sparkles, 
  Play, 
  History, 
  Terminal, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  User, 
  Bug, 
  Calendar,
  ExternalLink,
  Bookmark,
  Tag,
  Lightbulb,
  Activity,
  Zap,
  BarChart3
} from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { fetchAnalyses, fetchUserStats } from '../services/api';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const [historyRes, statsRes] = await Promise.all([
        fetchAnalyses({ limit: 10 }),
        fetchUserStats(),
      ]);

      if (isMounted) {
        if (historyRes.success) {
          setAnalyses(historyRes.data || []);
        }
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
        setLoading(false);
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Stats fallbacks
  const totalReviews = stats?.totalAnalyses ?? analyses.length;
  const reviewsThisWeek = stats?.analysesThisWeek ?? 0;
  const averageScore = stats?.averageQualityScore > 0 ? `${stats.averageQualityScore}/100` : '—';
  const totalBugs = stats?.totalBugsDetected ?? 0;
  const bookmarkedCount = stats?.bookmarkedCount ?? 0;
  const languageCounts = stats?.analysesByLanguage ?? {};
  const mostUsedTags = stats?.mostUsedTags ?? [];
  const codingInsights = stats?.codingInsights ?? [];
  const recentActivity = stats?.recentActivity ?? [];

  // Learning progress percentage
  const progressPercent = totalReviews > 0 ? Math.min(100, totalReviews * 5) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* 1. Dashboard Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-400/30">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user?.name || 'Developer'}
            </h1>
            <Badge variant="brand" size="sm">Phase 7 Ready</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track your coding trajectory, review AI test cases and explanations, and browse your bookmark collections.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => navigate('/history')}
            className="px-3.5 py-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-slate-200 text-xs font-semibold border border-surface-400/40 flex items-center space-x-1.5 transition-all"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Full History</span>
          </button>
          <button
            onClick={() => navigate('/mentor')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand flex items-center space-x-1.5 transition-all"
          >
            <Terminal className="w-4 h-4" />
            <span>Launch Workspace</span>
          </button>
        </div>
      </div>

      {/* 2. Statistics Cards Grid (Phase 7 Enhanced) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Analyses"
          value={totalReviews.toString()}
          subtitle={totalReviews > 0 ? `${totalReviews} lifetime code reviews` : 'No analyses recorded yet'}
          icon={Code2}
          color="brand"
        />
        <StatsCard
          title="This Week"
          value={reviewsThisWeek.toString()}
          subtitle={reviewsThisWeek > 0 ? `${reviewsThisWeek} analyses past 7 days` : '0 analyses this week'}
          icon={Calendar}
          color="cyan"
        />
        <StatsCard
          title="Average Quality"
          value={averageScore}
          subtitle={stats?.averageQualityScore > 0 ? `Across verified submissions` : 'Awaiting scored review'}
          icon={Award}
          color="purple"
        />
        <StatsCard
          title="Bookmarks & Bugs"
          value={`${bookmarkedCount} ★ / ${totalBugs} ⚠`}
          subtitle={`${bookmarkedCount} saved &bull; ${totalBugs} issues caught`}
          icon={Bookmark}
          color="emerald"
        />
      </div>

      {/* 3. YOUR CODING INSIGHTS (FEATURE 10) */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-950/30 via-surface-100 to-surface-100 border border-brand-500/30 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100">
                Your Coding Insights
              </h2>
              <p className="text-[11px] text-slate-400">
                Factual observations calculated from your stored submission history
              </p>
            </div>
          </div>
          <Badge variant="cyan" size="sm">Real-time Data</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {codingInsights.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              Submit code in the Code Mentor workspace to generate personalized coding insights.
            </div>
          ) : (
            codingInsights.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-surface-200/50 border border-surface-400/30 text-xs text-slate-200 flex items-start space-x-2.5 leading-relaxed"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                <span>{insight}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Main Dashboard Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Analyses, Languages & Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Analyses Section */}
          <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-brand-400" />
                <h2 className="text-base font-semibold text-slate-100">Recent Analyses</h2>
              </div>
              <Link
                to="/history"
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center space-x-1"
              >
                <span>View all ({totalReviews})</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin inline-block mr-2" />
                Loading history...
              </div>
            ) : analyses.length === 0 ? (
              <div className="py-10 text-center rounded-xl bg-surface-200/40 border border-surface-400/30 p-6 space-y-2">
                <Code2 className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-medium text-slate-300">No analyses available yet.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Submit code in the Code Mentor workspace to receive real AI reviews and record your history.
                </p>
                <button
                  onClick={() => navigate('/mentor')}
                  className="mt-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand inline-flex items-center space-x-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Start Coding</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-surface-400/30">
                {analyses.slice(0, 5).map((item, idx) => {
                  const itemScore = item.analysis?.codeQuality?.score;
                  const itemSummary = item.analysis?.summary || 'Analysis recorded.';
                  const itemTime = item.analysis?.timeComplexity?.worstCase || item.analysis?.timeComplexity?.notation || 'O(1)';
                  const itemBugs = item.analysis?.bugs?.length || 0;

                  return (
                    <div
                      key={item._id || idx}
                      onClick={() => navigate(`/analysis/${item._id}`)}
                      className="py-3.5 flex items-center justify-between gap-4 group cursor-pointer hover:bg-surface-200/40 px-2.5 -mx-2.5 rounded-xl transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-semibold text-brand-300 uppercase px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                            {item.language}
                          </span>
                          {typeof itemScore === 'number' && (
                            <Badge variant={itemScore >= 70 ? 'success' : 'warning'} size="sm">
                              {itemScore}/100
                            </Badge>
                          )}
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                            {itemTime}
                          </span>
                          {itemBugs > 0 && (
                            <span className="text-[10px] text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              {itemBugs} issue{itemBugs > 1 ? 's' : ''}
                            </span>
                          )}
                          {item.isBookmarked && (
                            <span className="text-amber-400 text-xs">★</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 truncate max-w-sm sm:max-w-md group-hover:text-white transition-colors">
                          {itemSummary}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Languages & Most Used Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Languages Distribution */}
            <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-4">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-brand-400" />
                <h2 className="text-base font-semibold text-slate-100">Languages</h2>
              </div>

              {Object.keys(languageCounts).length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No languages analyzed yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(languageCounts).map(([lang, count]) => {
                    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                    return (
                      <div key={lang} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-slate-300 uppercase font-semibold">{lang}</span>
                          <span className="text-slate-400">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-300 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Most Used Tags (Feature 7 & 9) */}
            <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-base font-semibold text-slate-100">Most Used Tags</h2>
                </div>
                <Badge variant="cyan" size="sm">{mostUsedTags.length} Active</Badge>
              </div>

              {mostUsedTags.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                  <p>No tags created yet.</p>
                  <p className="text-[11px] text-slate-500">Add tags like #algorithms or #interview in analysis details.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {mostUsedTags.map((item) => (
                    <span
                      key={item.tag}
                      onClick={() => navigate('/history')}
                      className="cursor-pointer px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center space-x-1.5 transition-colors"
                    >
                      <span>#{item.tag}</span>
                      <span className="text-[10px] bg-cyan-500/30 px-1.5 py-0.2 rounded-full font-bold">
                        {item.count}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Status */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-100 border border-surface-400/40 shadow-subtle space-y-4">
            <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Workspace Shortcuts</span>
            </h2>

            <div className="space-y-3">
              {/* Action 1: Analyze Code */}
              <button
                onClick={() => navigate('/mentor')}
                className="w-full p-3.5 rounded-xl bg-surface-200/80 hover:bg-surface-300 text-left border border-surface-400/40 group transition-all duration-150 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Code Mentor Workspace
                    </h3>
                    <p className="text-[11px] text-slate-400">AI analysis & test case generation</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 2: View History */}
              <button
                onClick={() => navigate('/history')}
                className="w-full p-3.5 rounded-xl bg-surface-200/80 hover:bg-surface-300 text-left border border-surface-400/40 group transition-all duration-150 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Analysis History & Bookmarks
                    </h3>
                    <p className="text-[11px] text-slate-400">Filter tags & saved bookmarks</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 3: Profile */}
              <button
                onClick={() => navigate('/profile')}
                className="w-full p-3.5 rounded-xl bg-surface-200/80 hover:bg-surface-300 text-left border border-surface-400/40 group transition-all duration-150 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200 group-hover:text-white">
                      Developer Profile
                    </h3>
                    <p className="text-[11px] text-slate-400">Manage account & credentials</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Local AI Engine Status Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-950/40 to-surface-100 border border-brand-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-brand-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Ollama AI Qwen2.5 Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Test case generation, bug explanations, multi-level explanations, code documentation, and side-by-side optimization diffs are powered locally with zero cloud API keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
