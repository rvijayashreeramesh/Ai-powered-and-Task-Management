'use client';
import { useEffect, useState, useMemo } from 'react';
import { projectService } from '@/services/projects';
import { taskService } from '@/services/tasks';
import { Project, Task } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ErrorState } from '@/components/states/ErrorState';
import Link from 'next/link';
import { Plus, Calendar, FolderKanban, Sparkles, Search, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');


  const fetchData = async () => {
    try {
      setLoading(true);
      const [projData, taskData] = await Promise.all([
        projectService.getProjects(),
        taskService.getTasks()
      ]);
      setProjects(projData);
      setTasks(taskData);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    let result = projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
      if (sortBy === 'oldest') return new Date(a.created_date).getTime() - new Date(b.created_date).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [projects, searchQuery, statusFilter, sortBy]);


  const getProjectStats = (projectId: string) => {
    const pTasks = tasks.filter(t => t.project_id === projectId);
    const completed = pTasks.filter(t => t.status === 'Completed').length;
    const progress = pTasks.length > 0 ? Math.round((completed / pTasks.length) * 100) : 0;
    return { total: pTasks.length, completed, progress };
  };

  // Mock team members for AvatarGroup
  const teamMembers = [
    { id: '1', name: 'Alice Smith' },
    { id: '2', name: 'Bob Johnson' },
    { id: '3', name: 'Charlie Brown' }
  ];

  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <ScrollReveal>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base">Manage all your projects in one place.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="secondary" className="w-full md:w-auto gap-2 text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 border-indigo-200">
            <Sparkles size={16} /> Generate with AI
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20">
            <Plus size={16} /> New Project
          </Button>
        </div>
      </div>
      </ScrollReveal>

      {/* Filters & Search */}
      <ScrollReveal delay={100}>
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          <input 
            className="w-full h-10 pl-9 pr-4 rounded-xl border-none bg-transparent text-sm focus:outline-none focus:ring-0 placeholder:text-slate-400" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-px bg-slate-200 hidden sm:block"></div>
        <div className="flex items-center gap-3 px-2 sm:px-0">
          <select 
            className="h-10 text-sm border-none bg-transparent font-medium text-slate-700 focus:outline-none focus:ring-0 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
          <div className="w-px h-6 bg-slate-200"></div>
          <select 
            className="h-10 text-sm border-none bg-transparent font-medium text-slate-700 focus:outline-none focus:ring-0 cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>
      </ScrollReveal>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-5 h-64 flex flex-col gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-16 w-full" />
              <div className="mt-auto"><Skeleton className="h-2 w-full" /></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="pt-10 flex justify-center">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 max-w-lg w-full text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
              <FolderKanban size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-500 mb-8">Create your first project or let AI generate one for you based on a simple prompt.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus size={16} /> Create Project
              </Button>
              <Button variant="secondary" className="gap-2">
                <Sparkles size={16} className="text-indigo-600" /> Generate with AI
              </Button>
            </div>
          </div>
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <div className="py-20 text-center">
          <Search className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900">No matching projects</h3>
          <p className="text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
        </div>
      ) : (
        <ScrollReveal delay={200}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map(project => {
            const stats = getProjectStats(project.id);
            return (
              <Link key={project.id} href={`/projects/${project.id}`} className="group block h-full">
                <Card className="h-full flex flex-col hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-300 transition-all duration-300">
                  <CardContent className="flex flex-col h-full p-5 sm:p-6">
                    
                    {/* Top Row: Icon & Status */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                        <FolderKanban size={20} />
                      </div>
                      <Badge variant={project.status === 'Completed' ? 'success' : project.status === 'In Progress' ? 'brand' : project.status === 'On Hold' ? 'warning' : 'default'}>
                        {project.status}
                      </Badge>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">
                      {project.description || 'No description provided.'}
                    </p>

                    {/* Progress & Stats */}
                    <div className="mb-6 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-slate-700">{stats.progress}%</span>
                        <span className="text-slate-500 flex items-center gap-1.5 text-xs">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          {stats.completed}/{stats.total} tasks
                        </span>
                      </div>
                      <ProgressBar progress={stats.progress} size="sm" />
                    </div>

                    {/* Footer Row */}
                    <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                      <div className="flex flex-col gap-2">
                        {project.due_date && (
                          <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(project.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                        <AvatarGroup users={teamMembers} size="sm" max={2} />
                      </div>
                      
                      <div className="text-sm font-semibold text-indigo-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        Open <ArrowRight size={16} />
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
        </ScrollReveal>
      )}

      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        isLoading={isCreating}
        onSubmit={async (data) => {
          setIsCreating(true);
          try {
            await projectService.createProject(data as any);
            setIsModalOpen(false);
            fetchData();
          } catch (err: any) {
            alert(err.message || 'Failed to create project');
          } finally {
            setIsCreating(false);
          }
        }}
      />
    </div>
  );
}
