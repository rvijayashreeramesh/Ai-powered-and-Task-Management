'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { copilotService } from '@/services/copilot';
import { projectService } from '@/services/projects';
import { taskService } from '@/services/tasks';
import { Project, Task } from '@/types';
import { Sparkles, FileText, CheckSquare, ListOrdered, Lightbulb, Loader2, ArrowRight } from 'lucide-react';

type AIActionType = 'GENERATE_DESCRIPTION' | 'GENERATE_TASKS' | 'PRIORITIZE_TASKS' | 'SUGGESTIONS' | null;

export default function AIAssistantPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [selectedAction, setSelectedAction] = useState<AIActionType>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proj, task] = await Promise.all([
          projectService.getProjects(),
          taskService.getTasks()
        ]);
        setProjects(proj);
        setTasks(task);
        if (proj.length > 0) setSelectedProjectId(proj[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleActionClick = (action: AIActionType) => {
    setSelectedAction(action);
    setResult(null);
  };

  const executeAction = async () => {
    if (!selectedAction) return;
    setIsProcessing(true);
    setResult(null);

    try {
      if (selectedAction === 'GENERATE_DESCRIPTION') {
        const p = projects.find(x => x.id === selectedProjectId);
        if (p) {
          const desc = await copilotService.generateProjectDescription(p.name);
          setResult(desc);
        }
      } else if (selectedAction === 'GENERATE_TASKS') {
        const p = projects.find(x => x.id === selectedProjectId);
        if (p) {
          const generatedTasks = await copilotService.generateTasks(p.name, p.description || '');
          setResult(generatedTasks);
        }
      } else if (selectedAction === 'PRIORITIZE_TASKS') {
        const activeTasks = tasks.filter(t => t.status !== 'Completed');
        if (activeTasks.length > 0) {
          const prioritizedTasks = await copilotService.prioritizeTasks(activeTasks);
          setResult(prioritizedTasks);
        } else {
          setResult({ error: "No active tasks to prioritize." });
        }
      } else if (selectedAction === 'SUGGESTIONS') {
        const completed = tasks.filter(t => t.status === 'Completed').length;
        const suggestion = await copilotService.getSuggestions(projects.length, tasks.length, completed);
        setResult(suggestion);
      }
    } catch (err: any) {
      setResult({ error: err.message || "An error occurred." });
    } finally {
      setIsProcessing(false);
    }
  };

  const applyResult = async () => {
    try {
      if (selectedAction === 'GENERATE_DESCRIPTION') {
        await projectService.updateProject(selectedProjectId, { description: result as string });
        alert("Description applied successfully!");
      } else if (selectedAction === 'GENERATE_TASKS') {
        const genTasks = result as Partial<Task>[];
        for (const t of genTasks) {
          await taskService.createTask({
            title: t.title || '',
            description: t.description || '',
            status: t.status || 'Todo',
            priority: t.priority || 'Medium',
            project_id: selectedProjectId
          });
        }
        alert("Tasks added successfully!");
      } else if (selectedAction === 'PRIORITIZE_TASKS') {
        const prioTasks = result as Partial<Task>[];
        for (const t of prioTasks) {
          const original = tasks.find(x => x.title === t.title);
          if (original && original.priority !== t.priority) {
            await taskService.updateTask(original.id, { priority: t.priority });
          }
        }
        alert("Tasks prioritized successfully!");
      }
      setSelectedAction(null);
      setResult(null);
      // Re-fetch data behind the scenes
      const [proj, task] = await Promise.all([
        projectService.getProjects(),
        taskService.getTasks()
      ]);
      setProjects(proj);
      setTasks(task);
    } catch (err) {
      alert("Failed to apply results.");
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      <ScrollReveal>
        <div className="text-center mb-10 mt-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-xs font-semibold text-violet-700 mb-4 shadow-sm">
            <Sparkles size={14} className="text-violet-600" />
            <span>Powered by Google Gemini</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            AI Productivity Assistant
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Turn your project data into actionable decisions with intelligent insights, task generation, and automated prioritization.
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard 
            title="Generate Tasks" 
            description="Break down projects into actionable tasks."
            icon={<CheckSquare size={20} />}
            onClick={() => handleActionClick('GENERATE_TASKS')}
            isActive={selectedAction === 'GENERATE_TASKS'}
          />
          <ActionCard 
            title="Generate Description" 
            description="Create professional project summaries."
            icon={<FileText size={20} />}
            onClick={() => handleActionClick('GENERATE_DESCRIPTION')}
            isActive={selectedAction === 'GENERATE_DESCRIPTION'}
          />
          <ActionCard 
            title="Prioritize Tasks" 
            description="Re-rank your active tasks by importance."
            icon={<ListOrdered size={20} />}
            onClick={() => handleActionClick('PRIORITIZE_TASKS')}
            isActive={selectedAction === 'PRIORITIZE_TASKS'}
          />
          <ActionCard 
            title="Productivity Insights" 
            description="Get data-driven suggestions to improve flow."
            icon={<Lightbulb size={20} />}
            onClick={() => handleActionClick('SUGGESTIONS')}
            isActive={selectedAction === 'SUGGESTIONS'}
          />
        </div>
      </ScrollReveal>

      {/* Result Panel */}
      {selectedAction && (
        <ScrollReveal delay={50}>
          <div className="mt-8 p-6 md:p-8 bg-white border border-violet-100 rounded-3xl shadow-xl shadow-violet-900/5 relative overflow-hidden group transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-violet-600" />
                {selectedAction === 'GENERATE_TASKS' && "Generate Project Tasks"}
                {selectedAction === 'GENERATE_DESCRIPTION' && "Generate Project Description"}
                {selectedAction === 'PRIORITIZE_TASKS' && "Prioritize Active Tasks"}
                {selectedAction === 'SUGGESTIONS' && "Workspace Productivity Insights"}
              </h2>

              {/* Input Configuration */}
              {!isProcessing && !result && (
                <div className="space-y-6">
                  {(selectedAction === 'GENERATE_TASKS' || selectedAction === 'GENERATE_DESCRIPTION') && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Select Project Context</label>
                      <select 
                        className="w-full max-w-md h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedAction === 'PRIORITIZE_TASKS' && (
                    <p className="text-sm text-slate-600">The AI will analyze all {tasks.filter(t => t.status !== 'Completed').length} active tasks across your workspace and assign appropriate priority levels based on context.</p>
                  )}
                  {selectedAction === 'SUGGESTIONS' && (
                    <p className="text-sm text-slate-600">The AI will analyze your {projects.length} projects and {tasks.length} tasks to provide actionable productivity tips.</p>
                  )}

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setSelectedAction(null)}>Cancel</Button>
                    <Button 
                      className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-600/20 text-white" 
                      onClick={executeAction}
                    >
                      Run AI Operation <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {isProcessing && (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 rounded-full bg-violet-400 blur-xl animate-pulse-glow opacity-50"></div>
                    <Loader2 size={40} className="text-violet-600 animate-spin relative z-10" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {selectedAction === 'GENERATE_TASKS' && "Analyzing your project..."}
                    {selectedAction === 'GENERATE_DESCRIPTION' && "Analyzing project context..."}
                    {selectedAction === 'PRIORITIZE_TASKS' && "Evaluating active task priorities..."}
                    {selectedAction === 'SUGGESTIONS' && "Analyzing workspace metrics..."}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {selectedAction === 'GENERATE_TASKS' && "Gemini is generating recommendations..."}
                    {selectedAction === 'GENERATE_DESCRIPTION' && "Gemini is drafting a project description..."}
                    {selectedAction === 'PRIORITIZE_TASKS' && "Gemini is determining task priorities..."}
                    {selectedAction === 'SUGGESTIONS' && "Gemini is generating productivity insights..."}
                  </p>
                </div>
              )}

              {/* Results State */}
              {result && !isProcessing && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {result.error ? (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
                      {result.error}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                      
                      {selectedAction === 'GENERATE_DESCRIPTION' && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Suggested Description</h4>
                          <p className="text-slate-800 text-lg leading-relaxed">{result}</p>
                        </div>
                      )}

                      {selectedAction === 'SUGGESTIONS' && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Productivity Insight</h4>
                          <p className="text-slate-800 text-lg leading-relaxed">{result}</p>
                        </div>
                      )}

                      {(selectedAction === 'GENERATE_TASKS' || selectedAction === 'PRIORITIZE_TASKS') && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">
                            {selectedAction === 'GENERATE_TASKS' ? 'Generated Tasks' : 'Reprioritized Tasks'}
                          </h4>
                          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                            {(result as Partial<Task>[]).map((t, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{t.title}</p>
                                  {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                                </div>
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${
                                  t.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                                  t.priority === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                  'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                  {t.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button variant="secondary" onClick={() => setSelectedAction(null)}>Discard</Button>
                    {!result.error && (selectedAction !== 'SUGGESTIONS') && (
                      <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20" onClick={applyResult}>
                        Apply Results
                      </Button>
                    )}
                  </div>

                </div>
              )}

            </div>
          </div>
        </ScrollReveal>
      )}

    </div>
  );
}

function ActionCard({ title, description, icon, onClick, isActive }: { title: string, description: string, icon: React.ReactNode, onClick: () => void, isActive: boolean }) {
  return (
    <Card 
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
        isActive 
          ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/10 border-transparent bg-violet-50/50' 
          : 'hover:border-violet-300 hover:shadow-md border-slate-200 bg-white'
      }`}
    >
      <CardContent className="p-6 flex flex-col h-full">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
          isActive ? 'bg-violet-600 text-white shadow-md' : 'bg-violet-100 text-violet-600'
        }`}>
          {icon}
        </div>
        <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed flex-1">{description}</p>
      </CardContent>
    </Card>
  );
}
