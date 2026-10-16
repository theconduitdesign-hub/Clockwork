import React from 'react';
import { Header, Icon, IconButton, Ring, Say } from '../components/ui.jsx';
import { dailyBudget, dayRange, logged } from '../budget.js';
import { tcolor } from '../store.js';
import { fmt, fmtClock } from '../time.js';

export function TimerBanner({ state, dispatch, now, open }) {
  if (!state.timer) return null;
  const t = state.targets.find((x) => x.id === state.timer.targetId);
  if (!t) return null;
  return (
    <div className="banner">
      <button type="button" className="banner-body" onClick={() => open({ name: 'timer' })}>
        <span className="dot" style={{ background: tcolor(t) }} />
        <span className="strong">{t.name}</span>
        <span className="d clock-sm">{fmtClock(now - state.timer.start)}</span>
      </button>
      <button type="button" className="banner-stop" onClick={() => dispatch({ type: 'stopTimer' })}>Stop</button>
    </div>
  );
}

export default function TimerView({ state, dispatch, now, back }) {
  const timer = state.timer;
  const t = timer && state.targets.find((x) => x.id === timer.targetId);
  const header = (
    <Header
      left={<IconButton label="Back" onClick={back}><Icon.back /></IconButton>}
      right={<span style={{ width: 44 }} />}
    >
      <span className="lbl">Timer</span>
    </Header>
  );
  if (!t) {
    return (
      <>
        {header}
        <main className="main focus">
          <Say>No timer running. Start one from Today.</Say>
        </main>
      </>
    );
  }
  const [from, to] = dayRange(now);
  const budget = dailyBudget(t, state.fixedCosts, now);
  const spent = logged(state, t.id, from, to, now);
  const rem = budget - spent;
  const others = state.targets.filter((x) => x.id !== t.id);
  return (
    <>
      {header}
      <main className="main focus">
        <div className="pill-name" style={{ alignSelf: 'center' }}>
          <span className="dot" style={{ background: tcolor(t) }} />
          {t.name}
        </div>
        <div className="center-box">
          <Ring size={280} stroke={7} total={budget || 1} segments={[{ value: spent, color: tcolor(t) }]} label={`${fmt(spent)} of ${fmt(budget)} used today`}>
            <div className="d clock-big">{fmtClock(now - timer.start)}</div>
            <div className="muted">{fmt(spent)} of {fmt(budget)} today</div>
          </Ring>
        </div>
        <Say>{rem > 0 ? `${fmt(rem)} left in today's ${t.name} budget. Steady as she goes.` : `You're ${fmt(-rem)} over today's ${t.name} budget. Worth wrapping up soon?`}</Say>
        {others.length > 0 && (
          <div className="field">
            <span className="lbl">Switch to</span>
            <div className="chips">
              {others.map((o) => (
                <button key={o.id} type="button" className="chip" onClick={() => dispatch({ type: 'startTimer', targetId: o.id })}>
                  {o.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          type="button"
          className="btn push"
          onClick={() => {
            dispatch({ type: 'stopTimer' });
            back();
          }}
        >
          Stop and log
        </button>
      </main>
    </>
  );
}
