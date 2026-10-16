import React from 'react';
import { Bar, Header, Icon, Say } from '../components/ui.jsx';
import { SCOPES, pace, weekBudget, weekFree } from '../budget.js';
import { checklistProgress } from '../components/Markdown.jsx';
import { fmt, monthName } from '../time.js';
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
  const free = weekFree(state.fixedCosts);
  const allocated = state.targets.reduce((s, t) => s + weekBudget(t, state.fixedCosts, now), 0);
  return (
    <>
      <Header right={<button type="button" className={desktop ? 'btn hdr-btn' : 'pill-btn'} onClick={() => sheet({ name: 'targetForm' })}>{desktop ? '+ New target' : '+ New'}</button>}>
        <h1 className="d title-lg">Targets</h1>
        {desktop && state.targets.length > 0 && (
          <div className="muted">This week: {fmt(allocated)} of {fmt(free)} planned · {allocated <= free ? `${fmt(free - allocated)} buffer` : `${fmt(allocated - free)} over your pool`}</div>
        )}
      </Header>
      <main className="main">
        <div className={current ? 'dcols targets-cols' : 'stack'}>
        <div className="stack">
        {!state.targets.length && <Say>No targets yet. Give your hours somewhere to go: a project, a client, or rest you want protected.</Say>}
        {state.targets.map((t) => {
          const p = pace(state, t, now);
          const checks = checklistProgress(t.doneWhen);
          const firstLine = (t.doneWhen || '').split('\n').find((l) => l.trim() && !/^\s*[-*]\s+\[/.test(l));
          const noun = t.scope === 'monthly' ? `in ${monthName(now)}` : SCOPES[t.scope].noun;
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
                {t.slot === 'strict' && <span className="badge strict"><Icon.lock />Strict</span>}
              </span>
              <span className="muted small block">
                {SCOPES[t.scope].label}
                {firstLine ? ` · ${firstLine.replace(/^#+\s*/, '').replace(/[*_`]/g, '')}` : ''}
                {checks.total ? ` · ${checks.done}/${checks.total} ticked` : ''}
              </span>
              <Bar value={p.actual} max={p.budget} color={tcolor(t)} />
              <span className="split small">
                <span className="num">{fmt(p.actual)} of {fmt(p.budget)} {noun}</span>
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
            This week: {fmt(allocated)} of {fmt(free)} planned · {allocated <= free ? `${fmt(free - allocated)} buffer` : `${fmt(allocated - free)} over your pool`}
          </p>
        )}
      </main>
    </>
  );
}
