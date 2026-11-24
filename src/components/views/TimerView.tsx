import { Coffee, Pause, Play, RotateCcw, Settings, Timer as TimerIcon, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store';
import type { SessionType, TimerSettings } from '@/types';

type Mode = SessionType;

const MODE_META: Record<
  Mode,
  { label: string; ring: string; track: string; bg: string; text: string; icon: typeof TimerIcon; description: string }
> = {
  focus: {
    label: 'Focus',
    ring: 'text-primary-500',
    track: 'text-ink-200',
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    icon: TimerIcon,
    description: 'Time to concentrate. Eliminate distractions.',
  },
  shortBreak: {
    label: 'Short Break',
    ring: 'text-success-500',
    track: 'text-ink-200',
    bg: 'bg-success-50',
    text: 'text-success-700',
    icon: Coffee,
    description: 'A quick breather. Stretch, hydrate, rest your eyes.',
  },
  longBreak: {
    label: 'Long Break',
    ring: 'text-accent-500',
    track: 'text-ink-200',
    bg: 'bg-accent-50',
    text: 'text-accent-700',
    icon: Coffee,
    description: 'A longer rest to fully recharge before the next focus block.',
  },
};

const MODE_ORDER: Mode[] = ['focus', 'shortBreak', 'longBreak'];
const SETTINGS_KEY: Record<Mode, keyof TimerSettings> = {
  focus: 'focus',
  shortBreak: 'shortBreak',
  longBreak: 'longBreak',
};

function modeToSeconds(mode: Mode, settings: TimerSettings): number {
  return settings[SETTINGS_KEY[mode]] * 60;
}

export default function TimerView() {
  const { recordSession, timerSettings, updateTimerSettings } = useStore();
  const [mode, setMode] = useState<Mode>('focus');
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(timerSettings.focus * 60);
  const [sessionTotal, setSessionTotal] = useState(timerSettings.focus * 60);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftSettings, setDraftSettings] = useState<TimerSettings>(timerSettings);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number | null>(null);

  const config = MODE_META[mode];
  const progress = sessionTotal > 0 ? ((sessionTotal - secondsLeft) / sessionTotal) * 100 : 0;

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // When settings change while idle and untouched, update the current countdown
  useEffect(() => {
    if (running) return;
    const newDur = modeToSeconds(mode, timerSettings);
    // If timer hasn't been started yet (still at full) or is at 0 (complete), adopt the new duration
    if (secondsLeft === sessionTotal || secondsLeft === 0) {
      setSessionTotal(newDur);
      setSecondsLeft(newDur);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSettings, mode]);

  // Countdown effect
  useEffect(() => {
    if (!running) {
      stopInterval();
      return;
    }
    sessionStartRef.current = sessionStartRef.current ?? Date.now();
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopInterval();
          setRunning(false);
          if (sessionStartRef.current !== null) {
            recordSession({
              type: mode,
              durationMinutes: Math.round(sessionTotal / 60),
              startedAt: sessionStartRef.current,
              completedAt: Date.now(),
            });
            sessionStartRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return stopInterval;
  }, [running, stopInterval, mode, sessionTotal, recordSession]);

  const switchMode = (newMode: Mode) => {
    stopInterval();
    setRunning(false);
    sessionStartRef.current = null;
    const dur = modeToSeconds(newMode, timerSettings);
    setMode(newMode);
    setSessionTotal(dur);
    setSecondsLeft(dur);
  };

  const handleStart = () => setRunning(true);
  const handlePause = () => setRunning(false);

  const handleReset = () => {
    stopInterval();
    setRunning(false);
    sessionStartRef.current = null;
    const dur = modeToSeconds(mode, timerSettings);
    setSessionTotal(dur);
    setSecondsLeft(dur);
  };

  const openSettings = () => {
    setDraftSettings(timerSettings);
    setSettingsOpen(true);
  };

  const handleDraftChange = (key: keyof TimerSettings, value: number) => {
    const clamped = Math.max(1, Math.min(120, Math.floor(value) || 1));
    setDraftSettings((prev) => ({ ...prev, [key]: clamped }));
  };

  const saveSettings = () => {
    updateTimerSettings(draftSettings);
    setSettingsOpen(false);
  };

  const resetSettings = () => {
    setDraftSettings({ focus: 25, shortBreak: 5, longBreak: 15 });
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const circumference = 2 * Math.PI * 130;
  const dashOffset = circumference - (progress / 100) * circumference;

  const settingsFields: { key: keyof TimerSettings; label: string; icon: typeof TimerIcon; color: string }[] = [
    { key: 'focus', label: 'Focus', icon: TimerIcon, color: 'text-primary-600' },
    { key: 'shortBreak', label: 'Short Break', icon: Coffee, color: 'text-success-600' },
    { key: 'longBreak', label: 'Long Break', icon: Coffee, color: 'text-accent-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink-900">Pomodoro Timer</h2>
          <p className="text-sm text-ink-500 mt-1">Customize your focus and break durations</p>
        </div>
        <button onClick={openSettings} className="btn-secondary">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center gap-1 rounded-xl bg-white border border-ink-200 p-1.5 w-fit mx-auto sm:mx-0 overflow-x-auto">
        {MODE_ORDER.map((m) => {
          const cfg = MODE_META[m];
          const Icon = cfg.icon;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                mode === m
                  ? `${cfg.bg} ${cfg.text} shadow-soft`
                  : 'text-ink-500 hover:text-ink-700 hover:bg-ink-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Timer card */}
      <div className="card p-5 sm:p-12">
        <div className="flex flex-col items-center">
          {/* Circular timer */}
          <div className="relative flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="-rotate-90 w-full max-w-[300px] h-auto">
              <circle
                cx="150"
                cy="150"
                r="130"
                fill="none"
                strokeWidth="14"
                className={config.track}
                stroke="currentColor"
              />
              <circle
                cx="150"
                cy="150"
                r="130"
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                className={config.ring}
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`flex items-center gap-1.5 mb-2 ${config.text}`}>
                <config.icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
              </div>
              <span className="font-mono text-5xl sm:text-6xl font-bold text-ink-900 tabular-nums tracking-tight">
                {display}
              </span>
              <span className="text-sm text-ink-400 mt-2">
                {running ? 'In progress...' : secondsLeft === 0 ? 'Complete!' : 'Ready to start'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {!running ? (
              <button onClick={handleStart} className="btn-primary px-8 py-3 text-base" disabled={secondsLeft === 0}>
                <Play className="h-5 w-5" />
                Start
              </button>
            ) : (
              <button onClick={handlePause} className="btn-secondary px-8 py-3 text-base">
                <Pause className="h-5 w-5" />
                Pause
              </button>
            )}
            <button onClick={handleReset} className="btn-ghost px-6 py-3 text-base">
              <RotateCcw className="h-5 w-5" />
              Reset
            </button>
          </div>

          <p className="text-sm text-ink-500 mt-6 text-center max-w-xs">{config.description}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <TimerIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Focus Duration</p>
            <p className="text-lg font-bold text-ink-900">{timerSettings.focus} min</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 text-success-600">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Short Break</p>
            <p className="text-lg font-bold text-ink-900">{timerSettings.shortBreak} min</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <Coffee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-500">Long Break</p>
            <p className="text-lg font-bold text-ink-900">{timerSettings.longBreak} min</p>
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setSettingsOpen(false)}
          />
          <div className="relative card w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Settings className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink-900">Timer Settings</h3>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-all"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-ink-500 mb-5">
              Set your preferred durations in minutes. Changes apply when the next session starts and won't interrupt a running timer.
            </p>

            <div className="space-y-4">
              {settingsFields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key}>
                    <label className="flex items-center gap-2 mb-1.5">
                      <Icon className={`h-4 w-4 ${field.color}`} />
                      <span className="text-sm font-medium text-ink-700">{field.label}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={draftSettings[field.key]}
                        onChange={(e) => handleDraftChange(field.key, Number(e.target.value))}
                        className="input w-24 text-center font-mono font-semibold"
                      />
                      <input
                        type="range"
                        min={1}
                        max={60}
                        value={Math.min(draftSettings[field.key], 60)}
                        onChange={(e) => handleDraftChange(field.key, Number(e.target.value))}
                        className="flex-1 accent-primary-600"
                      />
                      <span className="text-sm text-ink-500 w-10 text-right">min</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={resetSettings} className="btn-ghost text-sm">
                <RotateCcw className="h-4 w-4" />
                Reset to defaults
              </button>
              <div className="flex gap-2">
                <button onClick={() => setSettingsOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button onClick={saveSettings} className="btn-primary">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
