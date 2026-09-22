import { fetchWithAuth } from './api';
import { Task } from '@/types';

export const taskService = {
  async getTasks(projectId?: string): Promise<Task[]> {
    const url = projectId ? `/tasks/?project_id=${projectId}` : '/tasks/';
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    const res = await fetchWithAuth('/tasks/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await fetchWithAuth(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetchWithAuth(`/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
  }
};
