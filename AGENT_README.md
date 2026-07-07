Agent documentation — where AI agents should look first

Purpose

This file points AI agents and humans to the canonical workspace instructions, skills, and references used by TermHub UI. It exists to make onboarding and automation deterministic.

Recommended loading order

1. `.agents/AGENTS.md` — workspace-level agent rules and constraints.
2. `.github/copilot-instructions.md` — repository-wide AI instructions and coding expectations.
3. `.github/references/angular-shared.md` — shared Angular conventions (WCI naming, CSS, API, UI preferences).
4. Relevant `SKILL.md` files under `.agents/skills/` or `.github/skills/` — consult only when performing skill-specific tasks.

Notes

- Large tutorial archive: `.github/skills/angular-agent/references/angular-ai-tutorial-reference.md` is intentionally large; load it only when the user explicitly requests tutorial/setup content.
- Agents should log which files they loaded and report missing permissions or unreadable files.
- Do not override repository-wide rules without explicit human approval.

Contact

If a required file is missing or unclear, report the path and ask a human for guidance.
