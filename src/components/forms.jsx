// Forms shared by onboarding, settings and sheets: fixed costs, targets, time entries, savings goals.
import React, { useState } from 'react';
import { Bar, Icon, IconButton, Stepper, Switch } from './ui.jsx';
import { uid } from '../store.js';
import { weekFixed, weekFree } from '../budget.js';
import { fmt, startOfDay } from '../time.js';

export function FixedCostsEditor({ list, onChange }) {
  const update = (id, patch) => onChange(list.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const fixed = weekFixed(list);
  return (
    <>
      <div className="card list">
        {list.map((f) => (
          <div className="fc-row" key={f.id}>
            <div className="fc-main">
              <label className="sr" htmlFor={`fc-${f.id}`}>Name</label>
              <input id={`fc-${f.id}`} className="in-plain" value={f.name} onChange={(e) => update(f.id, { name: e.target.value })} />
              <label className="sr" htmlFor={`fcd-${f.id}`}>Which days</label>
              <select id={`fcd-${f.id}`} className="sel" value={f.days} onChange={(e) => update(f.id, { days: e.target.value })}>
                <option value="everyday">Every day</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
              </select>
            </div>
            <Stepper value={f.hours} onChange={(v) => update(f.id, { hours: v })} step={0.5} max={24} label={f.name || 'time'} />
            <IconButton label={`Remove ${f.name}`} className="ghost" onClick={() => onChange(list.filter((x) => x.id !== f.id))}>
              <Icon.trash />
            </IconButton>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="btn-dashed"
        onClick={() => onChange([...list, { id: uid(), name: 'New cost', hours: 1, days: 'everyday' }])}
      >
        + Add a fixed cost
      </button>
      <div className="card">
        <div className="split">
          <span className="lbl">Fixed each week</span>
          <span className="d big-num">
            {Math.round(fixed / 60)} h <span className="muted small">of 168 h</span>
          </span>
        </div>
        <Bar value={fixed} max={10080} color="var(--ink)" />
      </div>
    </>
  );
}

export function TargetForm({ initial, fixedCosts, otherAllocated = 0, submitLabel = 'Save', onSave, onDelete }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [hours, setHours] = useState(initial?.weeklyHours ?? 5);
  const [doneWhen, setDoneWhen] = useState(initial?.doneWhen ?? '');
  const [isProtected, setProtected] = useState(initial?.protected ?? false);
  const [client, setClient] = useState(initial?.client ?? false);
  const [rate, setRate] = useState(initial?.rate ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pool = weekFree(fixedCosts) / 60;
  const left = Math.round((pool - otherAllocated - hours) * 10) / 10;
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), weeklyHours: hours, doneWhen: doneWhen.trim(), protected: isProtected, client, rate: client ? Number(rate) || 0 : '' });
  };
  return (
    <form className="stack" onSubmit={submit}>
      <div className="card stack">
        <div className="field">
          <label htmlFor="t-name" className="lbl">Name</label>
          <input id="t-name" className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zeero" required />
        </div>
        <div className="field">
          <span className="lbl">Hours per week</span>
          <div className="split">
            <Stepper value={hours} onChange={setHours} step={0.5} max={168} label="hours" />
            <span className="muted small">{pool ? Math.round((hours / pool) * 100) : 0}% of your pool</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="t-done" className="lbl">Done when</label>
          <input id="t-done" className="in" value={doneWhen} onChange={(e) => setDoneWhen(e.target.value)} placeholder="e.g. First draft finished" />
        </div>
        <div className="toggle-row">
          <div>
            <div className="strong">Protected</div>
            <div className="muted small">Rest or passions you don't want squeezed</div>
          </div>
          <Switch checked={isProtected} onChange={setProtected} label="Protected" />
        </div>
        <div className="toggle-row">
          <div>
            <div className="strong">Client work</div>
            <div className="muted small">Track an hourly rate</div>
          </div>
          <Switch checked={client} onChange={setClient} label="Client work" />
        </div>
        {client && (
          <div className="field">
            <label htmlFor="t-rate" className="lbl">Rate per hour</label>
            <input id="t-rate" className="in" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. 450" />
          </div>
        )}
      </div>
      <p className="muted small center">
        {left >= 0 ? `That leaves ${fmt(left * 60)} unallocated this week.` : `That's ${fmt(-left * 60)} more than your free pool.`}
      </p>
      <button type="submit" className="btn" disabled={!name.trim()}>
        {submitLabel}
      </button>
      {onDelete &&
        (confirmDelete ? (
          <button type="button" className="btn-text danger" onClick={onDelete}>
            Tap again to delete this target and its logged time
          </button>
        ) : (
          <button type="button" className="btn-text" onClick={() => setConfirmDelete(true)}>
            Delete target
          </button>
        ))}
    </form>
  );
}

export function LogTimeForm({ targets, defaultTargetId, onSave }) {
  const [targetId, setTargetId] = useState(defaultTargetId || targets[0]?.id || '');
  const [h, setH] = useState(0);
  const [m, setM] = useState(30);
  const [day, setDay] = useState('today');
  const submit = (e) => {
    e.preventDefault();
    const minutes = Number(h) * 60 + Number(m);
    if (!targetId || minutes <= 0) return;
    const base = day === 'today' ? Date.now() : startOfDay(Date.now()).getTime() - 60000;
    const end = day === 'today' ? base : base - 3600000 * 3;
    onSave({ targetId, start: end - minutes * 60000, end });
  };
  if (!targets.length) return <p className="muted">Create a target first.</p>;
  return (
    <form className="stack" onSubmit={submit}>
      <div className="card stack">
        <div className="field">
          <label htmlFor="l-target" className="lbl">Target</label>
          <select id="l-target" className="in" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="row-2">
          <div className="field">
            <label htmlFor="l-h" className="lbl">Hours</label>
            <input id="l-h" className="in" type="number" min="0" max="24" value={h} onChange={(e) => setH(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="l-m" className="lbl">Minutes</label>
            <input id="l-m" className="in" type="number" min="0" max="59" step="5" value={m} onChange={(e) => setM(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <span className="lbl">When</span>
          <div className="chips">
            <button type="button" className={day === 'today' ? 'chip on' : 'chip'} aria-pressed={day === 'today'} onClick={() => setDay('today')}>Today</button>
            <button type="button" className={day === 'yesterday' ? 'chip on' : 'chip'} aria-pressed={day === 'yesterday'} onClick={() => setDay('yesterday')}>Yesterday</button>
          </div>
        </div>
      </div>
      <button type="submit" className="btn">Log time</button>
    </form>
  );
}

export function GoalForm({ onSave }) {
  const [name, setName] = useState('');
  const [hours, setHours] = useState(8);
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave({ name: name.trim(), targetMin: hours * 60 });
      }}
    >
      <div className="card stack">
        <div className="field">
          <label htmlFor="g-name" className="lbl">Saving for</label>
          <input id="g-name" className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. A free Friday" required />
        </div>
        <div className="field">
          <span className="lbl">Hours needed</span>
          <Stepper value={hours} onChange={setHours} step={1} min={1} max={500} label="hours" />
        </div>
      </div>
      <button type="submit" className="btn" disabled={!name.trim()}>Create goal</button>
    </form>
  );
}
