'use client';
import { useState, useEffect } from 'react';
import { projectService } from '@/services/projects';
import { taskService } from '@/services/tasks';
import { copilotService } from '@/services/copilot';
import { Card, CardContent } from '@/components/ui/Card';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart2, CheckSquare, FolderKanban, Sparkles, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Project, Task } from '@/types';

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [geminiTip, setGeminiTip] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const [proj, tsk] = await Promise.all([
          projectService.getProjects(),
          taskService.getTasks()
        ]);
        setProjects(proj);
        setTasks(tsk);

        const completed = tsk.filter(x => x.status === 'Completed').length;
        try {
          const tip = await copilotService.getSuggestions(proj.length, tsk.length, completed);
          setGeminiTip(tip);
        } catch {
          setGeminiTip("Keep consistent momentum across your active tasks to maintain peak project velocity.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'Todo').length;

  const highPriority = tasks.filter(t => t.priority === 'High').length;
  const medPriority = tasks.filter(t => t.priority === 'Medium').length;
  const lowPriority = tasks.filter(t => t.priority === 'Low').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto animate-in fade-in duration-500">
      <ScrollReveal>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-xs font-semibold text-violet-700 mb-2">
              <Sparkles size={14} className="text-violet-600" />
              <span>Powered by Google Gemini</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Analytics & Insights</h1>
            <p className="text-slate-500 mt-1">Deep dive into project velocity, task distribution, and AI health.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Metrics Row */}
      <ScrollReveal delay={100}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricBox title="Completion Rate" value={`${completionRate}%`} icon={<TrendingUp size={20} className="text-emerald-600" />} bg="bg-emerald-50" loading={loading} />
          <MetricBox title="Active Projects" value={projects.filter(p => p.status !== 'Completed').length} icon={<FolderKanban size={20} className="text-indigo-600" />} bg="bg-indigo-50" loading={loading} />
          <MetricBox title="Pending Tasks" value={todoTasks + inProgressTasks} icon={<Clock size={20} className="text-amber-600" />} bg="bg-amber-50" loading={loading} />
          <MetricBox title="High Priority" value={highPriority} icon={<AlertCircle size={20} className="text-red-600" />} bg="bg-red-50" loading={loading} />
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Distribution */}
        <div className="lg:col-span-2 space-y-6">
          <ScrollReveal delay={150}>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <BarChart2 size={20} className="text-indigo-600" /> Task Status Distribution
                </h2>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ProgressBar label="Completed" count={completedTasks} total={totalTasks} color="bg-emerald-500" />
                    <ProgressBar label="In Progress" count={inProgressTasks} total={totalTasks} color="bg-amber-500" />
                    <ProgressBar label="Todo" count={todoTasks} total={totalTasks} color="bg-slate-400" />
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Priority Breakdown */}
          <ScrollReveal delay={200}>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <CheckSquare size={20} className="text-violet-600" /> Priority Breakdown
                </h2>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ProgressBar label="High Priority" count={highPriority} total={totalTasks} color="bg-red-500" />
                    <ProgressBar label="Medium Priority" count={medPriority} total={totalTasks} color="bg-orange-500" />
                    <ProgressBar label="Low Priority" count={lowPriority} total={totalTasks} color="bg-blue-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>

        {/* Gemini AI Summary Card */}
        <div className="space-y-6">
          <ScrollReveal delay={250}>
            <Card className="bg-gradient-to-br from-violet-50 via-white to-indigo-50 border-violet-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/10 rounded-full blur-2xl"></div>
              <CardContent className="p-6 relative z-10">
                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-4 border border-violet-200">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-sm font-semibold text-violet-950 mb-2 uppercase tracking-wider">Gemini Velocity Insight</h3>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-violet-200/50" />
                    <Skeleton className="h-4 w-4/5 bg-violet-200/50" />
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {geminiTip || "Workspace productivity is on track. Focus your attention on high-priority items."}
                  </p>
                )}
              </CardContent>
            </Card>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ title, value, icon, bg, loading }: { title: string; value: any; icon: React.ReactNode; bg: string; loading: boolean }) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          {loading ? <Skeleton className="h-8 w-16 mt-1" /> : <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-center text-sm font-medium mb-1.5">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500">{count} ({pct}%)</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }}></div>
      </div>
    </div>
  );
}
