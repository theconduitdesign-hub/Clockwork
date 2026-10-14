// The budgeting maths: fixed costs, free pool, daily allocations, logged time, pace and settling up.
import { DAY_MS, addDays, dayIndex, startOfDay, weekKey, weekStart } from './time.js';

function applies(days, idx) {
  if (days === 'weekdays') return idx < 5;
  if (days === 'weekends') return idx >= 5;
  return true;
}

// Fixed minutes on a given weekday (0 = Monday)
export function fixedForDay(fixedCosts, idx) {
  return fixedCosts.reduce((sum, f) => sum + (applies(f.days, idx) ? f.hours * 60 : 0), 0);
}

export function freeForDay(fixedCosts, idx) {
  return Math.max(0, 1440 - fixedForDay(fixedCosts, idx));
}

export function weekFixed(fixedCosts) {
  let s = 0;
  for (let i = 0; i < 7; i++) s += Math.min(1440, fixedForDay(fixedCosts, i));
  return s;
}

export function weekFree(fixedCosts) {
  let s = 0;
  for (let i = 0; i < 7; i++) s += freeForDay(fixedCosts, i);
  return s;
}

// A target's weekly budget is spread across days in proportion to each day's free time.
export function dailyBudget(target, fixedCosts, idx) {
  const total = weekFree(fixedCosts);
  if (!total) return 0;
  return (target.weeklyHours * 60 * freeForDay(fixedCosts, idx)) / total;
}

function overlap(start, end, from, to) {
  return Math.max(0, Math.min(end, to) - Math.max(start, from));
}

// Minutes logged between two timestamps, including a running timer. targetId null = all targets.
export function logged(state, targetId, from, to, now = Date.now()) {
  let ms = 0;
  for (const e of state.entries) {
    if (!targetId || e.targetId === targetId) ms += overlap(e.start, e.end, from, to);
  }
  const t = state.timer;
  if (t && (!targetId || t.targetId === targetId)) ms += overlap(t.start, now, from, to);
  return ms / 60000;
}

export function dayRange(now) {
  const s = startOfDay(now).getTime();
  return [s, s + DAY_MS];
}

export function weekRange(now) {
  const s = weekStart(now);
  return [s.getTime(), addDays(s, 7).getTime()];
}

// Share of this week's free time that has already passed (0 to 1).
export function elapsedFraction(fixedCosts, now = Date.now()) {
  const total = weekFree(fixedCosts);
  if (!total) return 0;
  const idx = dayIndex(now);
  let el = 0;
  for (let i = 0; i < idx; i++) el += freeForDay(fixedCosts, i);
  const dayFrac = (now - startOfDay(now).getTime()) / DAY_MS;
  el += freeForDay(fixedCosts, idx) * dayFrac;
  return Math.min(1, el / total);
}

// Pace for a target this week: on pace, ahead or behind, and a forecast line.
export function pace(state, target, now = Date.now()) {
  const [from, to] = weekRange(now);
  const budget = target.weeklyHours * 60;
  const actual = logged(state, target.id, from, to, now);
  const frac = elapsedFraction(state.fixedCosts, now);
  const expected = budget * frac;
  const diff = actual - expected;
  const done = !!target.done?.[weekKey(now)];
  let label = 'On pace';
  let tone = 'good';
  if (done) {
    label = 'Done';
    tone = 'gold';
  } else if (actual > budget) {
    label = 'Over budget';
    tone = 'ink';
  } else if (diff > 30) {
    label = 'Ahead';
  } else if (diff < -30) {
    label = `Behind by ${Math.round(-diff / 60) >= 1 ? Math.round(-diff / 60) + ' h' : Math.round(-diff) + ' m'}`;
    tone = 'ink';
  }
  const projected = frac > 0.05 ? actual / frac : null;
  return { budget, actual, expected, diff, label, tone, projected, done };
}

// Rows for a week's statement.
export function statementRows(state, ws, now = Date.now()) {
  const from = ws.getTime();
  const to = addDays(ws, 7).getTime();
  const wk = weekKey(ws);
  return state.targets
    .filter((t) => (t.createdAt || 0) < to)
    .map((t) => {
      const budget = t.weeklyHours * 60;
      const actual = logged(state, t.id, from, to, now);
      const done = !!t.done?.[wk];
      let result = 0;
      let kind;
      if (actual > budget + 0.5) {
        result = -(actual - budget);
        kind = 'over';
      } else if (done && budget - actual > 0.5) {
        result = budget - actual;
        kind = 'saved';
      } else if (actual >= budget - 0.5) {
        kind = 'onbudget';
      } else {
        kind = 'carried';
      }
      return { target: t, budget, actual, done, result, kind };
    });
}

export function streak(state, now = Date.now()) {
  let count = 0;
  let ws = addDays(weekStart(now), -7);
  for (let i = 0; i < 520; i++) {
    const s = state.savings.settled[weekKey(ws)];
    if (!s || s.net < 0) break;
    count++;
    ws = addDays(ws, -7);
  }
  return count;
}
