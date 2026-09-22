'use client';
import { useEffect, useState, useMemo } from 'react';
import { taskService } from '@/services/tasks';
import { projectService } from '@/services/projects';
import { copilotService } from '@/services/copilot';
import { Task, Project } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/states/ErrorState';
import { Plus, Wand2, Edit2, Trash2, Search, X, CheckSquare, Calendar, FolderKanban, FilterX, User, ChevronDown } from 'lucide-react';
import { TaskFormModal } from '@/components/TaskFormModal';
import Link from 'next/link';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);

  // Edit Task States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const fetchTasksAndProjects = async () => {
    try {
      setLoading(true);
      const [taskData, projData] = await Promise.all([
        taskService.getTasks(),
        projectService.getProjects()
      ]);
      setTasks(taskData);
      setProjects(projData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndProjects();
  }, []);

  const handlePrioritize = async () => {
    if (tasks.length === 0) return;
    setIsPrioritizing(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'Completed');
      if (activeTasks.length === 0) {
        alert("No active tasks to prioritize.");
        setIsPrioritizing(false);
        return;
      }
      
      const prioritizedTasks = await copilotService.prioritizeTasks(activeTasks);
      
      for (const t of prioritizedTasks) {
        const originalTask = activeTasks.find(ot => ot.title === t.title);
        if (originalTask && originalTask.priority !== t.priority) {
          await taskService.updateTask(originalTask.id, { priority: t.priority });
        }
      }
      fetchTasksAndProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to auto-prioritize tasks');
    } finally {
      setIsPrioritizing(false);
    }
  };

  const handleEditOpen = (task: Task) => {
    setEditTaskData(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    setIsDeletingTask(true);
    try {
      await taskService.deleteTask(id);
      fetchTasksAndProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const newStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await taskService.updateTask(task.id, { status: newStatus });
    } catch (err: any) {
      alert('Failed to update task status');
      fetchTasksAndProjects(); // Revert on failure
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilter('All');
    setStatusFilter('All');
    setPriorityFilter('All');
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchProject = projectFilter === 'All' ? true : t.project_id === projectFilter;
      const matchStatus = statusFilter === 'All' ? true : t.status === statusFilter;
      const matchPriority = priorityFilter === 'All' ? true : t.priority === priorityFilter;
      
      return matchSearch && matchProject && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, projectFilter, statusFilter, priorityFilter]);

  if (error) return <ErrorState message={error} onRetry={fetchTasksAndProjects} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <ScrollReveal>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Tasks</h1>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base">Stay on top of your work.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="secondary" 
            onClick={handlePrioritize}
            isLoading={isPrioritizing}
            className="w-full sm:w-auto text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100 gap-2"
          >
            <Wand2 size={16} /> {isPrioritizing ? 'Gemini Prioritizing...' : 'Gemini Prioritize'}
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20">
            <Plus size={16} /> New Task
          </Button>
        </div>
      </div>
      </ScrollReveal>

      {/* Toolbar / Filters */}
      <ScrollReveal delay={100}>
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input 
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
          <select 
            className="h-10 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="All">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          
          <select 
            className="h-10 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          
          <select 
            className="h-10 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <Button 
            variant="ghost" 
            onClick={clearFilters} 
            className="h-10 px-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Clear filters"
          >
            <FilterX size={16} />
          </Button>
        </div>
      </div>
      </ScrollReveal>

      {/* Task List / Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 h-20">
              <Skeleton className="w-5 h-5 rounded" />
              <div className="flex-1"><Skeleton className="h-5 w-1/3 mb-2" /><Skeleton className="h-3 w-1/4" /></div>
              <Skeleton className="h-8 w-24 hidden sm:block" />
              <Skeleton className="h-8 w-24 hidden sm:block" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="pt-10 flex justify-center">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 max-w-lg w-full text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
              <CheckSquare size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No tasks found</h3>
            <p className="text-slate-500 mb-8">Get started by creating a new task and assigning it to a project.</p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus size={16} /> Create Task
            </Button>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
          <Search className="mx-auto h-10 w-10 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No matching tasks</h3>
          <p className="text-slate-500 mt-1">Try clearing your filters or adjusting your search.</p>
          <Button variant="ghost" onClick={clearFilters} className="mt-4 text-indigo-600">Clear Filters</Button>
        </div>
      ) : (
        <ScrollReveal delay={200}>
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-5 py-4 w-12 text-center"></th>
                  <th className="px-5 py-4 w-1/3">Task</th>
                  <th className="px-5 py-4">Project</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Due Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const project = projects.find(p => p.id === task.project_id);
                  const isCompleted = task.status === 'Completed';
                  
                  return (
                    <tr key={task.id} className={`group transition-all duration-300 ${isCompleted ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-5 py-4 text-center align-top pt-5">
                        <button 
                          onClick={() => handleToggleComplete(task)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${
                            isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 hover:border-indigo-400 bg-white'
                          }`}
                        >
                          <CheckSquare size={12} className={`transition-transform duration-200 ${isCompleted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
                        </button>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <p className={`font-semibold transition-all duration-300 ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900 group-hover:text-indigo-700'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className={`text-sm mt-1 line-clamp-1 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {project ? (
                          <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors bg-slate-100 hover:bg-indigo-50 px-2 py-1 rounded-md">
                            <FolderKanban size={14} />
                            <span className="truncate max-w-[120px]">{project.name}</span>
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">No Project</span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${
                          task.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                          task.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Badge variant={isCompleted ? 'success' : task.status === 'In Progress' ? 'brand' : 'default'}>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 align-top">
                        {task.due_date ? (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm w-fit">
                            <Calendar size={13} className={isCompleted ? "text-slate-400" : "text-indigo-500"} />
                            <span className={isCompleted ? "text-slate-400 line-through" : ""}>
                              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditOpen(task)} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-md hover:border-indigo-300 hover:bg-indigo-50 shadow-sm transition-colors" title="Edit Task">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteTask(task.id)} disabled={isDeletingTask} className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-red-600 rounded-md hover:border-red-300 hover:bg-red-50 shadow-sm transition-colors" title="Delete Task">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredTasks.map((task) => {
              const project = projects.find(p => p.id === task.project_id);
              const isCompleted = task.status === 'Completed';

              return (
                <Card key={task.id} className={`transition-all ${isCompleted ? 'opacity-75 bg-slate-50' : 'bg-white'}`}>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => handleToggleComplete(task)}
                        className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isCompleted && <CheckSquare size={12} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</p>
                        {project && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                            <FolderKanban size={12} />
                            <span className="truncate">{project.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                         <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                          task.priority === 'High' ? 'bg-red-50 text-red-700' :
                          task.priority === 'Medium' ? 'bg-orange-50 text-orange-700' :
                          'bg-blue-50 text-blue-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <Badge variant={isCompleted ? 'success' : task.status === 'In Progress' ? 'brand' : 'default'} className="text-[10px]">
                        {task.status}
                      </Badge>
                      
                      <div className="flex items-center gap-3">
                        {task.due_date && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                          <button onClick={() => handleEditOpen(task)} className="text-slate-400 p-1"><Edit2 size={14}/></button>
                          <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 p-1"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
        </ScrollReveal>
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Task"
        isLoading={isCreating}
        projects={projects}
        onSubmit={async (data) => {
          setIsCreating(true);
          try {
            await taskService.createTask(data as any);
            setIsModalOpen(false);
            fetchTasksAndProjects();
          } catch (err: any) {
            alert(err.message || 'Failed to create task');
          } finally {
            setIsCreating(false);
          }
        }}
      />

      <TaskFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
        initialData={editTaskData}
        isLoading={isUpdatingTask}
        projects={projects}
        onSubmit={async (data) => {
          if (!editTaskData.id) return;
          setIsUpdatingTask(true);
          try {
            await taskService.updateTask(editTaskData.id, data);
            setIsEditModalOpen(false);
            fetchTasksAndProjects();
          } catch (err: any) {
            alert(err.message || 'Failed to update task');
          } finally {
            setIsUpdatingTask(false);
          }
        }}
      />
    </div>
  );
}
