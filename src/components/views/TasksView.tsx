import { Check, CheckCircle2, ListTodo, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStore } from '@/store';
import type { TaskPriority } from '@/types';

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; dot: string; badge: string; border: string }
> = {
  high: {
    label: 'High',
    dot: 'bg-error-500',
    badge: 'bg-error-50 text-error-700',
    border: 'border-l-error-500',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-warning-500',
    badge: 'bg-warning-50 text-warning-700',
    border: 'border-l-warning-500',
  },
  low: {
    label: 'Low',
    dot: 'bg-success-500',
    badge: 'bg-success-50 text-success-700',
    border: 'border-l-success-500',
  },
};

type Filter = 'all' | 'active' | 'completed';

export default function TasksView() {
  const { tasks, addTask, toggleTask, updateTask, deleteTask, clearCompleted } = useStore();
  const [input, setInput] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return sortedTasks.filter((t) => !t.completed);
      case 'completed':
        return sortedTasks.filter((t) => t.completed);
      default:
        return sortedTasks;
    }
  }, [sortedTasks, filter]);

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addTask(input, priority);
    setInput('');
    setPriority('medium');
  };

  const startEditing = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditText(currentTitle);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = (id: string) => {
    updateTask(id, editText);
    cancelEditing();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'completed', label: 'Done', count: completedCount },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">Tasks</h2>
          <p className="text-sm text-ink-500 mt-1">Manage what needs to get done</p>
        </div>
        {completedCount > 0 && (
          <button onClick={clearCompleted} className="btn-ghost text-sm">
            <Trash2 className="h-4 w-4" />
            Clear completed
          </button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink-600">Progress</span>
            <span className="text-sm font-semibold text-ink-800">
              {completedCount} / {totalCount} done
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-ink-400 mt-2">{progressPct}% complete</p>
        </div>
      )}

      {/* Add task form */}
      <form onSubmit={handleSubmit} className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Plus className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new task..."
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    priority === p
                      ? cfg.badge
                      : 'bg-ink-50 text-ink-500 hover:bg-ink-100'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>
          <button type="submit" className="btn-primary" disabled={!input.trim()}>
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </form>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white border border-ink-200 p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === f.key
                ? 'bg-primary-50 text-primary-700'
                : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50'
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                filter === f.key ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-500'
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="card p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100">
                <ListTodo className="h-8 w-8 text-ink-400" />
              </div>
              <p className="text-lg font-semibold text-ink-700 mt-4">
                {filter === 'completed' ? 'No completed tasks' : filter === 'active' ? 'No active tasks' : 'No tasks yet'}
              </p>
              <p className="text-sm text-ink-400 mt-1">
                {filter === 'all' ? 'Add your first task above to get started' : 'Try a different filter'}
              </p>
            </div>
          </div>
        ) : (
          filteredTasks.map((task, i) => {
            const cfg = PRIORITY_CONFIG[task.priority];
            const isEditing = editingId === task.id;
            return (
              <div
                key={task.id}
                className={`card p-4 border-l-4 ${cfg.border} flex items-center gap-4 group animate-slide-up`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    task.completed
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-ink-300 hover:border-primary-400'
                  }`}
                  aria-label={task.completed ? 'Mark as not done' : 'Mark as done'}
                >
                  {task.completed && <Check className="h-3.5 w-3.5" />}
                </button>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, task.id)}
                      onBlur={() => saveEdit(task.id)}
                      autoFocus
                      className="input py-1.5"
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(task.id, task.title)}
                        className="block max-w-full text-left"
                      >
                        <p
                          className={`text-sm font-medium transition-all ${
                            task.completed ? 'text-ink-400 line-through' : 'text-ink-800'
                          }`}
                        >
                          {task.title}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-ink-400">
                          {task.completed && task.completedAt
                            ? `Done ${new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : `Added ${new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons — always visible on touch, hover on desktop */}
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEditing(task.id, task.title)}
                      className="p-2 rounded-lg text-ink-300 hover:text-primary-600 hover:bg-primary-50 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Edit task"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 rounded-lg text-ink-300 hover:text-error-500 hover:bg-error-50 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                      aria-label="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="p-2 rounded-lg text-success-600 hover:bg-success-50 transition-all"
                      aria-label="Save edit"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 transition-all"
                      aria-label="Cancel edit"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Completion banner */}
      {totalCount > 0 && activeCount === 0 && (
        <div className="card p-6 flex items-center gap-4 bg-success-50/50 border-success-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-100 text-success-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-success-800">All tasks complete!</p>
            <p className="text-sm text-success-600">Nice work. Add more tasks or take a break.</p>
          </div>
        </div>
      )}
    </div>
  );
}
