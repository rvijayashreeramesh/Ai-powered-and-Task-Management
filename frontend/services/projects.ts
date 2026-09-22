import { fetchWithAuth } from './api';
import { Project } from '@/types';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const res = await fetchWithAuth('/projects/');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: string): Promise<Project> {
    const res = await fetchWithAuth(`/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const res = await fetchWithAuth('/projects/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await fetchWithAuth(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetchWithAuth(`/projects/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
  }
};
