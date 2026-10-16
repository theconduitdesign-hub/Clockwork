// Forms shared by onboarding, settings and sheets: fixed costs, targets, time entries, savings goals.
import React, { useLayoutEffect, useRef, useState } from 'react';
import { Bar, HoursInput, Icon, IconButton, Segmented, Switch } from './ui.jsx';
import Markdown from './Markdown.jsx';
import { uid } from '../store.js';
import { SCOPES, periodKey, pool, weekFixed } from '../budget.js';
import { fmt, monthName, startOfDay } from '../time.js';

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
            <HoursInput value={f.hours} onChange={(v) => update(f.id, { hours: v })} max={24} label={`${f.name || 'time'} hours`} />
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

// The "done when" editor: markdown with a few one-tap helpers and a preview.
function DoneWhenEditor({ value, onChange, disabled }) {
  const ref = useRef(null);
  const caret = useRef(null);
  const [preview, setPreview] = useState(false);
  // Put the cursor where the helper left it, before the next keystroke lands.
  useLayoutEffect(() => {
    if (caret.current == null || !ref.current) return;
    ref.current.focus();
    ref.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });
  const insert = (prefix, wrap) => {
    const el = ref.current;
    const startPos = el ? el.selectionStart : value.length;
    const endPos = el ? el.selectionEnd : value.length;
    const sel = value.slice(startPos, endPos);
    let next;
    let pos;
    if (wrap) {
      next = value.slice(0, startPos) + wrap + (sel || 'text') + wrap + value.slice(endPos);
      pos = startPos + wrap.length + (sel || 'text').length;
    } else {
      const lineStart = value.lastIndexOf('\n', startPos - 1) + 1;
      const needsBreak = startPos > lineStart && value.slice(lineStart, startPos).trim() !== '';
      const ins = (needsBreak ? '\n' : '') + prefix;
      next = value.slice(0, startPos) + ins + value.slice(startPos);
      pos = startPos + ins.length;
    }
    caret.current = pos;
    el?.focus();
    onChange(next);
  };
  return (
    <div className="dw">
      <div className="dw-bar">
        <div className="seg seg-sm" role="tablist" aria-label="Done when view">
          <button type="button" role="tab" aria-selected={!preview} className={!preview ? 'on' : ''} onClick={() => setPreview(false)}>Write</button>
          <button type="button" role="tab" aria-selected={preview} className={preview ? 'on' : ''} onClick={() => setPreview(true)}>Preview</button>
        </div>
        {!preview && (
          <div className="dw-tools">
            <button type="button" className="tool" disabled={disabled} onClick={() => insert('- [ ] ')} aria-label="Add a checklist item">☐ Checklist</button>
            <button type="button" className="tool" disabled={disabled} onClick={() => insert('', '**')} aria-label="Bold"><b>B</b></button>
            <button type="button" className="tool" disabled={disabled} onClick={() => insert('## ')} aria-label="Heading">H</button>
          </div>
        )}
      </div>
      {preview ? (
        value.trim() ? <Markdown source={value} className="dw-preview" /> : <p className="muted small dw-preview">Nothing yet.</p>
      ) : (
        <textarea
          ref={ref}
          id="t-done"
          className="in dw-text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={'First draft finished\n- [ ] Outline\n- [ ] Write it\n- [ ] **Send to Omar**'}
          rows={5}
        />
      )}
    </div>
  );
}

const MAX_HOURS = { daily: 24, weekly: 168, monthly: 744 };

export function TargetForm({ initial, state, submitLabel = 'Save', onSave, onDelete }) {
  const now = Date.now();
  const [name, setName] = useState(initial?.name ?? '');
  const [scope, setScope] = useState(initial?.scope ?? 'weekly');
  const [hours, setHours] = useState(initial?.hours ?? 5);
  const [slot, setSlot] = useState(initial?.slot ?? 'flexible');
  const [doneWhen, setDoneWhen] = useState(initial?.doneWhen ?? '');
  const [client, setClient] = useState(initial?.client ?? false);
  const [rate, setRate] = useState(initial?.rate ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Strict targets are like a fixed savings account: you can change them, but you have to mean it.
  const [unlocked, setUnlocked] = useState(initial?.slot !== 'strict');
  const locked = !unlocked;

  // Everything is measured from now: what's left of today, this week or this month.
  const p = pool(state, scope, now, initial?.id);
  const curKey = periodKey(scope, now);
  const showFirst = !initial || initial.start?.key === curKey || initial.scope !== scope;
  const [firstOverride, setFirstOverride] = useState(initial?.start?.key === curKey ? initial.start.hours : null);
  const [editFirst, setEditFirst] = useState(false);
  const auto = Math.round(hours * p.fraction * 4) / 4;
  const first = showFirst ? Math.min(hours, firstOverride ?? auto) : hours;
  const partial = showFirst && p.fraction < 0.98;
  const late = partial && p.free < Math.max(120, p.periodFree * 0.1);
  const mine = (partial ? first : hours) * 60;
  const left = p.left - mine;
  const rest = scope === 'daily' ? 'today' : scope === 'monthly' ? `in ${monthName(now)}` : 'this week';
  const restOf = scope === 'daily' ? 'the rest of today' : scope === 'monthly' ? `the rest of ${monthName(now)}` : 'the rest of this week';
  const nextStart = scope === 'daily' ? 'tomorrow' : scope === 'monthly' ? `1 ${monthName(new Date(new Date(now).getFullYear(), new Date(now).getMonth() + 1, 1))}` : 'Monday';
  const total = Math.max(p.free, p.planned + mine, 1);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || locked) return;
    const target = { name: name.trim(), scope, hours, slot, doneWhen: doneWhen.trim(), client, rate: client ? Number(rate) || 0 : '' };
    if (showFirst) target.start = { key: curKey, hours: partial ? first : hours };
    onSave(target);
  };

  return (
    <form className="stack" onSubmit={submit}>
      {locked && (
        <div className="lock-card" role="alert">
          <div className="split-l"><Icon.lock /><span className="strong">This is strict time</span></div>
          <p className="small">Strict targets are like a fixed savings account. You can change this one, but it's meant to take a moment's thought.</p>
          <button type="button" className="btn2" onClick={() => setUnlocked(true)}>Unlock to edit</button>
        </div>
      )}
      <fieldset className="card stack plain" disabled={locked}>
        <div className="field">
          <label htmlFor="t-name" className="lbl">Name</label>
          <input id="t-name" className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zeero" required />
        </div>
        <div className="field">
          <span className="lbl">How often</span>
          <Segmented
            label="How often"
            value={scope}
            onChange={(v) => {
              setScope(v);
              setHours((h) => Math.min(h, MAX_HOURS[v]));
              setFirstOverride(null);
              setEditFirst(false);
            }}
            options={[['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']]}
          />
        </div>
        <div className="field">
          <label htmlFor="t-hours" className="lbl">{SCOPES[scope].unit}</label>
          <HoursInput id="t-hours" value={hours} onChange={setHours} max={MAX_HOURS[scope]} label="hours" />
        </div>
        <div className="pool-box" aria-live="polite">
          <div className="split small">
            <span className="strong">Left {rest}</span>
            <span className="muted num">{fmt(p.free)} free from now</span>
          </div>
          <div className="pool-bar" role="img" aria-label={`Other targets still need ${fmt(p.planned)}, this target ${fmt(mine)}, ${fmt(Math.max(0, left))} left`}>
            <span style={{ width: `${(Math.min(p.planned, total) / total) * 100}%`, background: 'var(--ink)' }} />
            <span style={{ width: `${(Math.min(mine, total - Math.min(p.planned, total)) / total) * 100}%`, background: 'var(--teal)' }} />
          </div>
          <div className="pool-key small">
            <span><i style={{ background: 'var(--ink)' }} />Other targets still need {fmt(p.planned)}</span>
            <span><i style={{ background: 'var(--teal)' }} />This target {fmt(mine)}</span>
          </div>
          {partial && (
            <div className="first-row">
              {first === 0 && firstOverride === 0 ? (
                <>
                  <span className="small">Starts {nextStart}, at the full {fmt(hours * 60)}.</span>
                  <button type="button" className="btn-text tight" onClick={() => setFirstOverride(null)}>Start now instead</button>
                </>
              ) : editFirst ? (
                <>
                  <label htmlFor="t-first" className="small strong">For {restOf}</label>
                  <HoursInput id="t-first" value={first} onChange={(v) => setFirstOverride(v)} max={hours} label={`hours for ${restOf}`} />
                </>
              ) : (
                <>
                  <span className="small">
                    For {restOf}: <b>{fmt(first * 60)}</b>
                    {firstOverride == null && <span className="muted"> (worked out from the time left)</span>}
                  </span>
                  <button type="button" className="btn-text tight" onClick={() => setEditFirst(true)}>Change</button>
                </>
              )}
            </div>
          )}
          {late && firstOverride !== 0 && (
            <div className="late-row small">
              <span>Not much of {scope === 'daily' ? 'today' : scope === 'monthly' ? monthName(now) : 'this week'} left. Start {nextStart} instead?</span>
              <button type="button" className="btn-text tight" onClick={() => setFirstOverride(0)}>Start {nextStart}</button>
            </div>
          )}
          <p className={left >= 0 ? 'small' : 'small strong'}>
            {left >= 0 ? `Leaves ${fmt(left)} free ${rest}.` : `That's ${fmt(-left)} more than you have left ${rest}.`}
          </p>
        </div>
        <div className="field">
          <span className="lbl">Slot</span>
          <Segmented label="Slot" value={slot} onChange={setSlot} options={[['flexible', 'Flexible'], ['strict', 'Strict']]} />
          <p className="muted small">
            {slot === 'strict'
              ? "Strict: habits and commitments you want to stick to. Editing it asks you to unlock first."
              : 'Flexible: can slide between days or shrink to make space.'}
          </p>
        </div>
        <div className="field">
          <label htmlFor="t-done" className="lbl">Done when</label>
          <DoneWhenEditor value={doneWhen} onChange={setDoneWhen} disabled={locked} />
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
      </fieldset>
      <button type="submit" className="btn" disabled={!name.trim() || locked}>
        {submitLabel}
      </button>
      {onDelete &&
        !locked &&
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
          <HoursInput value={hours} onChange={setHours} min={1} max={2000} label="hours" />
        </div>
      </div>
      <button type="submit" className="btn" disabled={!name.trim()}>Create goal</button>
    </form>
  );
}
