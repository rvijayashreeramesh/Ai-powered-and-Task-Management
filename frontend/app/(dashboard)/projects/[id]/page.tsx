'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectService } from '@/services/projects';
import { taskService } from '@/services/tasks';
import { copilotService } from '@/services/copilot';
import { Project, Task } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { ArrowLeft, Trash2, Wand2, X, Edit2, Search, MoreHorizontal, Calendar, CheckSquare, Clock, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import { TaskFormModal } from '@/components/TaskFormModal';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // AI Insights
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProjectData, setEditProjectData] = useState<Partial<Project>>({});
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [isGeneratedTasksModalOpen, setIsGeneratedTasksModalOpen] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Partial<Task>[]>([]);
  const [isSavingTasks, setIsSavingTasks] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [proj, taskList] = await Promise.all([
        projectService.getProject(id as string),
        taskService.getTasks(id as string)
      ]);
      setProject(proj);
      setTasks(taskList);
    } catch (err: any) {
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  useEffect(() => {
    if (project && tasks.length >= 0) {
      const fetchInsight = async () => {
        setLoadingInsight(true);
        try {
          const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
          // We reuse the dashboard suggestion endpoint for the project context
          const tip = await copilotService.getSuggestions(1, tasks.length, completedTasksCount);
          setInsight(tip);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingInsight(false);
        }
      };
      fetchInsight();
    }
  }, [project, tasks.length]);


  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(id as string);
      router.push('/projects');
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  const handleEditOpen = () => {
    if (project) {
      setEditProjectData({
        name: project.name,
        description: project.description || '',
        status: project.status
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditTaskOpen = (task: Task) => {
    setEditTaskData(task);
    setIsEditTaskModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    setIsDeletingTask(true);
    try {
      await taskService.deleteTask(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!project) return;
    setIsGeneratingTasks(true);
    try {
      const suggestedTasks = await copilotService.generateTasks(project.name, project.description || '');
      setGeneratedTasks(suggestedTasks);
      setIsGeneratedTasksModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to generate tasks');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const handleRemoveGeneratedTask = (index: number) => {
    setGeneratedTasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTasks = async () => {
    setIsSavingTasks(true);
    try {
      for (const t of generatedTasks) {
        await taskService.createTask({
          title: t.title || '',
          description: t.description || '',
          status: t.status || 'Todo',
          priority: t.priority || 'Medium',
          project_id: project!.id
        });
      }
      setIsGeneratedTasksModalOpen(false);
      setGeneratedTasks([]);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save generated tasks');
    } finally {
      setIsSavingTasks(false);
    }
  };

  // Derived State
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  
  // Fake overdue for visual purposes (we would normally check due_date against current date)
  const overdueTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length; 
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'All' ? true : t.status === statusFilter;
      const matchPriority = priorityFilter === 'All' ? true : t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      </div>
    );
  }
  if (error) return <ErrorState message={error} />;
  if (!project) return <ErrorState message="Project not found" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-6xl mx-auto">
      
      {/* Top Header & Breadcrumb */}
      <ScrollReveal>
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 font-medium">
          <Link href="/projects" className="hover:text-indigo-600 transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-slate-900">{project.name}</span>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
              <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'brand' : project.status === 'On Hold' ? 'warning' : 'default'} className="mt-1">
                {project.status}
              </Badge>
            </div>
            <p className="text-slate-600 text-lg leading-relaxed max-w-3xl">
              {project.description || 'No description provided.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="ghost" onClick={handleEditOpen} className="text-slate-600 hover:text-indigo-600 bg-white border border-slate-200">
              <Edit2 size={16} className="mr-2" /> Edit
            </Button>
            <Button variant="ghost" onClick={handleDelete} isLoading={isDeleting} className="text-slate-600 hover:text-red-600 hover:bg-red-50 bg-white border border-slate-200">
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
            <Button variant="primary" onClick={handleGenerateTasks} isLoading={isGeneratingTasks} className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20">
              <Sparkles size={16} className="mr-2" /> {isGeneratingTasks ? 'Gemini Generating...' : 'Gemini Tasks'}
            </Button>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Progress & Summary Cards */}
      <ScrollReveal delay={100}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full bg-slate-900 text-white border-none shadow-lg">
            <CardContent className="p-6 flex flex-col justify-center h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <h3 className="text-slate-300 text-sm font-medium mb-4 z-10">Project Progress</h3>
              <div className="flex items-end gap-2 mb-4 z-10">
                <span className="text-4xl font-bold">{progress}%</span>
                <span className="text-slate-400 mb-1">completed</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 z-10">
                <div className="h-2 rounded-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard title="Total Tasks" value={tasks.length} icon={<CheckSquare size={18} />} color="blue" />
          <SummaryCard title="Completed" value={completedTasks} icon={<CheckSquare size={18} />} color="emerald" />
          <SummaryCard title="In Progress" value={inProgressTasks} icon={<Clock size={18} />} color="amber" />
          <SummaryCard title="Overdue" value={overdueTasks} icon={<AlertCircle size={18} />} color="red" />
        </div>
      </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Task Section */}
        <div className="lg:col-span-2 space-y-6">
          <ScrollReveal delay={150}>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Tasks</h2>
            <Button variant="secondary" onClick={() => { setEditTaskData({ project_id: project.id }); setIsEditTaskModalOpen(true); }}>
              Add Task
            </Button>
          </div>

          {/* Task Filters */}
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                placeholder="Search tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <select 
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Task List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No tasks match your criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTasks.map(task => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="shrink-0 pt-0.5">
                         <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                          task.status === 'Completed' ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 hover:border-indigo-400'
                         }`}>
                           {task.status === 'Completed' && <CheckSquare size={12} />}
                         </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${task.status === 'Completed' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                            task.priority === 'High' ? 'bg-red-50 text-red-700' :
                            task.priority === 'Medium' ? 'bg-orange-50 text-orange-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>{task.priority}</span>
                          
                          <span className={`text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 pl-4">
                      {task.due_date && (
                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar size={14} />
                          {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditTaskOpen(task)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </ScrollReveal>
        </div>

        {/* Right Sidebar: AI Insights */}
        <div className="space-y-6">
          <ScrollReveal delay={200}>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-violet-600" />
            Gemini Project Insights
          </h2>
          
          <Card className="bg-gradient-to-br from-violet-50 via-white to-indigo-50/50 border-violet-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-400/5 rounded-full blur-2xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-4 border border-violet-200">
                <Sparkles size={20} />
              </div>
              
              {loadingInsight ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full bg-violet-200/50" />
                  <Skeleton className="h-4 w-5/6 bg-violet-200/50" />
                  <Skeleton className="h-4 w-4/6 bg-violet-200/50" />
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-violet-950 mb-2">Project Analysis</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {insight || "Your project is looking great. Keep up the good work and break down complex tasks if needed."}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          </ScrollReveal>
        </div>

      </div>

      {/* Modals */}
      <Modal isOpen={isGeneratedTasksModalOpen} onClose={() => setIsGeneratedTasksModalOpen(false)} title="Review Gemini Generated Tasks">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {generatedTasks.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No tasks generated. Try adding more detail to your project description.</p>
          ) : (
            generatedTasks.map((t, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex justify-between gap-4 group hover:border-indigo-200 transition-colors">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900 text-sm mb-1">{t.title}</h4>
                  <p className="text-xs text-slate-600 mb-3">{t.description}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-full">{t.priority} Priority</span>
                  </div>
                </div>
                <button onClick={() => handleRemoveGeneratedTask(idx)} className="text-slate-400 hover:text-red-500 h-fit p-1.5 rounded-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-4">
          <Button type="button" variant="ghost" onClick={() => setIsGeneratedTasksModalOpen(false)}>Cancel</Button>
          <Button type="button" variant="primary" onClick={handleSaveTasks} isLoading={isSavingTasks}>Save Approved Tasks</Button>
        </div>
      </Modal>

      <ProjectFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project"
        initialData={editProjectData}
        isLoading={isUpdatingProject}
        onSubmit={async (data) => {
          if (!project) return;
          setIsUpdatingProject(true);
          try {
            await projectService.updateProject(project.id, data);
            setIsEditModalOpen(false);
            fetchData();
          } catch (err: any) {
            alert(err.message || 'Failed to update project');
          } finally {
            setIsUpdatingProject(false);
          }
        }}
      />

      <TaskFormModal
        isOpen={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        title={editTaskData.id ? "Edit Task" : "New Task"}
        initialData={editTaskData}
        isLoading={isUpdatingTask}
        hideProjectSelect={true}
        onSubmit={async (data) => {
          setIsUpdatingTask(true);
          try {
            if (editTaskData.id) {
              await taskService.updateTask(editTaskData.id, data);
            } else {
              await taskService.createTask({ ...data, project_id: project.id } as any);
            }
            setIsEditTaskModalOpen(false);
            fetchData();
          } catch (err: any) {
            alert(err.message || 'Failed to save task');
          } finally {
            setIsUpdatingTask(false);
          }
        }}
      />
    </div>
  );
}

function SummaryCard({ title, value, icon, color }: { title: string, value: number, icon: any, color: 'blue' | 'emerald' | 'amber' | 'red' }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <Card className="hover:-translate-y-1 transition-transform duration-300">
      <CardContent className="p-4 sm:p-5">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
      </CardContent>
    </Card>
  );
}
