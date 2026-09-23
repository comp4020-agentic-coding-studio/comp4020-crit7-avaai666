# Process overview

## What I built

A clash-aware class picker. Every group says "fits" or "clashes with …"
before you pick it.

## How I got here

The week ran over six sessions. Each one started from a contract before any
code: DESIGN.md, a "Do NOT" list in CLAUDE.md, and the spec as failing tests.
The agent had no browser, so every claim came with pasted command output. I
curled the live URL, deployed a second time to test the data, and opened the
page at 1920×1080 and 390×844 myself.

## Moments

### 1. Contract before code
- **What happened:** "Build me a timetable app" got me features I didn't ask
  for in every earlier week.
- **What I did instead:** Before any code, I froze DESIGN.md with a "Not in
  scope" list, added a "Do NOT" list to CLAUDE.md, and wrote the clash rule
  and the picking flow as failing tests.
- **How I knew:** The tests failed for the right reason: "Cannot find
  module". The starter's 28 tests stayed green.
- **Citation:** [`6635a1b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/6635a1bb48a895f167aed2fdb28e17f5cf20385d), [`d7b6119`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/d7b61193413a33b564aaf8e4e7d411b443741962)

### 2. The agent stopped instead of working around the spec
- **What happened:** DESIGN.md's pick table had two columns, but its own rule
  ("one pick per course and type") needed both in the table. It also didn't
  say what an unknown class id does.
- **What I did instead:** CLAUDE.md says "if DESIGN.md is wrong, stop and
  tell me". It did. I amended DESIGN.md, turned unknown ids into a 404 test,
  and made the page label and the server refusal one function,
  `optionStatus`.
- **How I knew:** The new tests failed first, then passed. `git diff --stat`
  showed only additions to the spec.
- **Citation:** [`7a284f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/7a284f7ae1ecca411847fb0deb595a4315968c9e), [`7515b30`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/7515b307d181dd56c0130835dcee62bd59362400)

### 3. "Seed only when empty" would have kept the old lecture time
- **What happened:** I moved MATH1005's lecture in DESIGN.md. The catalogue
  only seeded an empty database, so production would never see the change.
- **What I did instead:** The spec got a test first: open a database with
  the old time, reopen with the new seed, expect the new time. Then the
  seed became an upsert.
- **How I knew:** 53 passed after the change. The live site showed MATH1005
  LEC 01 at Mon 14:00–15:00 on a volume that held the old catalogue.
- **Citation:** [`6a37dcb`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/6a37dcbae37b0e1f5f89bbab2940405c12daaf8e), [`bc7458d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7458d55f4bc46a2465571009bf0959d8285098)

### 4. Persistence proved, not assumed
- **What happened:** A second SQLite file outside Fly's `data` volume would
  pass every local test and lose every pick on the next deploy.
- **What I did instead:** Before writing tables, the agent had to answer yes
  or no: same driver, same migrations, same file on the volume. After
  shipping, I picked a class live and deployed again.
- **How I knew:** Yes to all three, with the path (DATABASE_PATH). After the
  second deploy, the same cookie jar still showed COMP4020 CRIT 02 picked.
- **Citation:** [`501a6ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/501a6efc90121e77aa509aea9f82911b6c757be2), [`bc7ec25`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7ec253bc9d8281f4a9ff49f35760df30558045)

### 5. Looking caught what tests couldn't
- **What happened:** `pnpm check` was green, but the desktop grid's time
  column was empty and the phone list had a stray bullet.
- **What I did instead:** I opened the page instead of trusting green.
- **How I knew:** The fix diff was exactly those two things, and `pnpm
  check` stayed green.
- **Citation:** [`36944a7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/36944a7f8d795d7d41d9ba9b5213ba3846a6279d)

## Working notes (session 7+, to be merged)

### The design said "nothing else", so I changed the design
- **What happened:** I added Progress, Preview and Fill to DESIGN.md. But
  "The one flow" still ended "That is the whole product. Nothing else."
  The agent flagged that my own document now contradicted itself.
- **What I did instead:** I fixed the document, not the code. One line
  after the flow now says those three sections are part of the product,
  in its own commit.
- **How I knew:** The diff for the first amendment was additions only (49
  lines, 0 removed), and the second was the one line.
- **Citation:** [`bc51ac4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc51ac4f657349706e27706982a73a57b13141c7), [`aca5b9f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/aca5b9f0b5d2020a1f4313d6a84bb207968c7e9e)

### Fill the rest: spec first, and my count checked
- **What happened:** The bigger catalogue could have broken tests that
  count seed rows. And "the result is always the same" needed a real
  answer, not just "two runs agree".
- **What I did instead:** I gave the agent my count of clash-free
  completions (238) and asked it to tell me if its count differed. It
  counted from DESIGN.md's table on its own and got 238. The spec then
  pinned the exact first completion in listed order.
- **How I knew:** `git diff HEAD -- spec/` removed 0 lines. The 7 new
  tests failed for the right reasons, then passed. On the live site a
  fresh plan said "5 lectures fixed · 0 of 5 choices made", and after
  POST /api/fill it said "Your timetable is complete — no clashes."
- **Citation:** [`d9877de`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/d9877de68720231fed88c08612e88edf247431bf), [`a2f3f77`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/a2f3f7785ae57edb0a0b1a60c1610824b61b60e2)

### Chrome showed the preview two days wide
- **What happened:** Tests and curl were green. In Chrome the preview for
  COMP4020 CRIT 02 covered Thu and Fri. Its style was
  "grid-area: 25 / 5 / 31", with no column end.
- **What I did instead:** I asked for the placement to live in one
  function used by both the week blocks and the preview, with a test.
- **How I knew:** 3 new tests failed first, then passed. On my next look
  in Chrome the width was right.
- **Citation:** [`31fcc59`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/31fcc593c735a5d30991960914fbf97b539b6b25)

### My bug report was wrong, and the agent checked it
- **What happened:** I reported that "Saved." never appeared, and guessed
  the in-place update cleared it. I told the agent to check, not take my
  word.
- **What I did instead:** It checked. The status node was never replaced,
  and in headless Chromium "Saved." appeared. The one step that could
  silently not run was an animation frame, so it moved the status into a
  function that writes the text at once, with tests.
- **How I knew:** The 3 status tests failed first, then passed. Later I
  found my report came from a background tab (visibilityState: hidden).
  The new createStatus() works even there.
- **Citation:** [`4bba53f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/4bba53f74b3b3136dfa59005cdb80a5257a3132b)

### Side by side, measured
- **What happened:** The see-through preview on top of the black MATH1005
  lecture made both labels unreadable.
- **What I did instead:** I asked for calendar-style halves instead of
  transparency, with the "which half" decision tested. The agent measured
  the boxes in headless Chromium, and that caught two bugs the tests
  didn't: the halves overlapped by 7px, and the grid changed height on
  hover.
- **How I knew:** After the fix the grid stayed at 488–1160 before, during
  and after the hover, and the lecture (987–1037) and preview (1039–1090)
  didn't overlap. Then I looked in Chrome and said "looks right".
- **Citation:** [`1a4ea44`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/1a4ea44187097e71d0af5f768db1e0070372cb72)
