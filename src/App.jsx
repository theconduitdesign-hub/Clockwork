import React, { useEffect, useState } from 'react';
import { useNow, useStore } from './store.js';
import { applyTheme } from './themes.js';
import { Sheet, Sidebar, TabBar } from './components/ui.jsx';
import { useDesktop } from './useDesktop.js';
import { GoalForm, LogTimeForm, TargetForm } from './components/forms.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Today from './screens/Today.jsx';
import Week from './screens/Week.jsx';
import Targets from './screens/Targets.jsx';
import TargetDetail from './screens/TargetDetail.jsx';
import Savings from './screens/Savings.jsx';
import Settings from './screens/Settings.jsx';
import Statement from './screens/Statement.jsx';
import CheckIn from './screens/CheckIn.jsx';
import TimerView, { TimerBanner } from './screens/Timer.jsx';

export default function App() {
  const [state, dispatch] = useStore();
  const now = useNow(state.timer ? 1000 : 30000);
  const [tab, setTab] = useState('today');
  const [view, setView] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [selected, setSelected] = useState(null); // target shown beside the list on desktop
  const desktop = useDesktop();

  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  if (!state.onboarded) return <Onboarding state={state} dispatch={dispatch} />;

  const ctx = {
    state,
    dispatch,
    now,
    open: (v) => {
      // On desktop a target opens in the Targets page's detail pane rather than a page of its own.
      if (desktop && v.name === 'target') {
        setTab('targets');
        setSelected(v.id);
        setView(null);
      } else {
        setView(v);
      }
      window.scrollTo(0, 0);
    },
    back: () => setView(null),
    sheet: setSheet,
  };

  let content;
  switch (view?.name) {
    case 'target': content = <TargetDetail {...ctx} id={view.id} />; break;
    case 'settings': content = <Settings {...ctx} />; break;
    case 'statement': content = <Statement {...ctx} />; break;
    case 'timer': content = <TimerView {...ctx} />; break;
    case 'checkin': content = <CheckIn {...ctx} />; break;
    default:
      content =
        tab === 'today' ? <Today {...ctx} /> :
        tab === 'week' ? <Week {...ctx} /> :
        tab === 'targets' ? <Targets {...ctx} selected={selected} select={setSelected} /> :
        <Savings {...ctx} />;
  }

  const close = () => setSheet(null);
  const editing = sheet?.name === 'targetForm' && sheet.id ? state.targets.find((t) => t.id === sheet.id) : null;
  const otherAllocated = state.targets.filter((t) => t.id !== editing?.id).reduce((s, t) => s + t.weeklyHours, 0);

  // Desktop: which sidebar item is lit, and what each one does.
  const active = view?.name === 'statement' || view?.name === 'settings' ? view.name : tab;
  const nav = (id) => {
    if (id === 'statement' || id === 'settings') setView({ name: id });
    else {
      setTab(id);
      setView(null);
    }
    window.scrollTo(0, 0);
  };

  return (
    <div className={desktop ? 'app desk' : 'app'}>
      {desktop && <Sidebar active={active} onNav={nav} />}
      <div className="app-body">
        {content}
        {view?.name !== 'timer' && <TimerBanner {...ctx} />}
      </div>
      {!view && !desktop && (
        <TabBar
          tab={tab}
          setTab={(t) => {
            setTab(t);
            window.scrollTo(0, 0);
          }}
        />
      )}
      {sheet?.name === 'targetForm' && (
        <Sheet title={editing ? 'Edit target' : 'New target'} onClose={close}>
          <TargetForm
            key={editing?.id || 'new'}
            initial={editing}
            fixedCosts={state.fixedCosts}
            otherAllocated={otherAllocated}
            submitLabel={editing ? 'Save changes' : 'Create target'}
            onSave={(target) => {
              if (editing) dispatch({ type: 'updateTarget', id: editing.id, patch: target });
              else dispatch({ type: 'addTarget', target });
              close();
            }}
            onDelete={
              editing
                ? () => {
                    dispatch({ type: 'deleteTarget', id: editing.id });
                    close();
                    setView(null);
                  }
                : undefined
            }
          />
        </Sheet>
      )}
      {sheet?.name === 'log' && (
        <Sheet title="Log time" onClose={close}>
          <LogTimeForm
            targets={state.targets}
            defaultTargetId={sheet.targetId}
            onSave={(entry) => {
              dispatch({ type: 'addEntry', entry });
              close();
            }}
          />
        </Sheet>
      )}
      {sheet?.name === 'goal' && (
        <Sheet title="New savings goal" onClose={close}>
          <GoalForm
            onSave={(g) => {
              dispatch({ type: 'addGoal', ...g });
              close();
            }}
          />
        </Sheet>
      )}
    </div>
  );
}
