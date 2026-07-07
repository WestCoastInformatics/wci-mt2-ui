---
name: angular-agent
user-invocable: true
description: 'Angular agent customization helper for TermHub UI. Use this skill to create, update, or review Angular-related Copilot skill, prompt, agent, or instruction files for this workspace.'
---

# Angular Agent Customization Helper

## Purpose

Help create and maintain Angular-related Copilot workspace customizations for TermHub UI.

## Use When

- you want to add a new `.github/skills/` skill for Angular tasks
- you need a prompt or instruction file specialized for Angular code conventions
- you want to scaffold a workspace skill for Angular development guidance

## How to Use

1. Choose whether this should be a skill, prompt, instruction, or custom agent.
2. Use the repository's Angular conventions when writing content.
3. Place the new file under `.github/skills/`, `.github/prompts/`, `.github/instructions/`, or `.github/agents/`.

## Angular Conventions

- Use strict TypeScript typing and avoid `any`.
- Prefer signals over class-based state when writing new Angular code.
- Keep output accessible and WCAG AA compliant.
- Encapsulate MCP server logic in services, not components.
- This workspace targets Angular 20. Do not suggest or generate Angular v21+ features for TermHub UI work.
- Prefer reactive forms for this repository.
- Consult `.agents/AGENTS.md` as the primary authoritative workspace rule source, with `.github/references/angular-shared.md` for shared naming and UI conventions.

## Shared Angular reference

For shared Angular guidance and conventions across AI skills, consult `.github/references/angular-shared.md`.

## Large Reference Files — Do Not Read Eagerly

`references/angular-ai-tutorial-reference.md` is a large archive file (~770 KB).
**Do NOT read this file unless the user explicitly asks for tutorial or setup content it contains.**
Reading it in full will consume most of your available context window.
Prefer the focused reference files in `references/` and in `.github/references/` for all standard tasks.
