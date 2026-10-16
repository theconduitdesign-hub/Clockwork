// Shared building blocks: the logo, Pocketwatch's speech bubble, rings, icons, header, tab bar and sheets.
import React from 'react';

const MOUSTACHE = 'M0 -6 C 12 -16, 30 -12, 40 0 C 48 9, 60 8, 64 -4 C 66 14, 50 22, 34 16 C 22 12, 12 6, 0 6 Z';

export function Logo({ size = 36, label }) {
  return (
    <svg
      viewBox="0 0 300 300"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ flexShrink: 0 }}
    >
      <rect width="300" height="300" rx="70" style={{ fill: 'var(--teal)' }} />
      <g transform="translate(150 146) scale(1.85)">
        <path d={MOUSTACHE} fill="#fff" />
        <path d={MOUSTACHE} fill="#fff" transform="scale(-0.8 0.8)" />
        <circle r="5.5" style={{ fill: 'var(--gold)' }} />
        <path d="M-18 26 Q0 42 18 26" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Pocketwatch speaking.
export function Say({ children }) {
  return (
    <div className="say" role="status">
      <Logo size={36} />
      <p>{children}</p>
    </div>
  );
}

// segments: [{ value, color }], drawn clockwise from 12 o'clock over `total`.
export function Ring({ size = 120, stroke = 12, segments, total, label, children }) {
  const safeTotal = total > 0 ? total : 1;
  let offset = 0;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={label}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(20,32,31,0.1)" strokeWidth={stroke} />
        <g transform="rotate(-90 60 60)">
          {segments.map((s, i) => {
            const len = Math.max(0, Math.min(s.value, safeTotal - offset));
            const el =
              len > 0 ? (
                <circle
                  key={i}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  style={{ stroke: s.color }}
                  strokeWidth={stroke}
                  pathLength={safeTotal}
                  strokeDasharray={`${len} ${safeTotal}`}
                  strokeDashoffset={-offset}
                  strokeLinecap={segments.length === 1 ? 'round' : 'butt'}
                />
              ) : null;
            offset += s.value;
            return el;
          })}
        </g>
      </svg>
      <div className="ring-c">{children}</div>
    </div>
  );
}

export function Bar({ value, max, color = 'var(--teal)', thick }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={thick ? 'bar thick' : 'bar'}>
      <div style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

const ic = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const Icon = {
  today: () => (<svg {...ic}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  week: () => (<svg {...ic}><circle cx="12" cy="12" r="9" strokeOpacity="0.35" /><path d="M12 3a9 9 0 0 1 9 9" strokeWidth="3" /></svg>),
  targets: () => (<svg {...ic}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>),
  statement: () => (<svg {...ic}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>),
  savings: () => (<svg {...ic}><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></svg>),
  settings: () => (<svg {...ic} width="22" height="22"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></svg>),
  back: () => (<svg {...ic} width="22" height="22" strokeWidth="2"><path d="M15 5l-7 7 7 7" /></svg>),
  close: () => (<svg {...ic} width="20" height="20" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>),
  chevron: () => (<svg {...ic} width="16" height="16" strokeWidth="2"><path d="M9 5l7 7-7 7" /></svg>),
  play: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>),
  stop: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>),
  lock: () => (<svg {...ic} width="14" height="14" strokeWidth="2.2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>),
  calendar: () => (<svg {...ic}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>),
  trash: () => (<svg {...ic} width="18" height="18"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>),
};

export function DoneBadge() {
  return (
    <span className="done-badge" role="img" aria-label="Done">
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" style={{ fill: 'var(--gold)' }} />
        <path d="M7 12.5l3.2 3L17 8.5" fill="none" style={{ stroke: 'var(--ink)' }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Header({ left, children, right }) {
  return (
    <header className="hdr">
      {left}
      <div className="hdr-mid">{children}</div>
      {right}
    </header>
  );
}

export function IconButton({ label, onClick, children, className = '' }) {
  return (
    <button type="button" className={`ib ${className}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function TabBar({ tab, setTab }) {
  const tabs = [
    ['today', 'Today'],
    ['week', 'Week'],
    ['targets', 'Targets'],
    ['savings', 'Savings'],
  ];
  return (
    <nav className="tabbar" aria-label="Main">
      {tabs.map(([id, label]) => {
        const I = Icon[id];
        return (
          <button
            key={id}
            type="button"
            className={tab === id ? 'tab on' : 'tab'}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            <I />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

// Desktop sidebar: brand, main sections, settings at the bottom.
const NAV = [
  ['today', 'Today'],
  ['week', 'Week'],
  ['targets', 'Targets'],
  ['statement', 'Statement'],
  ['savings', 'Savings'],
];

export function Sidebar({ active, onNav }) {
  const item = (id, label) => {
    const I = Icon[id];
    return (
      <button
        key={id}
        type="button"
        className={active === id ? 'nv on' : 'nv'}
        aria-current={active === id ? 'page' : undefined}
        onClick={() => onNav(id)}
      >
        <I />
        {label}
      </button>
    );
  };
  return (
    <aside className="side">
      <div className="side-brand">
        <Logo size={36} />
        <span className="d">Pocketwatch</span>
      </div>
      <nav className="side-nav" aria-label="Main">
        {NAV.map(([id, label]) => item(id, label))}
      </nav>
      <div className="side-foot">{item('settings', 'Settings')}</div>
    </aside>
  );
}

export function Sheet({ title, onClose, children }) {
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="d">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <Icon.close />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, step = 1, min = 0, max = 168, unit = 'h', label }) {
  const clamp = (v) => Math.min(max, Math.max(min, Math.round(v * 2) / 2));
  return (
    <div className="stepper">
      <button type="button" className="ib soft" aria-label={`Less ${label}`} onClick={() => onChange(clamp(value - step))}>
        &#8722;
      </button>
      <span className="d stepper-v">
        {value} {unit}
      </span>
      <button type="button" className="ib soft" aria-label={`More ${label}`} onClick={() => onChange(clamp(value + step))}>
        +
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={checked ? 'switch on' : 'switch'}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

// "2.5", "2,5", "2:30", "2h30", "2 h 30 m", "90m" → hours (or null when it can't be read).
export function parseHours(text) {
  const s = String(text).trim().toLowerCase().replace(',', '.');
  if (!s) return null;
  let m;
  if ((m = s.match(/^(\d+):(\d{1,2})$/))) return Number(m[1]) + Number(m[2]) / 60;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*m(?:in)?s?$/))) return Number(m[1]) / 60;
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?\s*(?:(\d+)\s*m?(?:in)?s?)?$/))) return Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0);
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  return null;
}

const tidy = (h) => String(Math.round(h * 100) / 100);

// Type the hours straight in, with small − / + for nudges.
export function HoursInput({ id, value, onChange, min = 0, max = 744, step = 0.5, label }) {
  const [text, setText] = React.useState(tidy(value));
  const [focused, setFocused] = React.useState(false);
  React.useEffect(() => {
    if (!focused) setText(tidy(value));
  }, [value, focused]);
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const commit = (raw) => {
    const h = parseHours(raw);
    if (h != null) onChange(clamp(h));
  };
  return (
    <div className="hours-in">
      <button type="button" className="ib soft" aria-label={`Less ${label}`} onClick={() => onChange(clamp(Math.round((value - step) * 2) / 2))}>
        &#8722;
      </button>
      <label className="hours-field">
        <span className="sr">{label}</span>
        <input
          id={id}
          className="d"
          inputMode="decimal"
          value={text}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onChange={(e) => {
            setText(e.target.value);
            commit(e.target.value);
          }}
          onBlur={() => {
            setFocused(false);
            setText(tidy(value));
          }}
        />
        <span className="hours-unit">h</span>
      </label>
      <button type="button" className="ib soft" aria-label={`More ${label}`} onClick={() => onChange(clamp(Math.round((value + step) * 2) / 2))}>
        +
      </button>
    </div>
  );
}

// A row of mutually exclusive choices.
export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
