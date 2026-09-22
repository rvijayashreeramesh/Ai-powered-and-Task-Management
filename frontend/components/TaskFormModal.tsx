import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Task, Project } from '@/types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Task>) => void;
  title: string;
  initialData?: Partial<Task>;
  isLoading?: boolean;
  projects?: Project[];
  hideProjectSelect?: boolean;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData = {},
  isLoading = false,
  projects = [],
  hideProjectSelect = false,
}: TaskFormModalProps) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    project_id: '',
    status: 'Todo' as any,
    priority: 'Medium' as any,
    assigned_to: '',
    due_date: undefined,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        project_id: initialData.project_id || (projects.length > 0 ? projects[0].id : ''),
        status: initialData.status || 'Todo',
        priority: initialData.priority || 'Medium',
        assigned_to: initialData.assigned_to || '',
        due_date: initialData.due_date || undefined,
      });
    }
  }, [isOpen, initialData, projects]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {!hideProjectSelect && projects.length > 0 && (
          <div className="w-full">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project</label>
            <select 
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-200"
              required
              value={formData.project_id}
              onChange={e => setFormData({...formData, project_id: e.target.value})}
            >
              <option value="" disabled>Select a project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <Input 
          label="Task Title" 
          required 
          placeholder="e.g., Design Landing Page"
          value={formData.title || ''} 
          onChange={e => setFormData({...formData, title: e.target.value})} 
        />
        
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea 
            className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-200"
            rows={4}
            placeholder="Describe the task..."
            value={formData.description || ''}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select 
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-200"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
            <select 
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-200"
              value={formData.priority}
              onChange={e => setFormData({...formData, priority: e.target.value as any})}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-1/2">
            <Input 
              label="Assigned To" 
              placeholder="User email or ID"
              value={formData.assigned_to || ''} 
              onChange={e => setFormData({...formData, assigned_to: e.target.value})} 
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
            <input 
              type="date"
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-200"
              value={formData.due_date ? formData.due_date.substring(0, 10) : ''}
              onChange={e => setFormData({...formData, due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
