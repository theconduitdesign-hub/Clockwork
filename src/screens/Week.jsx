import React from 'react';
import { Header, Icon, IconButton, Logo, Ring } from '../components/ui.jsx';
import { freeForDay, logged, weekFree, weekRange } from '../budget.js';
import { tcolor } from '../store.js';
import { DAY_LETTERS, DAY_MS, addDays, dayIndex, fmt, weekRangeLabel, weekStart } from '../time.js';

export default function Week({ state, now, open }) {
  const ws = weekStart(now);
  const [from, to] = weekRange(now);
  const free = weekFree(state.fixedCosts);
  const allocated = state.targets.reduce((s, t) => s + t.weeklyHours * 60, 0);
  const buffer = Math.max(0, free - allocated);
  const total = Math.max(free, allocated);
  const segments = [
    ...state.targets.map((t) => ({ value: t.weeklyHours * 60, color: tcolor(t) })),
    { value: buffer, color: 'rgba(20,32,31,0.06)' },
  ];
  const today = dayIndex(now);
  const maxFree = Math.max(...[0, 1, 2, 3, 4, 5, 6].map((i) => freeForDay(state.fixedCosts, i)), 1);

  return (
    <>
      <Header
        left={<Logo size={40} />}
        right={<IconButton label="Settings" onClick={() => open({ name: 'settings' })}><Icon.settings /></IconButton>}
      >
        <div className="d title">This week</div>
        <div className="muted small">{weekRangeLabel(ws)}</div>
      </Header>
      <main className="main">
        <div className="card ring-card">
          <Ring size={140} stroke={14} total={total} segments={segments} label={`${fmt(free)} free pool, ${fmt(allocated)} allocated`}>
            <div className="d mid-num">{Math.round(free / 60)} h</div>
            <div className="muted tiny">free pool</div>
          </Ring>
          <div className="legend">
            {state.targets.map((t) => (
              <button type="button" key={t.id} className="lg" onClick={() => open({ name: 'target', id: t.id })}>
                <span className="dot" style={{ background: tcolor(t) }} />
                <b>{t.name}</b>
                <span>{Math.round(logged(state, t.id, from, to, now) / 6) / 10} / {t.weeklyHours}</span>
              </button>
            ))}
            <div className="lg">
              <span className="dot" style={{ background: 'rgba(20,32,31,0.15)' }} />
              <b>Buffer</b>
              <span>{Math.round(buffer / 6) / 10}</span>
            </div>
            <div className="muted tiny">Hours spent / budgeted</div>
          </div>
        </div>
        {allocated > free && <p className="note">You've allocated {fmt(allocated - free)} more than your free pool. Something will have to give.</p>}
        <div className="card">
          <div className="split">
            <span className="lbl">By day</span>
            <span className="muted tiny">Logged of free hours</span>
          </div>
          <div className="days">
            {DAY_LETTERS.map((l, i) => {
              const f = freeForDay(state.fixedCosts, i);
              const ds = addDays(ws, i).getTime();
              const lg = logged(state, null, ds, ds + DAY_MS, now);
              const h = (f / maxFree) * 120;
              return (
                <div className="day" key={i}>
                  <div className={i === today ? 'col today' : 'col'} style={{ height: Math.max(6, h) }} title={`${fmt(lg)} of ${fmt(f)}`}>
                    <div style={{ height: `${f ? Math.min(100, (lg / f) * 100) : 0}%` }} />
                  </div>
                  <span className={i === today ? 'dl on' : 'dl'}>{l}</span>
                </div>
              );
            })}
          </div>
          <div className="muted small">
            Today: {fmt(logged(state, null, addDays(ws, today).getTime(), addDays(ws, today + 1).getTime(), now))} of {fmt(freeForDay(state.fixedCosts, today))}
          </div>
        </div>
        <button type="button" className="btn2" onClick={() => open({ name: 'statement' })}>Week statement</button>
      </main>
    </>
  );
}
