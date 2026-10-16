import React, { useState } from 'react';
import { Header, Icon, IconButton, Logo, Say } from '../components/ui.jsx';
import { statementRows, weekFree, logged } from '../budget.js';
import { addDays, fmt, fmtSigned, weekKey, weekRangeLabel, weekStart } from '../time.js';

const RESULT = {
  saved: (r) => `${fmt(r.result)} saved`,
  over: (r) => `${fmt(-r.result)} over`,
  onbudget: () => 'On budget',
  carried: () => 'Not done',
};

export default function Statement({ state, dispatch, now, back }) {
  const thisWeek = weekStart(now);
  const [offset, setOffset] = useState(-1);
  const ws = addDays(thisWeek, offset * 7);
  const wk = weekKey(ws);
  const ended = offset < 0;
  const rows = statementRows(state, ws, now);
  const net = rows.reduce((s, r) => s + r.result, 0);
  const settled = state.savings.settled[wk];
  const totalLogged = logged(state, null, ws.getTime(), addDays(ws, 7).getTime(), now);
  const free = weekFree(state.fixedCosts);

  const saved = rows.filter((r) => r.kind === 'saved');
  const over = rows.filter((r) => r.kind === 'over');
  let line;
  if (!rows.length) line = 'No targets that week, so nothing to settle.';
  else if (!ended) line = "This week's still running. Here's how the books look so far.";
  else if (settled) line = `Settled. ${net >= 0 ? `${fmt(net)} went to your savings.` : `${fmt(-net)} was borrowed.`}`;
  else if (net > 0) line = `A fine week. ${saved.map((r) => `${r.target.name} came in ${fmt(r.result)} under`).join(', ')}${over.length ? `, ${over.map((r) => `${r.target.name} borrowed ${fmt(-r.result)}`).join(', ')}` : ''}. Net: ${fmt(net)} to your savings.`;
  else if (net < 0) line = `${over.map((r) => `${r.target.name} ran ${fmt(-r.result)} over`).join(', ')}. That's borrowed from savings. Let's rebalance next week.`;
  else line = 'Even books. Nothing saved, nothing borrowed.';

  const stamp = !rows.length || !ended ? null : net >= 0 ? 'ON BUDGET' : 'OVER BUDGET';

  return (
    <>
      <Header
        left={<IconButton label="Back" onClick={back}><Icon.back /></IconButton>}
        right={
          <div className="pager">
            <IconButton label="Previous week" onClick={() => setOffset(offset - 1)}><Icon.back /></IconButton>
            <IconButton label="Next week" className={offset >= 0 ? 'disabled' : ''} onClick={() => offset < 0 && setOffset(offset + 1)}>
              <span style={{ transform: 'scaleX(-1)', display: 'flex' }}><Icon.back /></span>
            </IconButton>
          </div>
        }
      >
        <span className="lbl">{offset === 0 ? 'This week' : offset === -1 ? 'Last week' : `${-offset} weeks ago`}</span>
      </Header>
      <main className="main">
        <div className="receipt">
          {stamp && <div className={net >= 0 ? 'stamp' : 'stamp ink'}>{settled ? 'SETTLED' : stamp}</div>}
          <div className="brand-row"><Logo size={24} /><span className="strong small">Pocketwatch</span></div>
          <h1 className="d h1">Statement</h1>
          <div className="muted">{weekRangeLabel(ws)}</div>
          <div className="rtable">
            <div className="r4 head"><span>Target</span><span>Budget</span><span>Actual</span><span>Result</span></div>
            {rows.map((r) => (
              <div className="r4" key={r.target.id}>
                <span className="strong">{r.target.name}</span>
                <span>{fmt(r.budget)}</span>
                <span>{fmt(r.actual)}</span>
                <span className={r.kind === 'saved' ? 'strong saved' : ''}>
                  {r.kind === 'saved' && <i className="gold-dot" />}
                  {RESULT[r.kind](r)}
                </span>
              </div>
            ))}
            <div className="r4 muted">
              <span>All logged time</span>
              <span />
              <span>{fmt(totalLogged)}</span>
              <span>of {fmt(free)} free</span>
            </div>
          </div>
          <div className="split total">
            <span className="strong">Net saved</span>
            <span className="d dbl">{fmtSigned(net)}</span>
          </div>
        </div>
        <Say>{line}</Say>
        {ended && rows.length > 0 && !settled && (
          <button type="button" className="btn push" onClick={() => dispatch({ type: 'settle', wk, net })}>Settle up</button>
        )}
      </main>
    </>
  );
}
