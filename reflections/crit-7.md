# Crit 7 reflection

## What was the breakthrough that moved the work forward?

One line in CLAUDE.md: "If DESIGN.md is wrong, stop and tell me."

In the second session the agent found that my own pick table couldn't
enforce my own rule. Before, it would have added two columns and moved
on, and I would never have known. This time it stopped and told me. I
fixed the design, not the prompt.

The second one came from using the app. Lectures aren't a choice. They go
in first, then you see which tutorials still fit. So I changed the design
again. The spec only changed when the design changed, in two listed
commits.

## What did this work change about who I want to be as a software developer?

I want to write down what "done" means before anything gets built, and
then check it the boring way.

The tests caught the clash rule. They didn't catch an empty time column,
or a preview two columns wide. Those were found by opening the page. So I
turned each one into a browser check. Now the agent has to pass them too.

I was wrong once as well. I reported a bug that was really my background
tab. The agent checked instead of believing me. That's what I asked it to
do, and I want to do the same with its reports.

The things that look right when they're wrong are the boring ones: a
hash, an hour label, a second deploy. I want to be the person who checks.
