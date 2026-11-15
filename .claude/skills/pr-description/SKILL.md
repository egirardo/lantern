---
name: pr-description
description: Write the pull request description for Lantern. Use when the user says they're ready to ship, wants to open a PR, or asks for a PR description.
---

Write the PR description in the same format as earlier PRs:

- **Summary**: sprint, phase and part
- **Changes**: per file
- **Notes**: decisions, and what's left for later PRs
- **How to test**

Check `git status` so every changed file is listed, and only claim checks you actually ran.

Don't print it in the terminal for the user to copy: the terminal wraps long lines and indents them, and those breaks and spaces end up in GitHub. Instead, write it to a `.md` file in the scratchpad directory and copy it to the clipboard with `pbcopy < <file>`. Tell the user it's on the clipboard, give the file's full path in case they need it again, and summarize the description briefly in the reply. Don't set it on the PR with `gh` unless the user asks.
