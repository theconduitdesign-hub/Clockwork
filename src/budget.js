// The budgeting maths: fixed costs, free pools, scoped targets, logged time, pace and settling up.
//
// A target has a scope (daily, weekly or monthly) and an amount of hours for that scope.
// Each scope draws from its own pool: today's free time, this week's, or this month's.
// Weekly and monthly targets are spread across days in proportion to each day's free time.
import { DAY_MS, addDays, dayIndex, dayKey, monthKey, startOfDay, startOfMonth, weekKey, weekStart } from './time.js';

export const SCOPES = {
  daily: { label: 'Daily', per: 'a day', pool: "today's", noun: 'today', unit: 'Hours a day' },
  weekly: { label: 'Weekly', per: 'a week', pool: "this week's", noun: 'this week', unit: 'Hours a week' },
  monthly: { label: 'Monthly', per: 'a month', pool: "this month's", noun: 'this month', unit: 'Hours a month' },
};

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

// ---------- Ranges ----------

export function dayRange(now) {
  const s = startOfDay(now);
  return [s.getTime(), addDays(s, 1).getTime()];
}

export function weekRange(now) {
  const s = weekStart(now);
  return [s.getTime(), addDays(s, 7).getTime()];
}

export function monthRange(now) {
  const s = startOfMonth(now);
  const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
  return [s.getTime(), e.getTime()];
}

export function scopeRange(scope, now) {
  if (scope === 'daily') return dayRange(now);
  if (scope === 'monthly') return monthRange(now);
  return weekRange(now);
}

// The key a "done" mark is stored under for the period containing `now`.
export function periodKey(scope, now) {
  if (scope === 'daily') return `d:${dayKey(now)}`;
  if (scope === 'monthly') return `m:${monthKey(now)}`;
  return weekKey(now);
}

// Calls fn(dayStartMs, weekdayIndex) for each day in [from, to).
function eachDay(from, to, fn) {
  for (let d = startOfDay(from); d.getTime() < to; d = addDays(d, 1)) fn(d.getTime(), dayIndex(d));
}

// Free minutes between two timestamps (whole days).
export function freeBetween(fixedCosts, from, to) {
  let s = 0;
  eachDay(from, to, (_, idx) => (s += freeForDay(fixedCosts, idx)));
  return s;
}

// ---------- Plans ----------

// Minutes a target is planned for on the day starting at dayMs.
export function plannedOn(target, fixedCosts, dayMs) {
  const amount = (target.hours || 0) * 60;
  const free = freeForDay(fixedCosts, dayIndex(dayMs));
  if (target.scope === 'daily') return amount;
  if (target.scope === 'monthly') {
    const [ms, me] = monthRange(dayMs);
    const pool = freeBetween(fixedCosts, ms, me);
    return pool ? (amount * free) / pool : 0;
  }
  const total = weekFree(fixedCosts);
  return total ? (amount * free) / total : 0;
}

export function plannedBetween(target, fixedCosts, from, to) {
  let s = 0;
  eachDay(from, to, (d) => (s += plannedOn(target, fixedCosts, d)));
  return s;
}

export function dailyBudget(target, fixedCosts, now) {
  return plannedOn(target, fixedCosts, startOfDay(now).getTime());
}

export function weekBudget(target, fixedCosts, now) {
  const [from, to] = weekRange(now);
  return plannedBetween(target, fixedCosts, from, to);
}

// A scope's pool: free time in the period, what other targets already plan in it, what's left.
export function pool(state, scope, now, exceptId) {
  const [from, to] = scopeRange(scope, now);
  const free = freeBetween(state.fixedCosts, from, to);
  const planned = state.targets
    .filter((t) => t.id !== exceptId)
    .reduce((s, t) => s + plannedBetween(t, state.fixedCosts, from, to), 0);
  return { from, to, free, planned, left: free - planned };
}

// ---------- Logged time ----------

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

// Share of the free time in [from, to) that has already passed by `now` (0 to 1).
export function elapsedFraction(fixedCosts, from, to, now = Date.now()) {
  const total = freeBetween(fixedCosts, from, to);
  if (!total) return 0;
  let el = 0;
  eachDay(from, to, (d, idx) => {
    if (d + DAY_MS <= now) el += freeForDay(fixedCosts, idx);
    else if (d <= now) el += (freeForDay(fixedCosts, idx) * (now - d)) / DAY_MS;
  });
  return Math.min(1, el / total);
}

export function isDone(target, now) {
  return !!target.done?.[periodKey(target.scope, now)];
}

// Pace for a target in its own scope: on pace, ahead or behind, and a forecast.
export function pace(state, target, now = Date.now()) {
  const [from, to] = scopeRange(target.scope, now);
  const budget = plannedBetween(target, state.fixedCosts, from, to);
  const actual = logged(state, target.id, from, to, now);
  // Pace only counts time since the target existed: a target made mid-month isn't behind on day one.
  const start = Math.max(from, startOfDay(target.createdAt || from).getTime());
  const frac = elapsedFraction(state.fixedCosts, Math.min(start, to), to, now);
  const expected = budget * frac;
  const diff = actual - expected;
  const done = isDone(target, now);
  const slack = Math.max(10, budget * 0.05);
  let label = 'On pace';
  let tone = 'good';
  if (done) {
    label = 'Done';
    tone = 'gold';
  } else if (actual > budget + 0.5) {
    label = 'Over budget';
    tone = 'ink';
  } else if (diff > slack) {
    label = 'Ahead';
  } else if (diff < -slack) {
    label = `Behind by ${-diff >= 60 ? Math.round(-diff / 60) + ' h' : Math.round(-diff) + ' m'}`;
    tone = 'ink';
  }
  const projected = frac > 0.05 ? actual / frac : null;
  return { budget, actual, expected, diff, label, tone, projected, done, from, to };
}

// ---------- Settling up (weekly) ----------

// Minutes over a monthly budget, logged from the start of that month up to `upTo`.
function monthOverBy(state, t, monthStart, upTo, budget) {
  return Math.max(0, logged(state, t.id, monthStart, upTo) - budget);
}

function rowResult(state, t, from, to) {
  const fc = state.fixedCosts;
  if (t.scope === 'daily') {
    let saved = 0;
    let over = 0;
    eachDay(from, to, (d) => {
      const plan = plannedOn(t, fc, d);
      const got = logged(state, t.id, d, d + DAY_MS);
      if (got > plan) over += got - plan;
      else if (t.done?.[periodKey('daily', d)]) saved += plan - got;
    });
    return saved - over;
  }
  if (t.scope === 'monthly') {
    // A week can straddle two months: settle each month's slice separately.
    let result = 0;
    let cursor = from;
    while (cursor < to) {
      const [ms, me] = monthRange(cursor);
      const segEnd = Math.min(me, to);
      const budget = (t.hours || 0) * 60;
      result -= monthOverBy(state, t, ms, segEnd, budget) - monthOverBy(state, t, ms, cursor, budget);
      const doneAt = t.done?.[periodKey('monthly', cursor)];
      if (typeof doneAt === 'number' && doneAt >= cursor && doneAt < segEnd) {
        result += Math.max(0, budget - logged(state, t.id, ms, me));
      }
      cursor = segEnd;
    }
    return result;
  }
  const budget = plannedBetween(t, fc, from, to);
  const actual = logged(state, t.id, from, to);
  if (actual > budget + 0.5) return -(actual - budget);
  if (t.done?.[weekKey(from)] && budget - actual > 0.5) return budget - actual;
  return 0;
}

// Rows for a week's statement.
export function statementRows(state, ws, now = Date.now()) {
  const from = ws.getTime();
  const to = addDays(ws, 7).getTime();
  return state.targets
    .filter((t) => (t.createdAt || 0) < to)
    .map((t) => {
      const budget = plannedBetween(t, state.fixedCosts, from, to);
      const actual = logged(state, t.id, from, to, now);
      const result = rowResult(state, t, from, to);
      let kind;
      if (result < -0.5) kind = 'over';
      else if (result > 0.5) kind = 'saved';
      else if (actual >= budget - 0.5) kind = 'onbudget';
      else kind = 'carried';
      return { target: t, budget, actual, done: kind === 'saved', result, kind };
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
