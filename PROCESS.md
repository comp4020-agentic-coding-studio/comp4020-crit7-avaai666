# Process overview

<!-- TEMPLATE: this file is a shape to fill in, not a form. Replace everything
     in it with your own overview, and delete this comment — `pnpm
     check:evidence` will remind you if it's still here. -->

Written by you, for a reader: how you got from the brief to the harness and
agentic workflow behind this submission. Markers read this file and follow its
citations; they don't trawl the repo for evidence you didn't point at.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

A sentence or two. `README.md` is where the account of what the app is and what
good means here lives; this file is how you got there.

## How I got here

The account of the process: how the work actually went, and how you knew the
result was right. Tell it in whatever order makes it clear. A weekly prototype
needs a paragraph or two; an assignment needs more.

Cite the record as you go, as links whose text is the commit hash or range and
whose target is this repo's commit or compare URL, so a reader clicks straight
to the evidence:

- one commit: [`a1b2c3d`](https://github.com/YOUR-ORG/YOUR-REPO/commit/a1b2c3d)
- a range:
  [`a1b2c3d...e4f5a6b`](https://github.com/YOUR-ORG/YOUR-REPO/compare/a1b2c3d...e4f5a6b)

To pair a prompt with the commit it produced, quote the prompt (curated, not a
full transcript) next to the citation:

> the prompt, verbatim

Screenshots are welcome where one carries the point better than a sentence does.
Commit the file to this repo and link it with a **relative** path, which is what
makes it render on GitHub: `![alt text](docs/before.png)`. Images don't count
towards the word count and don't replace the citation.

## Moments (working)

### Contract before code
- **What happened:** The obvious move was "build me a timetable app". Every
  earlier week, that got me features I didn't ask for.
- **What I did instead:** Before any code, I froze DESIGN.md with a
  "Not in scope" list, added a "Do NOT" list to CLAUDE.md, and wrote the
  clash rule and the picking flow as failing tests.
- **How I knew:** The tests failed for the right reason: "Cannot find
  module". The starter's 28 tests stayed green. In the next session the
  spec files were not touched by the implementation commits.
- **Citation:** [`6635a1b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/6635a1bb48a895f167aed2fdb28e17f5cf20385d), [`d7b6119`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/d7b61193413a33b564aaf8e4e7d411b443741962)

### Ground the database before writing it
- **What happened:** "Still there after reload" depends on the database
  living on Fly's `data` volume. A second SQLite file somewhere else would
  pass every local test and lose everything on the next deploy.
- **What I did instead:** I made the agent paste the guestbook's DB module
  and fly.toml's mounts, and answer yes or no: same driver, same migration
  mechanism, same file on the volume. It had to stop on a "no".
- **How I knew:** It answered yes to all three, with the path
  (DATABASE_PATH). The new tables were added through the guestbook's own
  migration mechanism.
- **Citation:** [`501a6ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/501a6efc90121e77aa509aea9f82911b6c757be2)

### The agent stopped instead of working around the spec
- **What happened:** DESIGN.md's pick table had two columns, but its own
  rule ("one pick per course and type") needed course and type in the
  table. It also didn't say what happens with an unknown class id.
- **What I did instead:** CLAUDE.md says "if DESIGN.md is wrong, stop and
  tell me". It did. I didn't accept the workaround quietly. I amended
  DESIGN.md so the document and the code say the same thing, and turned
  its guess about unknown ids into a test (404). I also made the page's
  label and the server's refusal use one function, so they can't disagree.
- **How I knew:** The new tests failed first, then passed. `git diff
  --stat` showed only additions to the spec.
- **Citation:** [`7a284f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/7a284f7ae1ecca411847fb0deb595a4315968c9e), [`7515b30`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/7515b307d181dd56c0130835dcee62bd59362400)

### The seed data wasn't there until I asked for it
- **What happened:** I queried the dev server's throwaway database directly
  to check the seed catalogue before writing curl bodies for the API tests.
  It came back empty, even though `GET /` had already loaded fine.
- **What I did instead:** I didn't assume the seed was broken. `GET /` only
  touches the guestbook's own DB module, never `plan.ts`, so the activity
  table is seeded on its first real use, not at server start. I issued a
  `GET /api/picks` first, then re-queried and got the 11 seeded rows.
- **How I knew:** The re-query matched the seed catalogue exactly, ids 1-11
  in insertion order, so I built the 8 curl scenarios against real ids
  instead of guessed ones.
- **Citation:** [`4057f1b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/4057f1b081f629819bfafcda5900dd310bd57e81)

### I curled a real pick before trusting the page
- **What happened:** `/plan` rendered cleanly with zero picks, every option
  "fits". That's the easy case. It doesn't prove the picked/clash rendering
  or the week grid actually work.
- **What I did instead:** Rather than read the template and assume it was
  right, I posted a real pick through `/api/picks`, reloaded `/plan` with
  the same cookie, and grepped the HTML for the disabled button, the
  "clashes with ..." text, and the week grid/list entries.
- **How I knew:** The grep showed `data-status="picked"` with a Remove
  button on the picked class, `data-status="clashes"` with `disabled` and
  the exact clash wording on the class it blocks, and the picked class in
  both the grid and the day list.
- **Citation:** [`2bb7938`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/2bb7938c28cd2c3ce33832537b7a5ef3c75d0df9)

### One test going red was the plan working, not breaking
- **What happened:** Moving the clash picker onto `/` made
  `guestbook.test.ts` fail — the reload-persistence check now hit the plan
  page, not the guestbook. `pnpm check` came back with a real failure.
- **What I did instead:** I didn't touch the test or the new page to paper
  over it. Step 0 had already named `guestbook.test.ts` as the one test
  file allowed to go with the guestbook, in its own commit, right after.
  I pasted the red run as real evidence, then deleted that test together
  with the guestbook code in the next commit, nothing else.
- **How I knew:** After the deletion commit, the same three commands
  (`grep -i guestbook`, `pnpm test`, `pnpm check`) came back clean: no code
  or test still refers to it, 48 passed, 0 typecheck errors.
- **Citation:** [`caa9926`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/caa9926b65c755bea48f28b884b74e12e4ab7156), [`bc7ec25`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7ec253bc9d8281f4a9ff49f35760df30558045)

### I deployed twice to prove the data, not just the code
- **What happened:** Passing every local test only proves the app works
  against a database I control. A second SQLite file living in the
  container instead of on the volume would pass those same tests and lose
  every pick on the next deploy.
- **What I did instead:** I picked a class on the live URL, deployed again
  with the same command, and checked the same cookie jar afterwards instead
  of trusting that the first deploy was proof enough.
- **How I knew:** After the second deploy, `GET /` with that jar still
  showed COMP4020 CRIT 02 as picked — the pick survived a deploy that
  replaced the container, so it was reading the volume, not the image.
- **Citation:** [`bc7ec25`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7ec253bc9d8281f4a9ff49f35760df30558045)

### Lectures come first meant DESIGN.md had to say so before code did
- **What happened:** the seed catalogue never had a "fixed" concept. Adding
  one straight into the picker code would have made the code the source of
  truth instead of the doc, which CLAUDE.md rules out.
- **What I did instead:** wrote "Lectures come first" and moved MATH1005's
  lecture time in DESIGN.md first, updated the spec to match, and only then
  changed the picker code — three separate commits, in that order.
- **How I knew:** `git log` shows DESIGN, then spec, then implementation.
  Two spec assertions I'd missed the first time only broke once the
  implementation was real; I had those explained and fixed in their own
  commit before `plan-store.ts` changed.
- **Citation:** [`2e209d2`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/2e209d2624f82c85ac79dfc0753fc8835ae06052), [`6a37dcb`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/6a37dcbae37b0e1f5f89bbab2940405c12daaf8e), [`f60aa6e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/f60aa6e83830dea150d4959996cd945e479cbc11), [`bc7458d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7458d55f4bc46a2465571009bf0959d8285098)

### Upsert stopped a deploy that would have shipped the old lecture time
- **What happened:** the catalogue was seeded once, only on an empty
  database. That's fine until a seed value changes — a database that
  already has rows would never notice the MATH1005 lecture moved.
- **What I did instead:** had seed-if-empty replaced with an upsert keyed
  on course/type/group, so every server start reconciles the database to
  whatever's in DESIGN.md's table, not just the first one ever run.
- **How I knew:** ran the full suite after the change — 53 passed, 0
  typecheck errors — then checked the deployed site directly: `GET /`
  showed MATH1005 LEC 01 at the new Mon 14:00–15:00 time, on a machine
  that already had the old catalogue sitting in its volume before this
  deploy.
- **Citation:** [`bc7458d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7458d55f4bc46a2465571009bf0959d8285098)

### The palette came with its own accessibility rule, not just colours
- **What happened:** DESIGN.md's Look section named the ANU palette and
  one exception for disabled text, but "AA for text under 24px" isn't a
  colour, it's a ratio.
- **What I did instead:** instead of picking a grey that looked about
  right, had the exact relative-luminance contrast computed for candidate
  greys before choosing one, and had that number written into the
  stylesheet next to the variable so the reasoning doesn't disappear.
- **How I knew:** the number is in the CSS comment — `#666666` on white,
  5.74:1, clear of the 4.5:1 floor. I know this repo's own tests turn
  axe-core's contrast check off, so this had to be checked by hand or not
  checked at all.
- **Citation:** [`dd192ae`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/dd192aeaf73bfa086cf267545d12226dbe07d2d2)

### The click-through caught two things no test could
- **What happened:** `pnpm check` was green and the manual curl checks all
  matched, but the week grid's time column was empty, and the phone list
  showed a bullet on some rows and not others.
- **What I did instead:** looked at the actual click-through instead of
  taking a green test run as "looks right," named both issues specifically,
  and had them fixed in one commit before deploying.
- **How I knew:** the fix commit's diff was exactly those two things — hour
  labels placed on the same grid rows the events use, and one list-style
  rule removing every list's marker — and `pnpm check` stayed green after.
- **Citation:** [`36944a7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/36944a7f8d795d7d41d9ba9b5213ba3846a6279d)

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
