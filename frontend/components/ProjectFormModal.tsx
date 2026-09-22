import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Project } from '@/types';
import { Wand2 } from 'lucide-react';
import { copilotService } from '@/services/copilot';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Project>) => void;
  title: string;
  initialData?: Partial<Project>;
  isLoading?: boolean;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialData,
  isLoading = false,
}: ProjectFormModalProps) {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'Active',
  });
  
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        description: initialData?.description || '',
        status: initialData?.status || 'Active',
      });
    }
  }, [isOpen, initialData?.name, initialData?.description, initialData?.status]);

  const handleGenerateDesc = async () => {
    if (!formData.name) {
      alert("Please enter a project name first.");
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const desc = await copilotService.generateProjectDescription(formData.name);
      setFormData(prev => ({ ...prev, description: desc }));
    } catch (err: any) {
      alert(err.message || 'Failed to generate description');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input 
          label="Project Name" 
          required 
          placeholder="e.g., Website Redesign"
          value={formData.name || ''} 
          onChange={e => setFormData({...formData, name: e.target.value})} 
        />
        
        <div className="w-full">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">Description</label>
            <button 
              type="button" 
              onClick={handleGenerateDesc}
              disabled={isGeneratingDesc || !formData.name}
              className="text-xs font-medium flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors bg-indigo-50 px-2 py-1 rounded-md"
            >
              <Wand2 size={14} />
              {isGeneratingDesc ? 'Gemini is drafting...' : 'Gemini Auto-generate'}
            </button>
          </div>
          <textarea 
            className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-200"
            rows={4}
            placeholder="Describe the project..."
            value={formData.description || ''}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
        
        <div className="w-full">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
          <select 
            className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all duration-200"
            value={formData.status}
            onChange={e => setFormData({...formData, status: e.target.value})}
          >
            <option value="pending">Pending</option>
            <option value="Active">Active</option>
            <option value="completed">Completed</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
