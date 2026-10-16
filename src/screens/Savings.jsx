import React from 'react';
import { Bar, Header, Icon, IconButton } from '../components/ui.jsx';
import { streak } from '../budget.js';
import { fmt, weekKey } from '../time.js';

export default function Savings({ state, dispatch, now, open, sheet }) {
  const { balance, debt, goals, settled } = state.savings;
  const last = Object.entries(settled).sort((a, b) => (a[0] < b[0] ? 1 : -1))[0];
  const s = streak(state, now);
  return (
    <>
      <Header right={<IconButton label="Settings" onClick={() => open({ name: 'settings' })}><Icon.settings /></IconButton>}>
        <h1 className="d title-lg">Savings</h1>
      </Header>
      <main className="main">
        <div className="vault">
          <div className="lbl light">Saved hours</div>
          <div className="d vault-num">{fmt(balance)}</div>
          <div className="split">
            {last && last[1].net > 0 ? <span className="gold-chip">+{fmt(last[1].net)} last settle</span> : <span />}
            <span className="light small">Earned by hitting targets</span>
          </div>
        </div>
        <button type="button" className="btn2" onClick={() => open({ name: 'statement' })}>Open the week statement</button>
        <div className="split">
          <span className="lbl">Savings goals</span>
        </div>
        {goals.map((g) => {
          const complete = g.saved >= g.targetMin;
          return (
            <div className="card" key={g.id}>
              <div className="split">
                <span className="strong">{g.name}</span>
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
        })}
        <button type="button" className="btn-dashed" onClick={() => sheet({ name: 'goal' })}>+ New savings goal</button>
        <div className="row-2">
          <div className="card">
            <div className="lbl">Time debt</div>
            <div className="d big-num">{fmt(debt)}</div>
            <div className="muted small">{debt > 0 ? 'Repaid from future savings.' : 'All square.'}</div>
          </div>
          <div className="card">
            <div className="lbl">Streak</div>
            <div className="d big-num">{s} {s === 1 ? 'week' : 'weeks'}</div>
            <div className="muted small">settled on budget</div>
          </div>
        </div>
      </main>
    </>
  );
}
