// Date and duration helpers. Weeks start on Monday. Durations are in minutes.

export const DAY_MS = 86400000;
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// 0 = Monday ... 6 = Sunday
export function dayIndex(d = new Date()) {
  return (new Date(d).getDay() + 6) % 7;
}

export function weekStart(d = new Date()) {
  const x = startOfDay(d);
  return addDays(x, -dayIndex(x));
}

export function weekKey(d = new Date()) {
  const s = weekStart(d);
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
}

export function dateLabel(d) {
  const x = new Date(d);
  return `${x.getDate()} ${MONTHS[x.getMonth()]}`;
}

export function weekRangeLabel(ws) {
  const end = addDays(ws, 6);
  if (ws.getMonth() === end.getMonth()) return `${ws.getDate()} to ${end.getDate()} ${MONTHS[end.getMonth()]}`;
  return `${dateLabel(ws)} to ${dateLabel(end)}`;
}

// Minutes → "2 h 30 m"
export function fmt(min) {
  const m = Math.round(Math.max(0, min));
  if (m === 0) return '0 m';
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} m`;
  if (!r) return `${h} h`;
  return `${h} h ${r} m`;
}

// Signed minutes → "+2 h" / "−30 m"
export function fmtSigned(min) {
  if (Math.round(min) === 0) return '0 h';
  return `${min > 0 ? '+' : '−'}${fmt(Math.abs(min))}`;
}

// Milliseconds → "1:20:34"
export function fmtClock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function greeting(now = new Date()) {
  const h = new Date(now).getHours();
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
}
