# Clockwork

Spend your time before you spend it. Clockwork treats your week like a budget: fixed costs (sleep, work, meals) come off the top, the rest is your free pool, and every target draws hours from it. Hit a target under budget and the difference goes into time savings.

## Run it

You need Node 18 or newer.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173). `npm run build` makes a production copy in `dist/`.

## What's in it

| Flow | Screens |
| --- | --- |
| Onboarding | Welcome, fixed costs, free pool, first target |
| Daily | Today (allocations + timers), timer, evening check-in |
| Plan the week | Week ring and by-day chart, targets, target detail with pace forecast |
| Settle up | Week statement (settle into savings or time debt), savings goals, streak |
| Settings | Edit fixed costs, export/import a JSON backup, start over |

## How the numbers work

- **Free pool** = 24 h × 7 minus your fixed costs.
- **Daily budget** for a target = its weekly hours spread across days in proportion to each day's free time.
- **Pace** compares what you've logged with how much of the week's free time has passed.
- **Settling a week:** a target marked done under budget saves the difference; going over budget borrows. Net savings pay off any time debt first, then go to your balance.

## Where the data lives

Everything is stored in your browser's localStorage on this device (key `clockwork.v1`). Use Settings → Export backup now and then.

## Project layout

```
src/
  App.jsx            navigation, sheets
  store.js           state, reducer, localStorage
  budget.js          budgeting maths
  time.js            date and duration helpers
  styles.css         Open Day Teal + Success Gold
  components/        logo, rings, bars, tab bar, forms
  screens/           one file per screen
```
