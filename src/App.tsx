import { useMemo, useState } from 'react';
import { Timer } from 'lucide-react';
import AuthPage from '@/components/views/AuthPage';
import Dashboard from '@/components/views/Dashboard';
import Sidebar from '@/components/Sidebar';
import TasksView from '@/components/views/TasksView';
import TimerView from '@/components/views/TimerView';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { StoreProvider, useStore } from '@/store';
import type { ViewKey } from '@/types';
import { isToday } from '@/lib/format';

function AppShell() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const { tasks } = useStore();

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);
  const completedToday = useMemo(
    () => tasks.filter((t) => t.completed && t.completedAt && isToday(t.completedAt)).length,
    [tasks],
  );

  const views: Record<ViewKey, React.ReactNode> = {
    dashboard: <Dashboard />,
    tasks: <TasksView />,
    timer: <TimerView />,
  };

  return (
    <div className="flex min-h-screen bg-ink-100">
      <Sidebar
        active={view}
        onNavigate={setView}
        pendingTasks={pendingTasks}
        completedToday={completedToday}
      />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {views[view]}
        </div>
      </main>
    </div>
  );
}

function AuthGate() {
  const { session, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-100">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft animate-pulse">
            <Timer className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-ink-500">Loading FocusFlow...</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return <AuthPage />;
  }

  return (
    <StoreProvider key={user.id} userId={user.id}>
      <AppShell />
    </StoreProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
