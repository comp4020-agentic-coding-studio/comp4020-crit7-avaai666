# Process

## Process overview

The week ran over eight sessions. Each one started from a contract before
any code: DESIGN.md, a "Do NOT" list in CLAUDE.md, and the spec as failing
tests. The agent had no browser, so every claim came with pasted command
output. I curled the live URL, deployed twice to test the data, and opened
the page at 1920×1080 and 390×844. Later, looking became Playwright
checks.

## Moments

### 1. Contract before code
- **What happened:** "Build me a timetable app" got me unasked-for
  features in earlier weeks.
- **What I did instead:** Before any code, I froze DESIGN.md with a "Not in
  scope" list, added a "Do NOT" list to CLAUDE.md, and wrote the clash rule
  and the picking flow as failing tests.
- **How I knew:** The tests failed for the right reason: "Cannot find
  module". The starter's 28 tests stayed green.
- **Citation:** [`6635a1b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/6635a1bb48a895f167aed2fdb28e17f5cf20385d), [`d7b6119`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/d7b61193413a33b564aaf8e4e7d411b443741962)

### 2. The agent stopped instead of working around the spec
- **What happened:** DESIGN.md's pick table couldn't enforce its own rule,
  "one pick per course and type", and didn't say what an unknown id does.
- **What I did instead:** CLAUDE.md says "if DESIGN.md is wrong, stop and
  tell me". It did. I amended DESIGN.md, turned unknown ids into a 404
  test, and made the page label and the server refusal one function,
  `optionStatus`.
- **How I knew:** The new tests failed first, then passed. `git diff
  --stat` showed only additions to the spec.
- **Citation:** [`7a284f7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/7a284f7ae1ecca411847fb0deb595a4315968c9e), [`7515b30`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/7515b307d181dd56c0130835dcee62bd59362400)

### 3. Persistence proved, not assumed
- **What happened:** A second SQLite file off Fly's volume, or a seed that
  only runs on an empty database, would pass every local test.
- **What I did instead:** Before writing tables, the agent confirmed the
  database was on the volume. When I moved a lecture, a test opened
  an old-seed database first, and the seed became an upsert.
- **How I knew:** After a second deploy, the same cookie jar still showed
  my pick. The live site showed the new lecture time.
- **Citation:** [`501a6ef`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/501a6efc90121e77aa509aea9f82911b6c757be2), [`bc7ec25`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7ec253bc9d8281f4a9ff49f35760df30558045), [`6a37dcb`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/6a37dcbae37b0e1f5f89bbab2940405c12daaf8e), [`bc7458d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/bc7458d55f4bc46a2465571009bf0959d8285098)

### 4. Looking became checks
- **What happened:** Tests were green, but opening the page found an empty
  time column, then a preview two day-columns wide.
- **What I did instead:** I turned each bug found by looking into a
  Playwright check, and added a CLAUDE.md rule: run `pnpm test:e2e` before
  calling a UI change done. That changed what the agent must pass, not
  what I type next.
- **How I knew:** The checks passed. Then two old bugs were put back on
  purpose. The preview with no column end failed check 4 (103px too wide),
  and the bullets failed check 9. Restored, green again.
- **Citation:** [`36944a7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/36944a7f8d795d7d41d9ba9b5213ba3846a6279d), [`31fcc59`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/31fcc593c735a5d30991960914fbf97b539b6b25), [`5922e8e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/5922e8e8ee27c4624222b80898e5a888de9e3c08), [`f982aa1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/f982aa166dff2acaf230a3b6222f58b077ca7478)

### 5. My bug report was wrong
- **What happened:** I reported that "Saved." never appeared, and guessed
  the in-place update cleared it.
- **What I did instead:** I told the agent to check, not take my word. It
  found the status was never cleared. An animation frame could silently
  not run, so the status now writes at once.
- **How I knew:** The new status tests failed first, then passed. My report
  had come from a background tab, and the fix works there too.
- **Citation:** [`4bba53f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-avaai666/commit/4bba53f74b3b3136dfa59005cdb80a5257a3132b)
