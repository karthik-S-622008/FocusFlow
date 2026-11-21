export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  createdAt: number;
  completedAt: number | null;
}

export type SessionType = 'focus' | 'shortBreak' | 'longBreak';

export interface FocusSession {
  id: string;
  type: SessionType;
  durationMinutes: number;
  startedAt: number;
  completedAt: number;
}

export interface TimerSettings {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

export type ViewKey = 'dashboard' | 'tasks' | 'timer';
