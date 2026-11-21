import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Timer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SETTINGS, type FocusSession, type Task, type TaskPriority, type TimerSettings } from '@/types';
import { isToday } from '@/lib/format';

export interface DbTask {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  created_at: number;
  completed_at: number | null;
}

export interface DbFocusSession {
  id: string;
  user_id: string;
  type: string;
  duration_minutes: number;
  started_at: number;
  completed_at: number;
}

export interface DbTimerSettings {
  id: string;
  user_id: string;
  focus: number;
  short_break: number;
  long_break: number;
}

interface FocusFlowState {
  tasks: Task[];
  sessions: FocusSession[];
  timerSettings: TimerSettings;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  addTask: (title: string, priority: TaskPriority) => void;
  toggleTask: (id: string) => void;
  updateTask: (id: string, title: string) => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
  recordSession: (session: Omit<FocusSession, 'id'>) => void;
  updateTimerSettings: (settings: Partial<TimerSettings>) => void;
  totalFocusMinutes: number;
  completedSessions: number;
  todayFocusSessions: number;
  todayFocusMinutes: number;
}

const StoreContext = createContext<FocusFlowState | null>(null);

function mapTaskFromDb(row: any): Task {
  return {
    id: row.id,
    title: row.title ?? '',
    completed: Boolean(row.completed),
    priority: (['low', 'medium', 'high'].includes(row.priority) ? row.priority : 'medium') as TaskPriority,
    createdAt: row.created_at !== undefined && row.created_at !== null ? Number(row.created_at) : Date.now(),
    completedAt: row.completed_at !== undefined && row.completed_at !== null ? Number(row.completed_at) : null,
  };
}

function mapSessionFromDb(row: any): FocusSession {
  return {
    id: row.id,
    type: row.type,
    durationMinutes: Number(row.duration_minutes ?? row.durationMinutes ?? 0),
    startedAt: row.started_at !== undefined && row.started_at !== null ? Number(row.started_at) : Date.now(),
    completedAt: row.completed_at !== undefined && row.completed_at !== null ? Number(row.completed_at) : Date.now(),
  };
}

function mapSettingsFromDb(row: any): TimerSettings {
  return {
    focus: typeof row.focus === 'number' ? row.focus : DEFAULT_SETTINGS.focus,
    shortBreak:
      typeof row.short_break === 'number'
        ? row.short_break
        : typeof row.shortBreak === 'number'
          ? row.shortBreak
          : DEFAULT_SETTINGS.shortBreak,
    longBreak:
      typeof row.long_break === 'number'
        ? row.long_break
        : typeof row.longBreak === 'number'
          ? row.longBreak
          : DEFAULT_SETTINGS.longBreak,
  };
}

export function StoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial load from Supabase for this authenticated user
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadData() {
      try {
        const [tasksRes, sessionsRes, settingsRes] = await Promise.all([
          supabase
            .from('tasks')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
          supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false }),
          supabase
            .from('timer_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
        ]);

        if (!isMounted) return;

        if (tasksRes.error) {
          console.error('Failed to load tasks from Supabase:', tasksRes.error);
          setError(tasksRes.error.message);
        } else if (tasksRes.data) {
          setTasks(tasksRes.data.map(mapTaskFromDb));
        }

        if (sessionsRes.error) {
          console.error('Failed to load focus sessions from Supabase:', sessionsRes.error);
          setError(sessionsRes.error.message);
        } else if (sessionsRes.data) {
          setSessions(sessionsRes.data.map(mapSessionFromDb));
        }

        if (settingsRes.error) {
          console.error('Failed to load timer settings from Supabase:', settingsRes.error);
          setError(settingsRes.error.message);
        } else if (settingsRes.data) {
          setSettingsId(settingsRes.data.id);
          setTimerSettings(mapSettingsFromDb(settingsRes.data));
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Unexpected error loading data:', err);
        setError(err?.message ?? 'Failed to load user data');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const addTask = useCallback(
    async (title: string, priority: TaskPriority) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const tempId = crypto.randomUUID();
      const now = Date.now();
      const optimisticTask: Task = {
        id: tempId,
        title: trimmed,
        completed: false,
        priority,
        createdAt: now,
        completedAt: null,
      };

      setTasks((prev) => [optimisticTask, ...prev]);

      try {
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            user_id: userId,
            title: trimmed,
            priority,
            completed: false,
            created_at: now,
            completed_at: null,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to insert task to Supabase:', error);
          setTasks((prev) => prev.filter((t) => t.id !== tempId));
          setError(error.message);
        } else if (data) {
          const saved = mapTaskFromDb(data);
          setTasks((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
        }
      } catch (err: any) {
        console.error('Unexpected error inserting task:', err);
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        setError(err?.message ?? 'Failed to create task');
      }
    },
    [userId],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      const nextCompleted = !target.completed;
      const nextCompletedAt = nextCompleted ? Date.now() : null;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: nextCompleted, completedAt: nextCompletedAt } : t,
        ),
      );

      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            completed: nextCompleted,
            completed_at: nextCompletedAt,
          })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update task completion in Supabase:', error);
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, completed: target.completed, completedAt: target.completedAt } : t,
            ),
          );
          setError(error.message);
        }
      } catch (err: any) {
        console.error('Unexpected error toggling task:', err);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, completed: target.completed, completedAt: target.completedAt } : t,
          ),
        );
        setError(err?.message ?? 'Failed to update task');
      }
    },
    [tasks, userId],
  );

  const updateTask = useCallback(
    async (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      const target = tasks.find((t) => t.id === id);
      if (!target) return;
      const prevTitle = target.title;

      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)));

      try {
        const { error } = await supabase
          .from('tasks')
          .update({ title: trimmed })
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update task title in Supabase:', error);
          setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: prevTitle } : t)));
          setError(error.message);
        }
      } catch (err: any) {
        console.error('Unexpected error updating task:', err);
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: prevTitle } : t)));
        setError(err?.message ?? 'Failed to update task');
      }
    },
    [tasks, userId],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const target = tasks.find((t) => t.id === id);
      if (!target) return;

      setTasks((prev) => prev.filter((t) => t.id !== id));

      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to delete task in Supabase:', error);
          setTasks((prev) => [target, ...prev]);
          setError(error.message);
        }
      } catch (err: any) {
        console.error('Unexpected error deleting task:', err);
        setTasks((prev) => [target, ...prev]);
        setError(err?.message ?? 'Failed to delete task');
      }
    },
    [tasks, userId],
  );

  const clearCompleted = useCallback(async () => {
    const completedTasks = tasks.filter((t) => t.completed);
    if (completedTasks.length === 0) return;

    setTasks((prev) => prev.filter((t) => !t.completed));

    try {
      const completedIds = completedTasks.map((t) => t.id);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', completedIds)
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to clear completed tasks in Supabase:', error);
        setTasks((prev) => [...prev, ...completedTasks]);
        setError(error.message);
      }
    } catch (err: any) {
      console.error('Unexpected error clearing completed tasks:', err);
      setTasks((prev) => [...prev, ...completedTasks]);
      setError(err?.message ?? 'Failed to clear completed tasks');
    }
  }, [tasks, userId]);

  const recordSession = useCallback(
    async (session: Omit<FocusSession, 'id'>) => {
      // Prevent duplicate records when saving
      const isDuplicate = sessions.some(
        (s) => s.startedAt === session.startedAt && s.completedAt === session.completedAt,
      );
      if (isDuplicate) {
        console.warn('Duplicate focus session detected; skipping record.');
        return;
      }

      const tempId = crypto.randomUUID();
      const optimisticSession: FocusSession = {
        ...session,
        id: tempId,
      };

      setSessions((prev) => [optimisticSession, ...prev]);

      try {
        const { data, error } = await supabase
          .from('focus_sessions')
          .insert({
            user_id: userId,
            type: session.type,
            duration_minutes: session.durationMinutes,
            started_at: session.startedAt,
            completed_at: session.completedAt,
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to insert focus session in Supabase:', error);
          setSessions((prev) => prev.filter((s) => s.id !== tempId));
          setError(error.message);
        } else if (data) {
          const saved = mapSessionFromDb(data);
          setSessions((prev) => prev.map((s) => (s.id === tempId ? saved : s)));
        }
      } catch (err: any) {
        console.error('Unexpected error saving focus session:', err);
        setSessions((prev) => prev.filter((s) => s.id !== tempId));
        setError(err?.message ?? 'Failed to save focus session');
      }
    },
    [sessions, userId],
  );

  const updateTimerSettings = useCallback(
    async (settings: Partial<TimerSettings>) => {
      const newSettings: TimerSettings = {
        ...timerSettings,
        ...settings,
      };
      setTimerSettings(newSettings);

      try {
        if (settingsId) {
          const { error } = await supabase
            .from('timer_settings')
            .update({
              focus: newSettings.focus,
              short_break: newSettings.shortBreak,
              long_break: newSettings.longBreak,
            })
            .eq('id', settingsId)
            .eq('user_id', userId);

          if (error) {
            console.error('Failed to update timer settings in Supabase:', error);
            setError(error.message);
          }
        } else {
          // If no row exists yet, insert
          const { data, error } = await supabase
            .from('timer_settings')
            .insert({
              user_id: userId,
              focus: newSettings.focus,
              short_break: newSettings.shortBreak,
              long_break: newSettings.longBreak,
            })
            .select()
            .single();

          if (error) {
            // If duplicate key error due to race condition or unique constraint, update by user_id
            if (error.code === '23505' || error.message.includes('duplicate')) {
              const { data: updated, error: updateErr } = await supabase
                .from('timer_settings')
                .update({
                  focus: newSettings.focus,
                  short_break: newSettings.shortBreak,
                  long_break: newSettings.longBreak,
                })
                .eq('user_id', userId)
                .select()
                .single();

              if (updateErr) {
                console.error('Failed to update timer settings:', updateErr);
                setError(updateErr.message);
              } else if (updated) {
                setSettingsId(updated.id);
              }
            } else {
              console.error('Failed to insert timer settings in Supabase:', error);
              setError(error.message);
            }
          } else if (data) {
            setSettingsId(data.id);
          }
        }
      } catch (err: any) {
        console.error('Unexpected error saving timer settings:', err);
        setError(err?.message ?? 'Failed to save timer settings');
      }
    },
    [timerSettings, settingsId, userId],
  );

  const totalFocusMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.type === 'focus')
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions],
  );

  const completedSessions = useMemo(
    () => sessions.filter((s) => s.type === 'focus').length,
    [sessions],
  );

  const todayFocusSessions = useMemo(
    () => sessions.filter((s) => s.type === 'focus' && isToday(s.completedAt)).length,
    [sessions],
  );

  const todayFocusMinutes = useMemo(
    () =>
      sessions
        .filter((s) => s.type === 'focus' && isToday(s.completedAt))
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [sessions],
  );

  const value = useMemo(
    () => ({
      tasks,
      sessions,
      timerSettings,
      loading,
      error,
      clearError,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      clearCompleted,
      recordSession,
      updateTimerSettings,
      totalFocusMinutes,
      completedSessions,
      todayFocusSessions,
      todayFocusMinutes,
    }),
    [
      tasks,
      sessions,
      timerSettings,
      loading,
      error,
      clearError,
      addTask,
      toggleTask,
      updateTask,
      deleteTask,
      clearCompleted,
      recordSession,
      updateTimerSettings,
      totalFocusMinutes,
      completedSessions,
      todayFocusSessions,
      todayFocusMinutes,
    ],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-100">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft animate-pulse">
            <Timer className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-ink-500">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <StoreContext.Provider value={value}>
      {children}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-error-600 text-white px-4 py-2.5 shadow-lg animate-slide-up text-sm">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="ml-2 hover:opacity-80 font-bold px-1"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
