import React, { useRef, useState } from 'react';
import { Header, Icon, IconButton } from '../components/ui.jsx';
import { FixedCostsEditor } from '../components/forms.jsx';
import { THEMES } from '../themes.js';

export default function Settings({ state, dispatch, back }) {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clockwork-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Backup downloaded.');
  };

  const importData = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || !Array.isArray(data.targets)) throw new Error('bad');
      dispatch({ type: 'import', state: data });
      setMsg('Backup restored.');
    } catch {
      setMsg("That file isn't a Clockwork backup.");
    }
    e.target.value = '';
  };

  return (
    <>
      <Header left={<IconButton label="Back" onClick={back}><Icon.back /></IconButton>}>
        <h1 className="d title-lg">Settings</h1>
      </Header>
      <main className="main">
        <div className="lbl">Theme</div>
        <div className="themes" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const on = (state.theme || 'teal') === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                className={on ? 'theme-opt on' : 'theme-opt'}
                onClick={() => dispatch({ type: 'setTheme', theme: t.id })}
              >
                <span className="theme-sw" aria-hidden="true">
                  <span style={{ background: t.vars['--teal'] }} />
                  <span style={{ background: t.vars['--sand'] }} />
                  <span style={{ background: t.vars['--ink'] }} />
                  <span style={{ background: t.vars['--gold'] }} />
                </span>
                <span className="tn">
                  <span className="strong">{t.name}</span>
                  <small>{t.note}</small>
                </span>
                {on && <span className="small strong" style={{ color: 'var(--teal)' }}>In use</span>}
              </button>
            );
          })}
        </div>
        <div className="lbl" style={{ marginTop: 8 }}>Your fixed costs</div>
        <FixedCostsEditor list={state.fixedCosts} onChange={(list) => dispatch({ type: 'setFixed', list })} />
        <div className="lbl" style={{ marginTop: 8 }}>Your data</div>
        <div className="card list">
          <button type="button" className="it" onClick={exportData}>
            <span className="strong">Export backup</span>
            <span className="muted li-right">JSON <Icon.chevron /></span>
          </button>
          <button type="button" className="it" onClick={() => fileRef.current?.click()}>
            <span className="strong">Import backup</span>
            <span className="muted li-right"><Icon.chevron /></span>
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr" onChange={importData} aria-label="Import backup file" />
          {confirmReset ? (
            <button type="button" className="it danger" onClick={() => dispatch({ type: 'reset' })}>
              <span className="strong">Tap again to erase everything</span>
            </button>
          ) : (
            <button type="button" className="it" onClick={() => setConfirmReset(true)}>
              <span className="strong">Start over</span>
              <span className="muted li-right"><Icon.chevron /></span>
            </button>
          )}
        </div>
        {msg && <p className="note" role="status">{msg}</p>}
        <p className="muted small center push">Everything is stored in this browser, on this device. Export a backup now and then.</p>
      </main>
    </>
  );
}
