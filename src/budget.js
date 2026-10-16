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
//
// Two views of a plan:
// - static: how a period's budget was spread when the period began (statements, totals, past days).
// - live: from today on, whatever the target still needs this period is re-spread over the days left,
//   so missing Tuesday quietly moves the work to Wednesday onwards instead of leaving you "behind".
//
// A target created part-way through a period gets a smaller first budget (target.start), and its
// plan covers only the days from its creation, so you're never behind for days before it existed.

export function periodOf(scope, ms) {
  const [from, to] = scopeRange(scope, ms);
  return { from, to, key: periodKey(scope, ms) };
}

// Minutes budgeted for the period with this key.
export function periodBudget(t, key) {
  if (t.start && t.start.key === key) return (t.start.hours || 0) * 60;
  return (t.hours || 0) * 60;
}

// The first day the plan covers in the period starting at `from`.
function effectiveFrom(t, from) {
  if (t.start && t.start.key === periodKey(t.scope, from) && t.createdAt) {
    return Math.max(from, startOfDay(t.createdAt).getTime());
  }
  return from;
}

// The moment a target's plan starts in a period: its creation time in its first period, else the period start.
function anchorOf(t, from, key) {
  return t.start && t.start.key === key && t.createdAt > from ? t.createdAt : from;
}

// Free minutes a day contributes from `anchor` on (only the creation day is partial).
function dayWeight(fixedCosts, dayMs, anchor) {
  return freeFromNow(fixedCosts, Math.max(dayMs, anchor), addDays(dayMs, 1).getTime());
}

// Static plan: minutes on the day starting at dayMs.
export function plannedOn(t, fixedCosts, dayMs) {
  const { from, to, key } = periodOf(t.scope, dayMs);
  const ef = effectiveFrom(t, from);
  if (dayMs < ef) return 0;
  const budget = periodBudget(t, key);
  if (t.scope === 'daily') return budget;
  const anchor = anchorOf(t, from, key);
  const poolFree = freeFromNow(fixedCosts, anchor, to);
  return poolFree ? (budget * dayWeight(fixedCosts, dayMs, anchor)) / poolFree : 0;
}

export function plannedBetween(t, fixedCosts, from, to) {
  let s = 0;
  eachDay(from, to, (d) => (s += plannedOn(t, fixedCosts, d)));
  return s;
}

// Live plan: today and later re-spread what's still needed this period.
export function liveOn(state, t, dayMs, now = Date.now()) {
  const fc = state.fixedCosts;
  const today = startOfDay(now).getTime();
  if (dayMs < today || t.scope === 'daily') return plannedOn(t, fc, dayMs);
  const { from, to, key } = periodOf(t.scope, dayMs);
  if (from > today) return plannedOn(t, fc, dayMs); // a future period: not started yet
  const ef = Math.max(effectiveFrom(t, from), today);
  if (dayMs < ef) return 0;
  const need = Math.max(0, periodBudget(t, key) - logged(state, t.id, from, today, now));
  const anchor = Math.max(today, anchorOf(t, from, key));
  const poolFree = freeFromNow(fc, anchor, to);
  return poolFree ? (need * dayWeight(fc, dayMs, anchor)) / poolFree : 0;
}

// Today's share for a target (live).
export function dailyBudget(state, t, now = Date.now()) {
  return liveOn(state, t, startOfDay(now).getTime(), now);
}

// This week's total for a target (static).
export function weekBudget(t, fixedCosts, now) {
  const [from, to] = weekRange(now);
  return plannedBetween(t, fixedCosts, from, to);
}

// Free minutes from `now` to `to`: what's left of today, plus every day after.
export function freeFromNow(fixedCosts, now, to) {
  const today = startOfDay(now).getTime();
  const tomorrow = addDays(today, 1).getTime();
  const dayLeft = 1 - (now - today) / DAY_MS;
  return freeForDay(fixedCosts, dayIndex(now)) * dayLeft + (to > tomorrow ? freeBetween(fixedCosts, tomorrow, to) : 0);
}

// The pool from now to the end of the scope: free time left, what other targets still need, what's left.
export function pool(state, scope, now = Date.now(), exceptId) {
  const fc = state.fixedCosts;
  const { from, to } = periodOf(scope, now);
  const today = startOfDay(now).getTime();
  const free = freeFromNow(fc, now, to);
  let planned = 0;
  for (const t of state.targets) {
    if (t.id === exceptId) continue;
    eachDay(today, to, (d) => {
      const plan = liveOn(state, t, d, now);
      planned += d === today ? Math.max(0, plan - logged(state, t.id, today, now, now)) : plan;
    });
  }
  const periodFree = freeBetween(fc, from, to);
  return { from, to, free, planned, left: free - planned, periodFree, fraction: periodFree ? Math.min(1, free / periodFree) : 0 };
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
  const { from, to, key } = periodOf(target.scope, now);
  const budget = periodBudget(target, key);
  const actual = logged(state, target.id, from, to, now);
  // Pace only counts free time since the target existed: a target made mid-week isn't behind on day one.
  const start = Math.min(to, Math.max(from, target.createdAt || from));
  const totalFree = freeFromNow(state.fixedCosts, start, to);
  const frac = totalFree ? Math.min(1, (totalFree - freeFromNow(state.fixedCosts, Math.max(now, start), to)) / totalFree) : 0;
  const expected = budget * frac;
  const diff = actual - expected;
  const done = isDone(target, now);
  const slack = Math.max(10, budget * 0.05);
  let label = 'On pace';
  let tone = 'good';
  if (done) {
    label = 'Done';
    tone = 'gold';
  } else if (budget === 0 && target.start?.key === key) {
    label = target.scope === 'daily' ? 'Starts tomorrow' : target.scope === 'monthly' ? 'Starts next month' : 'Starts Monday';
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
      const budget = periodBudget(t, periodKey('monthly', cursor));
      result -= monthOverBy(state, t, ms, segEnd, budget) - monthOverBy(state, t, ms, cursor, budget);
      const doneAt = t.done?.[periodKey('monthly', cursor)];
      if (typeof doneAt === 'number' && doneAt >= cursor && doneAt < segEnd) {
        result += Math.max(0, budget - logged(state, t.id, ms, me));
      }
      cursor = segEnd;
    }
    return result;
  }
  const budget = periodBudget(t, weekKey(from));
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
