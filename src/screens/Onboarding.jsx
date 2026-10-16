import React, { useState } from 'react';
import { Header, Icon, IconButton, Logo, Ring, Say } from '../components/ui.jsx';
import { FixedCostsEditor, TargetForm } from '../components/forms.jsx';
import { freeForDay, weekFixed, weekFree } from '../budget.js';
import { fmt } from '../time.js';

export default function Onboarding({ state, dispatch }) {
  const [step, setStep] = useState(0);
  const free = weekFree(state.fixedCosts);
  const back = (
    <IconButton label="Back" onClick={() => setStep(step - 1)}>
      <Icon.back />
    </IconButton>
  );

  if (step === 0) {
    return (
      <div className="app onb">
        <main className="welcome">
          <Logo size={132} label="Pocketwatch, the moustached clock" />
          <h1 className="d">
            Good day.
            <br />
            I'm Pocketwatch.
          </h1>
          <p>Your time accountant. Let's budget your hours so more of them go to what you love.</p>
          <Dots step={0} />
          <button type="button" className="btn" onClick={() => setStep(1)}>Let's begin</button>
        </main>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="app onb">
        <Header left={back}>
          <span className="lbl">Step 2 of 4</span>
        </Header>
        <main className="main">
          <Say>First, your fixed costs. These are your bills: time you don't get to choose.</Say>
          <h1 className="d h1">Fixed costs</h1>
          <FixedCostsEditor list={state.fixedCosts} onChange={(list) => dispatch({ type: 'setFixed', list })} />
          <button type="button" className="btn push" onClick={() => setStep(2)}>Continue</button>
        </main>
      </div>
    );
  }

  if (step === 2) {
    const weekday = freeForDay(state.fixedCosts, 0);
    const weekend = freeForDay(state.fixedCosts, 6);
    return (
      <div className="app onb">
        <Header left={back}>
          <span className="lbl">Step 3 of 4</span>
        </Header>
        <main className="main">
          <h1 className="d h1 center">Your free pool</h1>
          <div className="center-box">
            <Ring size={240} stroke={12} total={10080} segments={[{ value: free, color: 'var(--teal)' }]} label={`${fmt(free)} free this week`}>
              <div className="d hero-num teal">{Math.round(free / 60)} h</div>
              <div className="muted">free this week</div>
            </Ring>
          </div>
          <Say>That's your spending money. Every target you set draws from these {Math.round(free / 60)} hours.</Say>
          <div className="card list">
            <div className="li"><span className="strong">Monday</span><span className="muted">{fmt(weekday)} free</span></div>
            <div className="li"><span className="strong">Sunday</span><span className="muted">{fmt(weekend)} free</span></div>
            <div className="li"><span className="strong">Fixed costs</span><span className="muted">{fmt(weekFixed(state.fixedCosts))}</span></div>
          </div>
          <button type="button" className="btn push" onClick={() => setStep(3)}>Set my first target</button>
        </main>
      </div>
    );
  }

  return (
    <div className="app onb">
      <Header left={back}>
        <span className="lbl">Step 4 of 4</span>
      </Header>
      <main className="main">
        <h1 className="d h1">Your first target</h1>
        <TargetForm
          fixedCosts={state.fixedCosts}
          submitLabel="Create target"
          onSave={(target) => {
            dispatch({ type: 'addTarget', target });
            dispatch({ type: 'finishOnboarding' });
          }}
        />
        <button type="button" className="btn-text" onClick={() => dispatch({ type: 'finishOnboarding' })}>
          Skip for now
        </button>
      </main>
    </div>
  );
}

function Dots({ step }) {
  return (
    <div className="dots" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={i === step ? 'on' : ''} />
      ))}
    </div>
  );
}
