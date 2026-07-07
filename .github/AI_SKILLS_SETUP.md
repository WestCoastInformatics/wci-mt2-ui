# Angular AI Skills Setup

This document explains how the Angular AI skills in this repository are organized and how to add shared conventions for use by all agents.

## Key files and locations

- `.github/copilot-instructions.md`
  - Use this for broad repository-level behavior and coding expectations.
  - Do not put detailed Angular conventions here.
- `.github/references/angular-shared.md`
  - Use this shared reference for company-specific Angular conventions, naming rules, CSS conventions, API conventions, and any workspace-wide Angular guidance.
  - Both `angular-agent` and `angular-developer` should reference this file.
- `.github/skills/angular-agent/SKILL.md`
  - This skill is for workspace customization and agent guidance around Angular-related Copilot files.
- `.agents/skills/angular-developer/SKILL.md`
  - This skill is for generating Angular code and providing Angular architectural best practices.
- `skills-lock.json`
  - Ensure external or installed skills are registered here if required by the skill runtime.

## Recommended agent setup

1. Keep shared Angular conventions in `.github/references/angular-shared.md`.
2. Add notes in skill files to point to that shared reference.
3. Keep skill files focused on behavior and guidance, not raw standards content.
4. Use `references/` subfolders in skill directories for task-specific documentation like signals, routing, forms, and testing.
5. Add workspace-level behavior to `.github/copilot-instructions.md` only when it applies across all agents.

## Agent loading order (recommended)

All AI agents and automation tools should follow this loading order when starting work in the repository:

1. Read `.agents/AGENTS.md` — workspace agent rules and safety constraints.
2. Read `.github/copilot-instructions.md` — repository-wide coding expectations and high-level policies.
3. Read `.github/references/angular-shared.md` — shared Angular conventions and WCI preferences.
4. Consult the relevant `SKILL.md` files under `.agents/skills/` or `.github/skills/` only when the agent is about to perform those skill-specific tasks (e.g., code generation).
5. Respect markers that indicate large files (for example: `angular-ai-tutorial-reference.md`) and load them only when the user explicitly requests tutorial/setup material.

Agents should log which files they loaded and report any missing permissions or unreadable files to the user before making changes.

## How this appears in project documentation

- The project `README.md` includes a dedicated section pointing to AI instruction docs.
- Use `.github/copilot-instructions.md` for broad repository-wide guidance and coding expectations.
- Use `.agents/AGENTS.md` for agent behavior rules that apply to all workspace agents.
- Use `.github/references/angular-shared.md` as the canonical shared Angular conventions reference.
- Keep `.github/skills/angular-agent/references/angular-ai-tutorial-reference.md` as a large archive reference; only read it when tutorial or setup-specific content is explicitly requested.

## What to put in `.github/references/angular-shared.md`

- Company-specific naming conventions
- CSS styling conventions and class organization rules
- API and service layer conventions
- Shared Angular workflow expectations for this repo

## What not to put in skill files

- Detailed tutorial content
- Long application setup guides
- Raw style guide documentation that should live in a shared reference file

## Example reference usage

- `angular-agent` can say: `Consult .github/references/angular-shared.md for shared Angular conventions.`
- `angular-developer` can say: `This skill also relies on shared Angular guidance available at .github/references/angular-shared.md.`

## Summary

Use `.github/references/angular-shared.md` as the canonical shared reference for workspace Angular standards, and keep both skill files linked to it. Use `.github/copilot-instructions.md` for broad, repo-wide guidance only.
