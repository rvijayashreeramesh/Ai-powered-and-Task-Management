export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  due_date?: string;
  owner: string;
  created_date: string;
  updated_date: string;
}

export type TaskStatus = 'Todo' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description?: string;
  project_id: string;
  assigned_to?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}
