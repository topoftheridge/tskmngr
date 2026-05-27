export type TaskStatus = 'backlog' | 'planning' | 'in_progress' | 'waiting' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  client_name: string | null
  color: string
  created_by: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assigned_to: string | null
  project_id: string | null
  due_date: string | null
  position: number
  created_by: string
  created_at: string
  updated_at: string
  // joined
  profiles?: Profile | null
  projects?: Project | null
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile | null
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  planning: 'Planning',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  done: 'Done',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'bg-slate-100 text-slate-700',
  planning: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-blue-100 text-blue-700',
  waiting: 'bg-amber-100 text-amber-700',
  done: 'bg-green-100 text-green-700',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export const COLUMNS: TaskStatus[] = ['backlog', 'planning', 'in_progress', 'waiting', 'done']
