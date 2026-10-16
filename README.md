# Pocketwatch

Spend your time before you spend it. Pocketwatch treats your week like a budget: fixed costs (sleep, work, meals) come off the top, the rest is your free pool, and every target draws hours from it. Hit a target under budget and the difference goes into time savings.

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
| Settings | Colour theme, edit fixed costs, export/import a JSON backup, start over |

## Targets

- **Daily, weekly or monthly.** Each target draws from its own pool: today's free time, this week's, or this month's. The form shows the pool, what's already planned in it, and what this target leaves.
- **Hours are typed straight in.** "2.5", "2:30", "45m" and "2h30" all work; − and + nudge by half an hour.
- **Strict or flexible.** Strict time is like a fixed savings account: editing it asks you to unlock first. Flexible time can slide or shrink.
- **Done when** takes markdown: `- [ ]` checklists you can tick on the target's page, **bold**, headings and lists.
- **Planned this week** on the Week page shows every day's plan: all 7 days on desktop, 3 at a time on a phone.

## Desktop

At 1024px and wider, Pocketwatch switches to its desktop layout: a sidebar (Today, Week, Targets, Statement, Savings, Settings) and multi-column pages. Targets shows the list and the selected target side by side, sheets open as centred dialogs, and a running timer floats in the bottom-right corner. Phones keep the tab bar layout. The switch lives in `src/useDesktop.js`; the desktop styles are the `@media (min-width: 1024px)` block at the end of `src/styles.css`.

## How the numbers work

- **Free pool** = 24 h × 7 minus your fixed costs.
- **Daily budget** for a target = its weekly hours spread across days in proportion to each day's free time.
- **Pace** compares what you've logged with how much of the week's free time has passed.
- **Settling a week:** a target marked done under budget saves the difference; going over budget borrows. Net savings pay off any time debt first, then go to your balance.

## Themes

Settings → Theme switches the whole app between the brand colour directions: **Teal + Gold** (default), **Signature Red**, **Banker's Green**, **Private Bank Navy** and **Oxblood**. Colours live in `src/themes.js` as CSS variables, so adding a theme is one new entry there.

## Where the data lives

Everything is stored in your browser's localStorage on this device (key `clockwork.v1`, kept from the earlier name so existing data carries over). No sign-in: it survives refreshes, closed tabs and restarts. The app also asks the browser to keep the data even when disk space is low.

Two things to know:

- Storage belongs to one address. `localhost:5173` (dev) and `localhost:4173` (preview) are different addresses with separate data, so always open the same one.
- Clearing site data, or a private window, wipes it. Safari also clears sites you haven't visited for 7 days unless the app is added to the Home Screen. Use Settings → Export backup now and then.

## Project layout

```
src/
  App.jsx            navigation (tab bar or sidebar), sheets
  useDesktop.js      desktop / phone layout switch
  store.js           state, reducer, localStorage
  budget.js          budgeting maths
  time.js            date and duration helpers
  styles.css         layout and components (colours come from themes.js)
  themes.js          the colour themes
  components/        logo, rings, bars, tab bar, forms
  screens/           one file per screen
```
