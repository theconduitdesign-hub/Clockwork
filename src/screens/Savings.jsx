import React from 'react';
import { Bar, Header, Icon, IconButton } from '../components/ui.jsx';
import { streak } from '../budget.js';
import { fmt } from '../time.js';
import { useDesktop } from '../useDesktop.js';

export default function Savings({ state, dispatch, now, open, sheet }) {
  const { balance, debt, goals, settled } = state.savings;
  const last = Object.entries(settled).sort((a, b) => (a[0] < b[0] ? 1 : -1))[0];
  const s = streak(state, now);
  const desktop = useDesktop();

  const vault = (
    <div className="vault">
      <div className="lbl light">Saved hours</div>
      <div className="d vault-num">{fmt(balance)}</div>
      <div className="split">
        {last && last[1].net > 0 ? <span className="gold-chip">+{fmt(last[1].net)} last settle</span> : <span />}
        <span className="light small">Earned by hitting targets</span>
      </div>
    </div>
  );

  const goalCards = goals.map((g) => {
    const complete = g.saved >= g.targetMin;
    return (
      <div className="card" key={g.id}>
        <div className="split">
          <span className={desktop ? 'd big-num' : 'strong'}>{g.name}</span>
          <span className="muted small num">{fmt(g.saved)} of {fmt(g.targetMin)}</span>
        </div>
        <Bar value={g.saved} max={g.targetMin} color="var(--gold)" thick />
        <div className="split" style={{ marginTop: 8 }}>
          <span className="muted small">{complete ? 'Fully funded. Go enjoy it.' : `${fmt(g.targetMin - g.saved)} to go`}</span>
          <span className="li-right">
            {!complete && (
              <button type="button" className="chip" disabled={balance < 1} onClick={() => dispatch({ type: 'fundGoal', id: g.id, min: 60 })}>
                Add 1 h
              </button>
            )}
            <IconButton label={complete ? `Spend ${g.name}` : `Delete ${g.name}`} className="ghost" onClick={() => dispatch({ type: complete ? 'spendGoal' : 'deleteGoal', id: g.id })}>
              <Icon.trash />
            </IconButton>
          </span>
        </div>
      </div>
    );
  });

  const debtCard = (
    <div className="card">
      <div className="lbl">Time debt</div>
      <div className={desktop ? 'd hero-sm' : 'd big-num'}>{fmt(debt)}</div>
      <div className="muted small">{debt > 0 ? 'Repaid from future savings.' : 'All square. Nothing borrowed.'}</div>
    </div>
  );
  const streakCard = (
    <div className="card">
      <div className="lbl">Streak</div>
      <div className={desktop ? 'd hero-sm' : 'd big-num'}>{s} {s === 1 ? 'week' : 'weeks'}</div>
      <div className="muted small">settled on budget</div>
    </div>
  );

  if (desktop) {
    return (
      <>
        <Header right={<button type="button" className="btn2 hdr-btn" onClick={() => sheet({ name: 'goal' })}>+ New savings goal</button>}>
          <h1 className="d title-lg">Savings</h1>
          <div className="muted">Hours you've earned by hitting targets under budget</div>
        </Header>
        <main className="main">
          <div className="dcols savings-top">
            {vault}
            {debtCard}
            {streakCard}
          </div>
          <span className="lbl">Savings goals</span>
          <div className="dcols goals-grid">
            {goalCards}
            <button type="button" className="goal-new" onClick={() => sheet({ name: 'goal' })}>
              <span className="d big-num">What are you saving for?</span>
              <span className="muted small">A trip, a project, a day off. Give your hours a purpose.</span>
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header right={<IconButton label="Settings" onClick={() => open({ name: 'settings' })}><Icon.settings /></IconButton>}>
        <h1 className="d title-lg">Savings</h1>
      </Header>
      <main className="main">
        {vault}
        <button type="button" className="btn2" onClick={() => open({ name: 'statement' })}>Open the week statement</button>
        <div className="split">
          <span className="lbl">Savings goals</span>
        </div>
        {goalCards}
        <button type="button" className="btn-dashed" onClick={() => sheet({ name: 'goal' })}>+ New savings goal</button>
        <div className="row-2">
          {debtCard}
          {streakCard}
        </div>
      </main>
    </>
  );
}
