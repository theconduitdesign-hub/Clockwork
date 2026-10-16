import React from 'react';
import { Bar, Header, Say } from '../components/ui.jsx';
import { logged, pace, weekFree, weekRange } from '../budget.js';
import { fmt } from '../time.js';
import { tcolor } from '../store.js';
import { useDesktop } from '../useDesktop.js';
import TargetDetail from './TargetDetail.jsx';

export function PaceTag({ p }) {
  return <span className={`pace ${p.tone}`}>{p.label}</span>;
}

export default function Targets(props) {
  const { state, now, open, sheet, selected, select } = props;
  const desktop = useDesktop();
  const current = desktop ? state.targets.find((t) => t.id === selected) || state.targets[0] : null;
  const [from, to] = weekRange(now);
  const free = weekFree(state.fixedCosts);
  const allocated = state.targets.reduce((s, t) => s + t.weeklyHours * 60, 0);
  return (
    <>
      <Header right={<button type="button" className={desktop ? 'btn hdr-btn' : 'pill-btn'} onClick={() => sheet({ name: 'targetForm' })}>{desktop ? '+ New target' : '+ New'}</button>}>
        <h1 className="d title-lg">Targets</h1>
        {desktop && state.targets.length > 0 && (
          <div className="muted">{fmt(allocated)} of {fmt(free)} allocated · {allocated <= free ? `${fmt(free - allocated)} buffer` : `${fmt(allocated - free)} over your pool`}</div>
        )}
      </Header>
      <main className="main">
        <div className={current ? 'dcols targets-cols' : 'stack'}>
        <div className="stack">
        {!state.targets.length && <Say>No targets yet. Give your hours somewhere to go: a project, a client, or rest you want protected.</Say>}
        {state.targets.map((t) => {
          const actual = logged(state, t.id, from, to, now);
          const p = pace(state, t, now);
          return (
            <button
              type="button"
              key={t.id}
              className={current?.id === t.id ? 'tcard on' : 'tcard'}
              aria-current={current?.id === t.id ? 'true' : undefined}
              onClick={() => (desktop ? select(t.id) : open({ name: 'target', id: t.id }))}
            >
              <span className="tc-top">
                <span className="d tc-name">{t.name}</span>
                {t.client && <span className="badge">Client</span>}
                {t.protected && <span className="badge">Protected</span>}
              </span>
              {t.doneWhen && <span className="muted small block">Done when: {t.doneWhen}</span>}
              <Bar value={actual} max={t.weeklyHours * 60} color={tcolor(t)} />
              <span className="split small">
                <span className="num">{fmt(actual)} of {fmt(t.weeklyHours * 60)}</span>
                <PaceTag p={p} />
              </span>
            </button>
          );
        })}
        </div>
        {current && <TargetDetail {...props} id={current.id} embedded />}
        </div>
        {!desktop && state.targets.length > 0 && (
          <p className="muted small center">
            {fmt(allocated)} of {fmt(free)} allocated · {allocated <= free ? `${fmt(free - allocated)} buffer` : `${fmt(allocated - free)} over your pool`}
          </p>
        )}
      </main>
    </>
  );
}
