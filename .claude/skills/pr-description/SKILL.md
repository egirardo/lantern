---
name: pr-description
description: Write the pull request description for Lantern. Use when the user says they're ready to ship, wants to open a PR, or asks for a PR description.
---

Give the PR description as a Markdown block the user can paste into GitHub, in the same format as earlier PRs:

- **Summary**: sprint, phase and part
- **Changes**: per file
- **Notes**: decisions, and what's left for later PRs
- **How to test**

Check `git status` so every changed file is listed, and only claim checks you actually ran.
