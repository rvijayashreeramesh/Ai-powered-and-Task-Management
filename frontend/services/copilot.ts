import { fetchWithAuth } from './api';
import { Task } from '@/types';

export interface GeminiModelStatus {
  provider: string;
  active_model: string;
  api_key_configured: boolean;
  masked_key: string;
  cascade_models: string[];
  auto_switch_enabled: boolean;
  exhausted_models: string[];
}

export const copilotService = {
  generateProjectDescription: async (title: string): Promise<string> => {
    const response = await fetchWithAuth('/copilot/generate-description', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate description');
    }
    const data = await response.json();
    return data.description;
  },

  generateTasks: async (projectName: string, description: string): Promise<Partial<Task>[]> => {
    const response = await fetchWithAuth('/copilot/generate-tasks', {
      method: 'POST',
      body: JSON.stringify({ project_name: projectName, description }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate tasks');
    }
    const data = await response.json();
    return data.tasks;
  },

  prioritizeTasks: async (tasks: Partial<Task>[]): Promise<Partial<Task>[]> => {
    const response = await fetchWithAuth('/copilot/prioritize-tasks', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to prioritize tasks');
    }
    const data = await response.json();
    return data.tasks;
  },

  getSuggestions: async (totalProjects: number, totalTasks: number, completedTasks: number): Promise<string> => {
    const response = await fetchWithAuth('/copilot/suggestions', {
      method: 'POST',
      body: JSON.stringify({
        total_projects: totalProjects,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get suggestions');
    }
    const data = await response.json();
    return data.suggestion;
  },

  checkHealth: async (): Promise<{ status: string; provider: string; model: string; ping: string }> => {
    const response = await fetchWithAuth('/copilot/health', {
      method: 'GET',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Gemini health check failed');
    }
    return await response.json();
  },

  getModelStatus: async (): Promise<GeminiModelStatus> => {
    const response = await fetchWithAuth('/copilot/model-status', {
      method: 'GET',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to retrieve model status');
    }
    return await response.json();
  },

  updateApiKey: async (apiKey: string): Promise<GeminiModelStatus> => {
    const response = await fetchWithAuth('/copilot/update-key', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update Gemini API key');
    }
    return await response.json();
  },

  switchModel: async (model: string): Promise<GeminiModelStatus> => {
    const response = await fetchWithAuth('/copilot/switch-model', {
      method: 'POST',
      body: JSON.stringify({ model }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to switch Gemini model');
    }
    return await response.json();
  },
};

