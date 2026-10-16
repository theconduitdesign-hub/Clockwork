import React from 'react';
import { Header, Icon, IconButton, Say } from '../components/ui.jsx';
import { todayRows } from './Today.jsx';
import { DAY_NAMES, dateLabel, dayIndex, fmt } from '../time.js';

export default function CheckIn({ state, now, back, sheet }) {
  const rows = todayRows(state, now);
  const over = rows.filter((r) => r.spent > r.budget + 1).sort((a, b) => b.spent - b.budget - (a.spent - a.budget));
  const under = rows.filter((r) => !r.done && r.spent < r.budget - 1).sort((a, b) => b.budget - b.spent - (a.budget - a.spent));
  let line;
  if (!rows.length) line = 'Nothing budgeted today. A quiet one.';
  else if (over.length && under.length)
    line = `${over[0].target.name} ran ${fmt(over[0].spent - over[0].budget)} long. ${under[0].target.name} has room to give it back tomorrow.`;
  else if (over.length) line = `${over[0].target.name} ran ${fmt(over[0].spent - over[0].budget)} long. The week still has room to absorb it.`;
  else if (under.length === rows.length) line = 'A light day on the books. The week is long; no harm done.';
  else line = 'A tidy day. Your books are balanced.';

  return (
    <>
      <Header left={<IconButton label="Close" onClick={back}><Icon.close /></IconButton>}>
        <span className="lbl">Check-in · {DAY_NAMES[dayIndex(now)].slice(0, 3)} {dateLabel(now)}</span>
      </Header>
      <main className="main narrow">
        <h1 className="d h1">How did today go?</h1>
        <Say>{line}</Say>
        {rows.length > 0 && (
          <div className="card">
            <div className="grid3 head">
              <span>Target</span>
              <span>Budget</span>
              <span>Actual</span>
            </div>
            {rows.map((r) => (
              <div className="grid3" key={r.target.id}>
                <span className="strong">{r.target.name}</span>
                <span>{fmt(r.budget)}</span>
                <span className={r.spent > r.budget + 1 ? 'strong' : ''}>
                  {fmt(r.spent)}
                  {r.spent > r.budget + 1 && <span className="tag">+{fmt(r.spent - r.budget)}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="card">
          <div className="lbl">Anything unlogged?</div>
          <button type="button" className="chip dashed" onClick={() => sheet({ name: 'log' })}>+ Log time</button>
        </div>
        <button type="button" className="btn push" onClick={back}>Close the day</button>
      </main>
    </>
  );
}
