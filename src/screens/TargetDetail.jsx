import React from 'react';
import { Header, Icon, IconButton, Say } from '../components/ui.jsx';
import { PaceTag } from './Targets.jsx';
import { SCOPES, logged, pace, periodKey, plannedOn } from '../budget.js';
import Markdown, { checklistProgress } from '../components/Markdown.jsx';
import { tcolor } from '../store.js';
import { DAY_LETTERS, DAY_MS, DAY_NAMES, addDays, dayIndex, fmt, monthName, weekStart } from '../time.js';

export default function TargetDetail({ state, dispatch, now, back, sheet, id, embedded }) {
  const t = state.targets.find((x) => x.id === id);
  if (!t) {
    return (
      <>
        <Header left={<IconButton label="Back" onClick={back}><Icon.back /></IconButton>} />
        <main className="main"><Say>That target no longer exists.</Say></main>
      </>
    );
  }
  const ws = weekStart(now);
  const key = periodKey(t.scope, now);
  const noun = t.scope === 'monthly' ? `in ${monthName(now)}` : SCOPES[t.scope].noun;
  const byEnd = t.scope === 'daily' ? 'by tonight' : t.scope === 'monthly' ? `by the end of ${monthName(now)}` : 'by Sunday';
  const checks = checklistProgress(t.doneWhen);
  const p = pace(state, t, now);
  const left = p.budget - p.actual;
  const today = dayIndex(now);

  let line;
  if (p.done) line = left > 0 ? `Done, with ${fmt(left)} to spare. That goes to savings when the week settles.` : 'Done. Well budgeted.';
  else if (checks.total && checks.done === checks.total) line = `Every box is ticked. Mark it done and the ${fmt(Math.max(0, left))} left goes to savings.`;
  else if (p.actual > p.budget) line = `${fmt(p.actual - p.budget)} over budget. It'll be borrowed from savings when the week settles.`;
  else if (p.projected == null) line = 'Early days. Log some time and I will forecast your pace.';
  else if (p.projected >= p.budget - 1) line = `At this pace you'll reach ${fmt(p.budget)} ${byEnd}. Right on time.`;
  else line = `At this pace you'll land around ${fmt(p.projected)}. ${fmt(p.budget - p.projected)} to catch up.`;

  const days = DAY_LETTERS.map((l, i) => {
    const ds = addDays(ws, i).getTime();
    return { l, plan: plannedOn(t, state.fixedCosts, ds), done: logged(state, t.id, ds, ds + DAY_MS, now) };
  });
  const maxH = Math.max(...days.map((d) => Math.max(d.plan, d.done)), 1);
  const entries = state.entries
    .filter((e) => e.targetId === t.id && e.end > ws.getTime())
    .sort((a, b) => b.start - a.start)
    .slice(0, 8);

  const edit = <button type="button" className="btn-text tight" onClick={() => sheet({ name: 'targetForm', id: t.id })}>Edit</button>;
  const body = (
    <>
        <div>
          <div className="split">
            {embedded ? (
              <>
                <span className="split-l">
                  <h2 className="d h1">{t.name}</h2>
                  <PaceTag p={p} />
                </span>
                {edit}
              </>
            ) : (
              <>
                <h1 className="d h1-lg">{t.name}</h1>
                <PaceTag p={p} />
              </>
            )}
          </div>
          <div className="tags">
            <span className="tag-scope">{SCOPES[t.scope].label} · {fmt(t.hours * 60)} {SCOPES[t.scope].per}</span>
            {t.slot === 'strict' && <span className="badge strict"><Icon.lock />Strict</span>}
            {t.client && <span className="badge">Client</span>}
          </div>
        </div>
        {t.doneWhen && (
          <div className="card done-when">
            <div className="split">
              <span className="lbl">Done when</span>
              {checks.total > 0 && <span className="muted small num">{checks.done} of {checks.total}</span>}
            </div>
            <Markdown source={t.doneWhen} onChange={(md) => dispatch({ type: 'updateTarget', id: t.id, patch: { doneWhen: md } })} />
          </div>
        )}
        <div className="stats">
          <div><div className="lbl">Budget {noun}</div><div className="d">{fmt(p.budget)}</div></div>
          <div><div className="lbl">Spent</div><div className="d">{fmt(p.actual)}</div></div>
          <div><div className="lbl">{left >= 0 ? 'Left' : 'Over'}</div><div className="d">{fmt(Math.abs(left))}</div></div>
        </div>
        {t.client && Number(t.rate) > 0 && (
          <div className="card split">
            <span className="strong">Billable {noun}</span>
            <span className="d big-num">{Math.round((p.actual / 60) * Number(t.rate)).toLocaleString()}</span>
          </div>
        )}
        <Say>{line}</Say>
        <div className="card">
          <div className="lbl">This week: planned vs logged</div>
          <div className="days">
            {days.map((d, i) => (
              <div className="day" key={i} title={`${DAY_NAMES[i]}: ${fmt(d.done)} of ${fmt(d.plan)}`}>
                <div className="pair">
                  <div className="plan" style={{ height: Math.max(4, (d.plan / maxH) * 100) }} />
                  <div className="done" style={{ height: Math.max(d.done > 0 ? 4 : 0, (d.done / maxH) * 100), background: tcolor(t) }} />
                </div>
                <span className={i === today ? 'dl on' : 'dl'}>{d.l}</span>
              </div>
            ))}
          </div>
          <div className="key">
            <span><i className="k-plan" />Planned</span>
            <span><i className="k-done" style={{ background: tcolor(t) }} />Logged</span>
          </div>
        </div>
        {entries.length > 0 && (
          <div className="card list">
            <div className="lbl" style={{ paddingTop: 12 }}>This week's entries</div>
            {entries.map((e) => (
              <div className="li" key={e.id}>
                <span>
                  {DAY_NAMES[dayIndex(e.start)].slice(0, 3)} {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="li-right">
                  <span className="num">{fmt((e.end - e.start) / 60000)}</span>
                  <IconButton label="Delete entry" className="ghost" onClick={() => dispatch({ type: 'deleteEntry', id: e.id })}>
                    <Icon.trash />
                  </IconButton>
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="row-2">
          <button type="button" className="btn2" onClick={() => sheet({ name: 'log', targetId: t.id })}>+ Log time</button>
          {state.timer?.targetId === t.id ? (
            <button type="button" className="btn2" onClick={() => dispatch({ type: 'stopTimer' })}>Stop timer</button>
          ) : (
            <button type="button" className="btn2" onClick={() => dispatch({ type: 'startTimer', targetId: t.id })}>Start timer</button>
          )}
        </div>
        <div>
          <button type="button" className={p.done ? 'btn2' : 'btn'} onClick={() => dispatch({ type: 'toggleDone', id: t.id, key })}>
            {p.done ? 'Not done after all' : `Mark as done ${t.scope === 'monthly' ? 'this month' : SCOPES[t.scope].noun}`}
          </button>
          <p className="muted small center">Finishing under budget banks the difference as saved hours.</p>
        </div>
    </>
  );

  if (embedded) return <section className="pane stack" aria-label={t.name}>{body}</section>;
  return (
    <>
      <Header left={<IconButton label="Back" onClick={back}><Icon.back /></IconButton>} right={edit} />
      <main className="main">{body}</main>
    </>
  );
}
