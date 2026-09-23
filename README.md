# Clash-free class picker

A clash-aware class picker: it rebuilds one slice of ANU class registration
(ISIS / MyTimetable) — choosing which lecture, tutorial or crit group you go
to for each course. Every group is labelled "fits" or "clashes with ..."
before you pick it, in words, on one screen. Picks save immediately and
survive a reload. Built for COMP4020, Crit 7. The catalogue is invented; see
`/about` for the reasoning.

## Running it locally

    pnpm install
    pnpm dev

The app is at `http://localhost:4321/`. State lives in a SQLite file at
`.data/app.db` (override with `DATABASE_PATH`); it's created and seeded with
the demo catalogue on first use.

## Running the tests

    pnpm check

This runs `astro check` (typecheck) and `pnpm test` (`astro build`, then the
full spec against the built server — the same artefact production runs).

## What good looks like here

DESIGN.md is the contract: what the app does, the clash rule, and the data
it's built on. It was written and frozen as failing tests before any of the
app existed, so "done" means the spec passes, not that it looks plausible.

Two things are enforced by tests, not just judgement: the page's "fits" /
"clashes with ..." label and the server's refusal to save a clashing pick
come from the same function, so they cannot disagree
(`src/lib/plan-store.ts`'s `optionStatus`) — and every pick is checked
server-side even if the page's own disabled button was somehow bypassed.
`spec/invariants.test.ts` and `spec/readme.test.ts` hold for any app, whatever
the week's brief; `spec/crit-7.test.ts` is this week's own contract.

What's a judgement call, not a check: the exact wording of each clash
message, the layout breakpoint (700px) between the desktop week grid and the
mobile day list, and which activities the demo catalogue invents. Those are
argued for in DESIGN.md, not asserted by a test.
