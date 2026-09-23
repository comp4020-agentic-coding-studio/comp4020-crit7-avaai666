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

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
