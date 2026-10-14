import React from 'react';
import { Bar, Header, Say } from '../components/ui.jsx';
import { logged, pace, weekFree, weekRange } from '../budget.js';
import { fmt } from '../time.js';

export function PaceTag({ p }) {
  return <span className={`pace ${p.tone}`}>{p.label}</span>;
}

export default function Targets({ state, now, open, sheet }) {
  const [from, to] = weekRange(now);
  const free = weekFree(state.fixedCosts);
  const allocated = state.targets.reduce((s, t) => s + t.weeklyHours * 60, 0);
  return (
    <>
      <Header right={<button type="button" className="pill-btn" onClick={() => sheet({ name: 'targetForm' })}>+ New</button>}>
        <h1 className="d title-lg">Targets</h1>
      </Header>
      <main className="main">
        {!state.targets.length && <Say>No targets yet. Give your hours somewhere to go: a project, a client, or rest you want protected.</Say>}
        {state.targets.map((t) => {
          const actual = logged(state, t.id, from, to, now);
          const p = pace(state, t, now);
          return (
            <button type="button" key={t.id} className="tcard" onClick={() => open({ name: 'target', id: t.id })}>
              <span className="tc-top">
                <span className="d tc-name">{t.name}</span>
                {t.client && <span className="badge">Client</span>}
                {t.protected && <span className="badge">Protected</span>}
              </span>
              {t.doneWhen && <span className="muted small block">Done when: {t.doneWhen}</span>}
              <Bar value={actual} max={t.weeklyHours * 60} color={t.color} />
              <span className="split small">
                <span className="num">{fmt(actual)} of {fmt(t.weeklyHours * 60)}</span>
                <PaceTag p={p} />
              </span>
            </button>
          );
        })}
        {state.targets.length > 0 && (
          <p className="muted small center">
            {fmt(allocated)} of {fmt(free)} allocated · {allocated <= free ? `${fmt(free - allocated)} buffer` : `${fmt(allocated - free)} over your pool`}
          </p>
        )}
      </main>
    </>
  );
}
