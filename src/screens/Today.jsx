import React from 'react';
import { Bar, DoneBadge, Header, Icon, IconButton, Logo, Ring, Say } from '../components/ui.jsx';
import { dailyBudget, dayRange, logged } from '../budget.js';
import { DAY_NAMES, dateLabel, dayIndex, fmt, greeting, weekKey } from '../time.js';

function hm(min) {
  const m = Math.round(Math.max(0, min));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
}

export function todayRows(state, now) {
  const idx = dayIndex(now);
  const [from, to] = dayRange(now);
  const wk = weekKey(now);
  return state.targets.map((t) => ({
    target: t,
    budget: dailyBudget(t, state.fixedCosts, idx),
    spent: logged(state, t.id, from, to, now),
    done: !!t.done?.[wk],
  }));
}

export default function Today({ state, dispatch, now, open, sheet }) {
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
        <div className="card ring-card">
          <Ring size={120} total={budget || 1} segments={[{ value: spent, color: '#0E6B6B' }]} label={`${fmt(spent)} spent of ${fmt(budget)} today`}>
            <div className="d mid-num">{hm(left)}</div>
            <div className="muted tiny">left today</div>
          </Ring>
          <div>
            <div className="lbl">Today's budget</div>
            <div className="d hero-sm">{fmt(budget)}</div>
            <div className="muted small">{fmt(spent)} spent</div>
          </div>
        </div>
        {rows.length > 0 ? (
          <div className="card">
            <div className="lbl">Today's allocations</div>
            {rows.map(({ target: t, budget: b, spent: s, done }) => {
              const running = state.timer?.targetId === t.id;
              return (
                <div className="alloc" key={t.id}>
                  <span className="dot" style={{ background: t.color }} />
                  <button type="button" className="alloc-body" onClick={() => open({ name: 'target', id: t.id })}>
                    <span className="split strong">
                      <span>{t.name}</span>
                      <span className="amt">{fmt(s)} / {fmt(b)}</span>
                    </span>
                    <Bar value={s} max={b} color={t.color} />
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
          </div>
        ) : (
          <button type="button" className="btn" onClick={() => sheet({ name: 'targetForm' })}>Create a target</button>
        )}
        {rows.length > 0 && (
          <div className="row-2">
            <button type="button" className="btn2" onClick={() => sheet({ name: 'log' })}>+ Log time</button>
            <button type="button" className="btn2" onClick={() => open({ name: 'checkin' })}>Check in</button>
          </div>
        )}
      </main>
    </>
  );
}
