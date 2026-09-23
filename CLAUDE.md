# Your harness

This file is yours, and it arrives empty on purpose. The rules you hold the
agent to are part of what gets marked, so they should be rules you decided on.

Nothing about the starter is recorded here. What the repo ships is explained
where it lives --- `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each say what they fix --- and the
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec. Read them before you plan or build;
what the agent needs to carry from any of it is your call.

## This week (C7)

DESIGN.md is the source of truth. If the code and DESIGN.md disagree, the
code is wrong. If you think DESIGN.md is wrong, stop and tell me. Do not
work around it.

### Do NOT
- Do not add login, auth, or ANU SSO.
- Do not fetch or scrape any ANU website. The catalogue comes only from the
  seed table in DESIGN.md.
- Do not add features beyond "The one flow" in DESIGN.md.
- Do not modify .github/workflows/.
- Do not change the stack (Astro + SQLite on the Fly 'data' volume).
- Do not delete the guestbook until the new flow works end to end locally.
- Do not edit a spec test to make it pass. If a test looks wrong, stop and
  tell me why.
- Do not trust the page: the server re-checks every clash.
- Do not say something works without pasting the real command output.
  "Tests pass" with no output is not accepted.
- Do not put anything from reflections/ or PROCESS.md on the site.

### Every change
- One small piece per commit, with a message saying what changed.
- After each piece: run the tests and `pnpm check`, paste the real output.
- You have no browser. When a change affects what the page looks like, tell
  me exactly what to click and at which viewport, and wait for me.

## Process log (every session)

PROCESS.md grows as we work. At the END of every session:
1. Append this session's moments under "## Moments (working)".
2. Every moment does four things:
   - what happened (the problem, or what the agent got wrong)
   - what I did instead of the obvious thing, and why it was better
   - how I knew it was right (the check that was run, the viewport that was
     looked at, the diff that was read)
   - citation: [<short hash>](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/<full hash>)
3. Only real events from this session, with real hashes from `git log`.
   No moment without a commit. Do not invent feelings or reasons; use the
   decisions stated in my prompts.
4. Voice: first person (Ava). Short, plain sentences. No "leveraged",
   "robust", "seamless", "journey".
5. Commit it on its own: "C7: PROCESS — session N moments".

Word budget: the FINAL PROCESS.md is 400–550 words. The working list may
be longer. The final trim happens in the last session and keeps, in this
order: harness changes (a CLAUDE.md rule, a new test, a DESIGN amendment,
a thrown-away attempt) > things I caught by looking that no check caught >
everything else. Re-prompts alone are cut first.

reflections/crit-7.md is written in the last session, 150–300 words.
PROCESS.md and reflections/ never appear on the deployed site.
