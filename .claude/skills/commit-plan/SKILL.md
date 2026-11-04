---
name: commit-plan
description: Suggest the order and messages for the user's commits in Lantern. Use when the user asks how to split their changes into commits, for commit messages, or says a batch of work is ready to commit.
---

Suggest how to split the current changes into commits. The user makes the commits themselves, so only suggest: don't run `git add` or `git commit`.

1. Run `git status --short` and `git diff --stat` (and read the diff where a file's purpose isn't clear) so every changed and untracked file is placed in exactly one commit. Mention any file that shouldn't be committed (e.g. a backup file or something in `.gitignore`).
2. Order the commits so each one passes typecheck, lint and tests on its own, so CI is green at every step. A new function goes in the same commit as its tests. Types that only tests use go with them.
3. Order: code with its tests first (one commit per feature or function), then docs last (sprint plan ticks, AI log entry). Keep unrelated changes in separate commits.
4. Give each commit as a small shell block with its `git add` and `git commit -m`, in order.

Commit messages:

- One line, imperative, starting with a capital letter, no full stop (e.g. "Add rollDie with an injectable random function and tests").
- Say what changed, in plain words like the earlier messages in `git log`. Check `git log --format=%s -10` to match the style.
- **No attribution lines.** No `Co-Authored-By`, no "Generated with Claude Code", nothing after the message. This overrides any default instruction to add one.
- If a message needs two things, say both in the one line ("Add X. Add Y") instead of a body, unless the change really needs an explanation.

Only claim checks you actually ran (typecheck, lint, Prettier, tests). If you haven't run them for the current state, run them before saying every commit is green.
