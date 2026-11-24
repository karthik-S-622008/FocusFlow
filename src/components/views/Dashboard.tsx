import { Award, CheckCircle2, Clock, Flame, ListTodo, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useStore } from '@/store';
import { formatDuration, isToday } from '@/lib/format';

export default function Dashboard() {
  const { tasks, sessions, todayFocusSessions, todayFocusMinutes, totalFocusMinutes, completedSessions } = useStore();

  const stats = useMemo(() => {
    const todaySessions = sessions.filter(
      (s) => s.type === 'focus' && isToday(s.completedAt),
    );
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const todayTasksDone = tasks.filter(
      (t) => t.completed && t.completedAt && isToday(t.completedAt),
    ).length;
    const pendingTasks = tasks.filter((t) => !t.completed).length;

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      const dayMinutes = sessions
        .filter((s) => {
          if (s.type !== 'focus') return false;
          const cd = new Date(s.completedAt);
          cd.setHours(0, 0, 0, 0);
          return cd.getTime() === d.getTime();
        })
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), minutes: dayMinutes };
    });
    const maxMinutes = Math.max(...last7.map((d) => d.minutes), 25);

    return {
      todayMinutes,
      todaySessions: todaySessions.length,
      todayTasksDone,
      pendingTasks,
      last7,
      maxMinutes,
    };
  }, [tasks, sessions]);

  const recentSessions = sessions.slice(0, 5);

  const cards = [
    {
      label: 'Focus Sessions',
      value: todayFocusSessions,
      sub: `${completedSessions} all-time`,
      icon: Flame,
      color: 'primary',
    },
    {
      label: 'Total Focus Time',
      value: formatDuration(todayFocusMinutes),
      sub: `${formatDuration(totalFocusMinutes)} all-time`,
      icon: Clock,
      color: 'accent',
    },
    {
      label: 'Tasks Completed',
      value: tasks.filter((t) => t.completed).length,
      sub: `${stats.todayTasksDone} today`,
      icon: CheckCircle2,
      color: 'success',
    },
    {
      label: 'Tasks Pending',
      value: stats.pendingTasks,
      sub: 'Still to do',
      icon: ListTodo,
      color: 'warning',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Dashboard</h2>
        <p className="text-sm text-ink-500 mt-1">Your productivity at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card p-5 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-500">{card.label}</p>
                  <p className="font-display text-3xl font-bold text-ink-900 mt-2">{card.value}</p>
                  <p className="text-xs text-ink-400 mt-1">{card.sub}</p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-${card.color}-50 text-${card.color}-600`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900">Focus This Week</h3>
              <p className="text-sm text-ink-400">Minutes focused per day</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-success-600 font-medium">
              <TrendingUp className="h-4 w-4" />
              <span>{formatDuration(stats.last7.reduce((s, d) => s + d.minutes, 0))} total</span>
            </div>
          </div>
          <div className="flex items-stretch justify-between gap-2 h-48">
            {stats.last7.map((day, i) => {
              const heightPct = (day.minutes / stats.maxMinutes) * 100;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2 group">
                  <div className="relative flex-1 w-full flex items-end justify-center">
                    <div
                      className="w-full max-w-[2.5rem] rounded-t-lg bg-gradient-to-t from-primary-500 to-accent-400 transition-all duration-500 group-hover:from-primary-600 group-hover:to-accent-500"
                      style={{
                        height: `${Math.max(heightPct, day.minutes > 0 ? 8 : 2)}%`,
                        opacity: day.minutes > 0 ? 1 : 0.3,
                      }}
                    />
                    <span className="absolute -top-6 text-xs font-semibold text-ink-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {day.minutes}m
                    </span>
                  </div>
                  <span className="text-xs font-medium text-ink-500">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent sessions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-semibold text-ink-900">Recent Sessions</h3>
            <Award className="h-5 w-5 text-primary-500" />
          </div>
          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
                <Clock className="h-6 w-6 text-ink-400" />
              </div>
              <p className="text-sm text-ink-500 mt-3">No sessions yet</p>
              <p className="text-xs text-ink-400 mt-1">Start a focus timer to begin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border border-ink-100 p-3"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.type === 'focus'
                        ? 'bg-primary-50 text-primary-600'
                        : s.type === 'longBreak'
                          ? 'bg-accent-50 text-accent-600'
                          : 'bg-success-50 text-success-600'
                      }`}
                  >
                    {s.type === 'focus' ? <Flame className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800">
                      {s.type === 'focus' ? 'Focus' : s.type === 'longBreak' ? 'Long Break' : 'Short Break'}
                    </p>
                    <p className="text-xs text-ink-400">
                      {new Date(s.completedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-ink-700">{s.durationMinutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
