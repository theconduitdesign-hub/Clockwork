// App state, kept in this browser's localStorage. Durations are minutes; times are epoch ms.
// The storage key keeps its original name so existing data carries over.
import { useEffect, useReducer, useState } from 'react';

const KEY = 'clockwork.v1';

export const COLORS = ['#0E6B6B', '#14201F', '#4E9C97', '#6E8C8A', '#2F5D7C', '#8A6E4B', '#5B4B7A'];

// A target's colour follows the theme: stored palette colours map to the theme's --c0 … --c6.
export function tcolor(t) {
  const i = COLORS.indexOf(t.color);
  return i >= 0 ? `var(--c${i})` : t.color;
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function initialState() {
  return {
    version: 1,
    onboarded: false,
    theme: 'teal',
    fixedCosts: [
      { id: uid(), name: 'Sleep', hours: 8, days: 'everyday' },
      { id: uid(), name: 'Work', hours: 8, days: 'weekdays' },
      { id: uid(), name: 'Meals', hours: 2, days: 'everyday' },
    ],
    targets: [],
    entries: [],
    timer: null,
    savings: { balance: 0, debt: 0, goals: [], settled: {} },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      const base = initialState();
      return { ...base, ...saved, savings: { ...base.savings, ...(saved.savings || {}) } };
    }
  } catch {
    // Storage unavailable or corrupt: start fresh.
  }
  return initialState();
}

function stopTimer(s) {
  if (!s.timer) return s;
  const end = Date.now();
  const entries = end - s.timer.start >= 60000
    ? [...s.entries, { id: uid(), targetId: s.timer.targetId, start: s.timer.start, end }]
    : s.entries;
  return { ...s, entries, timer: null };
}

function reducer(s, a) {
  switch (a.type) {
    case 'setFixed':
      return { ...s, fixedCosts: a.list };
    case 'setTheme':
      return { ...s, theme: a.theme };
    case 'finishOnboarding':
      return { ...s, onboarded: true };
    case 'addTarget':
      return {
        ...s,
        targets: [
          ...s.targets,
          { id: uid(), createdAt: Date.now(), color: COLORS[s.targets.length % COLORS.length], done: {}, ...a.target },
        ],
      };
    case 'updateTarget':
      return { ...s, targets: s.targets.map((t) => (t.id === a.id ? { ...t, ...a.patch } : t)) };
    case 'deleteTarget':
      return {
        ...s,
        targets: s.targets.filter((t) => t.id !== a.id),
        entries: s.entries.filter((e) => e.targetId !== a.id),
        timer: s.timer?.targetId === a.id ? null : s.timer,
      };
    case 'toggleDone':
      return {
        ...s,
        targets: s.targets.map((t) => (t.id === a.id ? { ...t, done: { ...t.done, [a.wk]: !t.done?.[a.wk] } } : t)),
      };
    case 'startTimer': {
      const stopped = stopTimer(s);
      return { ...stopped, timer: { targetId: a.targetId, start: Date.now() } };
    }
    case 'stopTimer':
      return stopTimer(s);
    case 'addEntry':
      return { ...s, entries: [...s.entries, { id: uid(), ...a.entry }] };
    case 'deleteEntry':
      return { ...s, entries: s.entries.filter((e) => e.id !== a.id) };
    case 'settle': {
      if (s.savings.settled[a.wk]) return s;
      let { balance, debt } = s.savings;
      const net = a.net;
      if (net >= 0) {
        const pay = Math.min(debt, net);
        debt -= pay;
        balance += net - pay;
      } else {
        const need = -net;
        const take = Math.min(balance, need);
        balance -= take;
        debt += need - take;
      }
      return {
        ...s,
        savings: { ...s.savings, balance, debt, settled: { ...s.savings.settled, [a.wk]: { net, at: Date.now() } } },
      };
    }
    case 'addGoal':
      return {
        ...s,
        savings: { ...s.savings, goals: [...s.savings.goals, { id: uid(), name: a.name, targetMin: a.targetMin, saved: 0 }] },
      };
    case 'fundGoal': {
      const g = s.savings.goals.find((x) => x.id === a.id);
      if (!g) return s;
      const amt = Math.min(a.min, s.savings.balance, g.targetMin - g.saved);
      if (amt <= 0) return s;
      return {
        ...s,
        savings: {
          ...s.savings,
          balance: s.savings.balance - amt,
          goals: s.savings.goals.map((x) => (x.id === a.id ? { ...x, saved: x.saved + amt } : x)),
        },
      };
    }
    case 'deleteGoal': {
      const g = s.savings.goals.find((x) => x.id === a.id);
      if (!g) return s;
      return {
        ...s,
        savings: {
          ...s.savings,
          balance: s.savings.balance + g.saved,
          goals: s.savings.goals.filter((x) => x.id !== a.id),
        },
      };
    }
    case 'spendGoal':
      return { ...s, savings: { ...s.savings, goals: s.savings.goals.filter((x) => x.id !== a.id) } };
    case 'import': {
      const base = initialState();
      return { ...base, ...a.state, savings: { ...base.savings, ...(a.state.savings || {}) } };
    }
    case 'reset':
      return initialState();
    default:
      return s;
  }
}

export function useStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Ignore: private mode or storage full.
    }
  }, [state]);
  return [state, dispatch];
}

export function useNow(interval) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
