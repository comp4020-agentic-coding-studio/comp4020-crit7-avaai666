# What this is

A clash-aware class picker. It rebuilds one slice of ANU class registration
(ISIS / MyTimetable): choosing which lecture, tutorial or crit group you go
to for each course.

# What annoys me about the real one

Enrolment week is the worst week. Everyone logs in at once. The site slows
down, keeps loading, or freezes.

When it does load, I still can't see all my class times in one place. I check
lectures and tutorials against each other by hand. It is easy to miss a clash.

Usually I find the clash after I've picked. By then the good tutorial groups
are full, and I start again.

My version does not fix the load. That is a server capacity problem, not a
design problem. It fixes the part a design can fix: every clash is visible
before you pick, written in words, on one screen.

# The one flow

1. You see each course, and under it each activity type (LEC, TUT, CRIT...).
2. Under each activity type you see every group, with its day and time.
3. Every group is marked BEFORE you pick it:
     - "fits", or
     - "clashes with <COURSE> <TYPE> <GROUP> (<Day> <start>–<end>)"
   A clashing group cannot be picked. The reason is written out, in words,
   next to it. Not only a colour.
4. Picking a group saves it immediately. No save button.
5. Picking a different group of the same activity type swaps it.
6. Any pick can be removed.
7. Your week shows every group you picked.
8. Reload the page: your picks are still there.
9. Picking, removing or filling updates the page in place. It does not
   reload, the scroll position stays where it was, keyboard focus stays
   on (or next to) the button you pressed, and a status line says
   "Saved." or the error, in an aria-live region.

That is the whole product. Nothing else.

Progress, Preview before you pick and Fill the rest for me below are part of the product too.

# Lectures come first

An activity type with exactly one group is fixed. In the seed, that is
every LEC.

- Fixed classes are in your week from your first visit. You don't pick them.
- They can't be removed or swapped. Instead of a button they show a
  "Fixed" pill.
- Everything else is checked against them. A tutorial or crit that clashes
  with a lecture is unavailable from the start, with the reason in words:
  "clashes with lecture MATH1005 LEC 01 (Mon 14:00–15:00)".
- In each course, the lecture is listed first.
- If an existing pick clashes with a fixed class (e.g. after the timetable
  changes), the fixed class wins and that pick is dropped.

# The clash rule

Two classes clash when they are on the same day and their times overlap:

    a.day == b.day  AND  a.start < b.end  AND  b.start < a.end

Touching is not a clash. A class ending at 13:00 and one starting at 13:00
fit together.

When you swap a group, the group being replaced does not count as a clash
with its replacement.

The server checks the rule again on every pick. It never trusts the page.
A clashing pick is refused with HTTP 409 and a message naming the class it
clashes with. Nothing is written.

Picking an activity id that does not exist is refused with HTTP 404.
Nothing is written.

# What the page shows is what the server checks

The page's "fits" / "clashes with ..." label and the server's refusal
come from the same function. They cannot disagree.

# Progress

A "choice" is a course+type that is not fixed (every TUT, LAB, CRIT).
The top of the page always says, in words:
  "<n> lectures fixed · <k> of <m> choices made"
and, when k = m and nothing clashes:
  "Your timetable is complete — no clashes."

# Preview before you pick

Hovering or keyboard-focusing a Pick button shows where that class
would land in the week: a dashed outline block at its day and time.
If it clashes, the block it clashes with is outlined too, and the
preview says "clashes with ...". Moving away removes the preview.
Nothing is saved by previewing. On the phone list layout there is no
preview; the words next to the button already say it.

# Fill the rest for me

One button: "Fill the rest for me". It finds groups for every choice
you haven't made, so that nothing clashes, and saves them all at once.
- It never changes a pick you already made, and never touches a fixed
  class.
- It tries groups in the order they are listed, so the result is
  always the same for the same starting point.
- If there is no clash-free way to finish while keeping your picks, it
  saves nothing and says so: "No clash-free way to fill the rest while
  keeping your current picks. Try removing one."
- The server does the search. POST /api/fill → 200 with the new picks,
  or 409 with that message.

# Whose plan is it

No login. The first visit gets a random plan id in a cookie
(httpOnly, SameSite=Lax, one year). Picks belong to that plan id.
Two browsers are two independent plans.

# Data

Times are stored as minutes after midnight. Days are 1–5 (Mon–Fri).

    course    (code, title)
    activity  (id, course_code, type, group, day, start_min, end_min)
              unique (course_code, type, group)
    pick      (plan_id, activity_id, course_code, type)
              unique (plan_id, course_code, type)
              course_code and type are copied from the activity when the
              pick is written, so the database itself enforces one pick
              per course+type. They are never taken from the request.

The catalogue is seeded from the table below. It is DEMO data. The page
says so, visibly: "Demo timetable — times are invented."

    COMP4020  Agentic Coding Studio
      LEC  01  Mon 11:00–13:00
      CRIT 01  Wed 15:30–17:00
      CRIT 02  Thu 14:00–15:30
      CRIT 03  Fri 10:00–11:30
    COMP2100  Software Design Methodologies
      LEC  01  Tue 09:00–11:00
      TUT  01  Wed 16:00–18:00
      TUT  02  Thu 15:00–17:00
      TUT  03  Mon 13:00–15:00
      TUT  04  Fri 12:00–14:00
    MATH1005  Discrete Mathematical Models
      LEC  01  Mon 14:00–15:00
      TUT  01  Fri 10:00–11:00
      TUT  02  Tue 11:00–12:00
      TUT  03  Wed 12:00–13:00
    STAT1003  Statistical Techniques
      LEC  01  Wed 09:00–11:00
      TUT  01  Mon 15:00–16:00
      TUT  02  Wed 11:00–12:00
      TUT  03  Thu 12:00–13:00
      TUT  04  Fri 13:00–14:00
    COMP2310  Systems, Networks and Concurrency
      LEC  01  Thu 09:00–11:00
      LAB  01  Tue 12:00–14:00
      LAB  02  Wed 13:00–15:00
      LAB  03  Thu 11:00–13:00
      LAB  04  Fri 14:00–16:00

These are chosen on purpose: some groups clash, some only touch.

No two lectures clash. An unavoidable lecture clash means you can't take
both courses; that is an enrolment problem, out of scope.

# Layout

Desktop (1920×1080): the week as a grid, Mon–Fri, 08:00–20:00, beside the
course list.
Phone (390×844): no grid. The week is a list, grouped by day, below the
course list. No horizontal scroll.

Keyboard works: every pick and remove is a real button.

# Look

Colours follow the ANU web style guide palette
(webpublishing.anu.edu.au/web-style-guide/colours), and nothing else:

    ANU Gold        #BE830E   accent only, never more than ~1/8 of the page
    ANU Gold Tint   #F5EDDE   soft background (picked classes)
    Black           #000000   header bar, lecture blocks
    White           #FFFFFF   page background
    Unigrey         #333333   body text

- Gold is never used for text under 24px (it fails WCAG AA on white).
- Colour is never the only signal. Every state is also written in words.
- Header: black bar, white text "Clash-free class picker", and a small
  line "Student project · not an official ANU system".
- No ANU logo, crest or wordmark anywhere. This must never be mistaken for
  a real ANU page.
- Week view: lectures = black block, white text. Picked tutorials/crits =
  gold-tint block with a 4px gold left border, Unigrey text. Each block
  shows course, type, group and time as text.
- Options: "fits" = normal; "picked" = gold-tint row + "Picked" text;
  clashing = greyed text, disabled button, the reason in words.
- System font stack. No web fonts. No external requests.
- Focus ring visible on every button (2px black outline with offset).

## Look, version 2

Layout
- Max content width 1200px, centred. Course list left (~45%), week right
  (~55%) on desktop. The week column is sticky (top: 16px) so it stays in
  view while you scroll the course list.
- Each course is a card: white, 1px #E5E5E5 border, 8px radius, 16px
  padding. Course code in bold, title next to it in Unigrey.
- Activity type (LEC, TUT, LAB, CRIT) is a small uppercase label with
  letter-spacing, not a heading.
- Each group row: time · group · status · button, aligned in columns.
  Row height ≥ 44px (touch target).

Buttons
- Pick: black 1px border, white fill, black text. Hover/focus: black fill,
  white text.
- Remove: text-style button, underlined, Unigrey.
- Disabled Pick: no border, grey text, not-allowed cursor. The clash
  reason sits on the same row where it fits, under it where it doesn't.
- "Fill the rest for me": the one primary button on the page. Black fill,
  white text, 4px gold bottom border.

Status words
- "fits" → no word needed; the enabled Pick button is enough. Remove
  "fits" text.
- Picked → small "Picked" pill (gold-tint background, black text).
- Fixed lecture → small "Fixed" pill (black background, white text).
- Clash → the reason, in grey, starting with "Clashes with".

Progress
- Progress line becomes a bar under the page title: a thin track with a
  black fill for k/m, and the words next to it. Complete → the words are
  "Your timetable is complete — no clashes." with a black check mark.

Week
- Light hour lines every hour, lighter half-hour lines.
- Block text: course code bold on line 1, type+group on line 2, time on
  line 3. Truncate with an ellipsis, never overflow.
- A small legend under the week: Lecture (black), Picked (gold tint with
  gold edge), Preview (dashed outline). Words, not only swatches.

Type
- System font stack. Title 32px, course code 18px, body 16px, labels 12px
  uppercase. Line height 1.4.

How version 2 fits the rest of this file:
- An enabled Pick button is the 'fits' mark from The one flow.
- "Clashes with" is capitalised on the page only, with CSS. The text
  itself, and the server's refusal, still start "clashes with".
- The count line is always shown. When complete, the check mark and
  "Your timetable is complete — no clashes." are added to it.
- A picked row has no tint; the "Picked" pill is the mark. This replaces
  "gold-tint row" in the Options rule above.

# Not in scope

Login. ANU SSO. Real ANU data. Scraping any ANU site. Capacity / full
groups. Waitlists. Multiple semesters. Notifications. Dark mode. Anything
not listed in "The one flow".
