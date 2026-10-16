// What's planned for each day of this week: every target's share of the day, strict and flexible,
// plus what's still unplanned. Seven days on desktop, three at a time on a phone.
import React, { useState } from 'react';
import { Icon } from './ui.jsx';
import { freeForDay, liveOn, logged } from '../budget.js';
import { tcolor } from '../store.js';
import { DAY_MS, DAY_NAMES, addDays, dayIndex, fmt, weekStart } from '../time.js';

const MIN_BLOCK = 46;
const TWO_LINES = 46; // below this a block shows name and time on one line

export default function WeekCalendar({ state, now, open, desktop }) {
  const ws = weekStart(now);
  const today = dayIndex(now);
  const [startIdx, setStartIdx] = useState(Math.min(today, 4));
  const shown = desktop ? [0, 1, 2, 3, 4, 5, 6] : [startIdx, startIdx + 1, startIdx + 2];

  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const date = addDays(ws, i);
    const d = date.getTime();
    const free = freeForDay(state.fixedCosts, i);
    const blocks = state.targets
      .map((t) => ({ t, mins: liveOn(state, t, d, now), got: logged(state, t.id, d, d + DAY_MS, now) }))
      .filter((b) => b.mins >= 1)
      .sort((a, b) => (a.t.slot === 'strict') === (b.t.slot === 'strict') ? b.mins - a.mins : a.t.slot === 'strict' ? -1 : 1);
    const planned = blocks.reduce((s, b) => s + b.mins, 0);
    return { i, date, d, free, blocks, planned, left: free - planned, past: d + DAY_MS <= now };
  });
  const maxFree = Math.max(...days.map((x) => Math.max(x.free, x.planned)), 60);
  const scale = (desktop ? 440 : 400) / maxFree; // px per minute

  return (
    <div className="card cal">
      <div className="split cal-head">
        <span className="lbl">Planned this week</span>
        <span className="cal-key small">
          <span><i className="k-strict" />Strict</span>
          <span><i className="k-flex" />Flexible</span>
        </span>
        {!desktop && (
          <span className="pager">
            <button type="button" className="ib soft" aria-label="Earlier days" disabled={startIdx === 0} onClick={() => setStartIdx(Math.max(0, startIdx - 1))}>
              <Icon.back />
            </button>
            <button type="button" className="ib soft" aria-label="Later days" disabled={startIdx === 4} onClick={() => setStartIdx(Math.min(4, startIdx + 1))}>
              <span style={{ transform: 'scaleX(-1)', display: 'flex' }}><Icon.back /></span>
            </button>
          </span>
        )}
      </div>
      <div className="cal-grid" style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}>
        {shown.map((idx) => {
          const day = days[idx];
          return (
            <section key={idx} className={idx === today ? 'cal-day today' : day.past ? 'cal-day past' : 'cal-day'} aria-label={DAY_NAMES[idx]}>
              <header className="cal-dh">
                <span className="strong">{DAY_NAMES[idx].slice(0, 3)} {day.date.getDate()}</span>
                <span className="muted tiny">{fmt(day.free)} free</span>
              </header>
              <div className="cal-col">
                {day.blocks.map(({ t, mins, got }) => {
                  const strict = t.slot === 'strict';
                  const c = tcolor(t);
                  const h = Math.max(MIN_BLOCK, mins * scale);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`cal-b${strict ? ' strict' : ''}${h < TWO_LINES ? ' one' : ''}`}
                      style={{ height: h, '--c': c }}
                      onClick={() => open({ name: 'target', id: t.id })}
                      title={`${t.name}: ${fmt(mins)} planned, ${fmt(got)} logged`}
                    >
                      <span className="cal-bn">
                        {strict && <Icon.lock />}
                        {t.name}
                      </span>
                      <span className="cal-bt">{fmt(mins)}</span>
                      {got > 0 && <span className="cal-bp" style={{ width: `${Math.min(100, (got / mins) * 100)}%` }} />}
                    </button>
                  );
                })}
                {day.left >= 1 ? (
                  <div className="cal-free" style={{ height: Math.max(28, day.left * scale) }}>
                    {fmt(day.left)} unplanned
                  </div>
                ) : day.left <= -1 ? (
                  <div className="cal-over">{fmt(-day.left)} over</div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
