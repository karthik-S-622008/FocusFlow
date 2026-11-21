import { CheckCircle2, Circle, Clock, LayoutDashboard, ListTodo, LogOut, Menu, Timer, User as UserIcon, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ViewKey } from '@/types';

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'tasks', label: 'Tasks', icon: ListTodo },
  { key: 'timer', label: 'Timer', icon: Timer },
];

interface SidebarProps {
  active: ViewKey;
  onNavigate: (view: ViewKey) => void;
  pendingTasks: number;
  completedToday: number;
}

export default function Sidebar({ active, onNavigate, pendingTasks, completedToday }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleNavigate = (view: ViewKey) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-white border-b border-ink-200 px-4 py-3 lg:hidden sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Timer className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-bold text-ink-900">FocusFlow</span>
        </div>
        <button
          className="btn-ghost p-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto flex h-screen w-72 flex-col bg-white border-r border-ink-200 transition-transform duration-300 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-soft">
              <Timer className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-ink-900 leading-none">FocusFlow</h1>
              <p className="text-xs text-ink-400 mt-1">Productivity & Focus</p>
            </div>
          </div>
          <button
            className="btn-ghost p-2 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2 space-y-1">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-ink-400">Menu</p>
          {navItems.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => handleNavigate(key)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                {label}
                {key === 'tasks' && pendingTasks > 0 && (
                  <span className="ml-auto rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
                    {pendingTasks}
                  </span>
                )}
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />}
              </button>
            );
          })}
        </nav>

        {/* Quick stats footer */}
        <div className="px-4 py-4">
          <div className="rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 p-4 text-white">
            <p className="text-xs font-medium text-ink-300 uppercase tracking-wide">Today</p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success-400" />
                <span className="text-sm font-medium">{completedToday} done</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-medium">{pendingTasks} left</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
            <Clock className="h-3 w-3" />
            <span>Stay focused, stay sharp.</span>
          </div>
        </div>

        {/* User profile & Sign Out */}
        <div className="border-t border-ink-200 px-4 py-3 flex items-center justify-between gap-2 bg-ink-50/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-900 truncate" title={user?.email ?? ''}>
                {user?.email}
              </p>
              <p className="text-[10px] text-ink-400">Signed in</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-1.5 rounded-lg text-ink-400 hover:text-error-600 hover:bg-error-50 transition-colors shrink-0"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
