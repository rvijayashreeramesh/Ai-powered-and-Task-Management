'use client';
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { projectService } from '@/services/projects';
import { taskService } from '@/services/tasks';
import { copilotService } from '@/services/copilot';
import { Project, Task } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { 
  FolderKanban, 
  CheckSquare, 
  Activity, 
  Sparkles,
  Plus,
  ArrowUpRight,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [projData, taskData] = await Promise.all([
          projectService.getProjects(),
          taskService.getTasks()
        ]);
        setProjects(projData);
        setTasks(taskData);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (projects.length > 0 || tasks.length > 0) {
      const getTip = async () => {
        setLoadingSuggestion(true);
        try {
          const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
          const tip = await copilotService.getSuggestions(projects.length, tasks.length, completedTasksCount);
          setSuggestion(tip);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingSuggestion(false);
        }
      };
      getTip();
    }
  }, [projects.length, tasks.length]);

  const activeProjects = projects.filter(p => p.status !== 'Completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  
  const overallProgress = tasks.length > 0 
    ? Math.round((completedTasksCount / tasks.length) * 100)
    : 0;

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter(t => t.status === 'Completed').length;
    return Math.round((completed / projectTasks.length) * 100);
  };

  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Good morning, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Here's what's happening with your projects today.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/projects?new=true" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full gap-2">
              <Plus size={16} /> New Project
            </Button>
          </Link>
          <Link href="/ai-assistant" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 border-none">
              <Sparkles size={16} /> AI Assistant
            </Button>
          </Link>
        </div>
      </div>

      <ScrollReveal delay={100}>
      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          loading={loading}
          title="Total Projects"
          value={projects.length}
          trend="+2 this week"
          icon={<FolderKanban size={20} className="text-indigo-600" />}
          bgClass="bg-indigo-50"
        />
        <MetricCard 
          loading={loading}
          title="Total Tasks"
          value={tasks.length}
          trend="+12 this week"
          icon={<LayoutDashboard size={20} className="text-blue-600" />}
          bgClass="bg-blue-50"
        />
        <MetricCard 
          loading={loading}
          title="Completed Tasks"
          value={completedTasksCount}
          trend="+5 this week"
          icon={<CheckSquare size={20} className="text-emerald-600" />}
          bgClass="bg-emerald-50"
        />
        <MetricCard 
          loading={loading}
          title="Overall Progress"
          value={`${overallProgress}%`}
          trend="On track"
          icon={<Activity size={20} className="text-violet-600" />}
          bgClass="bg-violet-50"
        />
      </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Projects & Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          <ScrollReveal delay={150}>
          {/* Projects Progress */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Project Progress</h2>
              <Link href="/projects" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all</Link>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)
              ) : projects.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <FolderKanban className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                  <h3 className="text-sm font-medium text-slate-900">No active projects</h3>
                  <p className="text-sm text-slate-500 mt-1">Get started by creating a new project.</p>
                </div>
              ) : (
                projects.slice(0, 3).map(p => {
                  const progress = getProjectProgress(p.id);
                  const pTasks = tasks.filter(t => t.project_id === p.id);
                  
                  return (
                    <Card key={p.id} className="hover:border-slate-300 transition-colors group">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <Link href={`/projects/${p.id}`} className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors text-base flex items-center gap-2">
                              {p.name}
                              <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <div className="flex items-center gap-3 mt-1.5">
                              <Badge variant={p.status === 'Completed' ? 'success' : p.status === 'In Progress' ? 'brand' : 'default'}>
                                {p.status}
                              </Badge>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <CheckSquare size={12} /> {pTasks.length} tasks
                              </span>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-slate-700">{progress}%</span>
                        </div>
                        <ProgressBar progress={progress} size="sm" />
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </section>
          </ScrollReveal>

          <ScrollReveal delay={200}>
          {/* Recent Activity */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
              <Link href="/tasks" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View tasks</Link>
            </div>
            
            <Card>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  [1,2,3].map(i => <div key={i} className="p-4"><Skeleton className="h-10 w-full" /></div>)
                ) : tasks.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">No recent activity.</div>
                ) : (
                  tasks.slice(0, 4).map(t => (
                    <div key={t.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        t.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                        t.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status === 'Completed' ? <CheckSquare size={14} /> : <Clock size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{t.title}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {t.project_id ? projects.find(p => p.id === t.project_id)?.name || 'Unknown Project' : 'No Project'}
                        </p>
                      </div>
                      <Badge variant={t.priority === 'High' ? 'error' : t.priority === 'Medium' ? 'warning' : 'default'}>
                        {t.priority}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
          </ScrollReveal>

        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
          <ScrollReveal delay={250}>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-violet-600" /> 
              Gemini Productivity Insights
            </h2>
            
            <Card className="bg-gradient-to-b from-violet-50/50 to-white border-violet-100 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <CardContent className="p-5 sm:p-6 relative z-10">
                <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-violet-200/50">
                  <Sparkles size={20} />
                </div>
                
                {loadingSuggestion ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-violet-200/50" />
                    <Skeleton className="h-4 w-5/6 bg-violet-200/50" />
                    <Skeleton className="h-4 w-4/6 bg-violet-200/50" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-violet-950 mb-2">Workspace Analysis</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {suggestion || "Your workspace is looking great! You have a good balance of active projects and completed tasks. Keep up the momentum."}
                    </p>
                  </>
                )}

                <div className="mt-6 flex flex-col gap-2">
                  <Link href="/tasks" className="w-full">
                    <Button variant="primary" className="w-full bg-violet-600 hover:bg-violet-700 shadow-violet-600/20">
                      Review Priority Tasks
                    </Button>
                  </Link>
                  <Link href="/ai-assistant" className="w-full">
                    <Button variant="secondary" className="w-full border-violet-200 hover:bg-violet-50 hover:border-violet-300 text-violet-700">
                      Let Gemini Prioritize
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
          </ScrollReveal>
        </div>

      </div>
    </div>
  );
}

// Subcomponent for Metric Cards
function MetricCard({ title, value, trend, icon, bgClass, loading }: any) {
  return (
    <Card className="group hover:-translate-y-1 transition-transform duration-300 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-xl ${bgClass}`}>
            {icon}
          </div>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ArrowUpRight size={12} />
            {trend}
          </span>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        )}
        <p className="text-sm text-slate-500 font-medium">{title}</p>
      </CardContent>
    </Card>
  );
}
