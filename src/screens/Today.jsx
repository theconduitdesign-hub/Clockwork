import React from 'react';
import { Bar, DoneBadge, Header, Icon, IconButton, Logo, Ring, Say } from '../components/ui.jsx';
import { dailyBudget, dayRange, freeForDay, isDone, logged, weekBudget, weekRange } from '../budget.js';
import { useDesktop } from '../useDesktop.js';
import { tcolor } from '../store.js';
import { DAY_NAMES, dateLabel, dayIndex, fmt, greeting, weekRangeLabel, weekStart } from '../time.js';

function hm(min) {
  const m = Math.round(Math.max(0, min));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export function todayRows(state, now) {
  const [from, to] = dayRange(now);
  return state.targets.map((t) => ({
    target: t,
    budget: dailyBudget(state, t, now),
    spent: logged(state, t.id, from, to, now),
    done: isDone(t, now),
  }));
}

export default function Today({ state, dispatch, now, open, sheet }) {
  const desktop = useDesktop();
  const freeToday = freeForDay(state.fixedCosts, dayIndex(now));
  const rows = todayRows(state, now);
  const budget = rows.reduce((s, r) => s + r.budget, 0);
  const spent = rows.reduce((s, r) => s + r.spent, 0);
  const left = Math.max(0, budget - spent);
  const timerTarget = state.timer && state.targets.find((t) => t.id === state.timer.targetId);

  let line;
  if (!state.targets.length) line = 'No targets yet. Shall we set your first one?';
  else if (timerTarget) {
    const r = rows.find((x) => x.target.id === timerTarget.id);
    const rem = r ? r.budget - r.spent : 0;
    line = rem > 0 ? `${fmt(rem)} left in today's ${timerTarget.name} budget.` : `${timerTarget.name} is ${fmt(-rem)} over today. No stress, we'll rebalance.`;
  } else if (spent === 0) line = `${greeting(now)} You have ${fmt(budget)} to spend today.`;
  else if (spent > budget) line = `You're ${fmt(spent - budget)} over today's budget. Tomorrow can make it up.`;
  else line = `${fmt(spent)} spent, ${fmt(left)} left to spend today.`;

  const actions = rows.length > 0 && (
    <>
      <button type="button" className="btn2" onClick={() => sheet({ name: 'log' })}>+ Log time</button>
      <button type="button" className={desktop ? 'btn' : 'btn2'} onClick={() => open({ name: 'checkin' })}>Check in</button>
    </>
  );

  const ringCard = (
    <div className={desktop ? 'card ring-card vertical' : 'card ring-card'}>
      {desktop && <span className="lbl">Today's budget</span>}
      <Ring size={desktop ? 180 : 120} total={budget || 1} segments={[{ value: spent, color: 'var(--teal)' }]} label={`${fmt(spent)} spent of ${fmt(budget)} today`}>
        <div className={desktop ? 'd hero-sm' : 'd mid-num'}>{hm(left)}</div>
        <div className="muted tiny">left today</div>
      </Ring>
      {desktop ? (
        <div className="ring-stats">
          <div><div className="lbl">Budget</div><div className="d big-num">{fmt(budget)}</div></div>
          <div><div className="lbl">Spent</div><div className="d big-num">{fmt(spent)}</div></div>
        </div>
      ) : (
        <div>
          <div className="lbl">Today's budget</div>
          <div className="d hero-sm">{fmt(budget)}</div>
          <div className="muted small">{fmt(spent)} spent</div>
        </div>
      )}
    </div>
  );

  const allocations = rows.length > 0 ? (
    <div className="card">
      <div className="split">
        <span className="lbl">Today's allocations</span>
        {desktop && <span className="muted small">Spent / budgeted</span>}
      </div>
      {rows.map(({ target: t, budget: b, spent: s, done }) => {
        const running = state.timer?.targetId === t.id;
        return (
          <div className="alloc" key={t.id}>
            <span className="dot" style={{ background: tcolor(t) }} />
            <button type="button" className="alloc-body" onClick={() => open({ name: 'target', id: t.id })}>
              <span className="split strong">
                <span>{t.name}</span>
                <span className="amt">{fmt(s)} / {fmt(b)}</span>
              </span>
              <Bar value={s} max={b} color={tcolor(t)} />
            </button>
            {done ? (
              <DoneBadge />
            ) : running ? (
              <IconButton label={`Stop ${t.name} timer`} className="stop" onClick={() => dispatch({ type: 'stopTimer' })}>
                <Icon.stop />
              </IconButton>
            ) : (
              <IconButton label={`Start ${t.name} timer`} className="play" onClick={() => dispatch({ type: 'startTimer', targetId: t.id })}>
                <Icon.play />
              </IconButton>
            )}
          </div>
        );
      })}
      {desktop && (
        <div className="buffer-row">
          <span><b>Buffer today:</b> {fmt(Math.max(0, freeToday - budget))} unallocated</span>
          <span className="muted">{fmt(freeToday)} free · {fmt(budget)} budgeted</span>
        </div>
      )}
    </div>
  ) : (
    <button type="button" className="btn" onClick={() => sheet({ name: 'targetForm' })}>Create a target</button>
  );

  if (desktop) {
    const [wFrom, wTo] = weekRange(now);
    return (
      <>
        <Header right={<div className="hdr-actions">{actions}</div>}>
          <h1 className="d title">{DAY_NAMES[dayIndex(now)]}</h1>
          <div className="muted">{dateLabel(now)} · week of {weekRangeLabel(weekStart(now))}</div>
        </Header>
        <main className="main">
          <Say>{line}</Say>
          <div className="dcols today-cols">
            {allocations}
            <div className="stack">
              {ringCard}
              {state.targets.length > 0 && (
                <div className="card">
                  <div className="lbl">This week</div>
                  {state.targets.map((t) => (
                    <button type="button" key={t.id} className="lg" onClick={() => open({ name: 'target', id: t.id })}>
                      <span className="dot" style={{ background: tcolor(t) }} />
                      <b>{t.name}</b>
                      <span>{Math.round(logged(state, t.id, wFrom, wTo, now) / 6) / 10} / {Math.round(weekBudget(t, state.fixedCosts, now) / 6) / 10} h</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="vault vault-sm">
                <div>
                  <div className="lbl light">Saved hours</div>
                  <div className="d hero-sm">{fmt(state.savings.balance)}</div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header
        left={<Logo size={40} />}
        right={
          <IconButton label="Settings" onClick={() => open({ name: 'settings' })}>
            <Icon.settings />
          </IconButton>
        }
      >
        <div className="d title">{DAY_NAMES[dayIndex(now)]}</div>
        <div className="muted small">{dateLabel(now)}</div>
      </Header>
      <main className="main">
        <Say>{line}</Say>
        {ringCard}
        {allocations}
        {rows.length > 0 && <div className="row-2">{actions}</div>}
      </main>
    </>
  );
}
