# Angular AI Skills Reference

This reference provides Angular-specific context for Copilot skills, prompts, agents, and instructions in this workspace.

## When to use Angular AI skills

- To encapsulate a reusable workflow or assistant behavior for AI-enabled development tasks.
- When a task involves multiple steps, decisions, or structured guidance beyond a single prompt.
- When you want a named entry point that can be invoked directly from the chat interface.

## Skill vs Prompt vs Instruction vs Agent

- Skill: best for workflows with multiple steps, examples, or a decision path.
- Prompt: best for a focused request that needs parameters and a concise completion.
- Instruction: best for repository-wide behavior, coding style, or conventions.
- Agent: best when you need tool orchestration, subagents, or deterministic lifecycle behavior.

## Context to include in AI skill files

- Purpose: what the skill is for and why it exists.
- Use cases: when the skill should be invoked.
- Conventions: coding or workspace-specific expectations.
- Examples: typical inputs or outputs if useful.

## Recommended structure

- Top YAML frontmatter with `name`, `description`, and `user-invocable`.
- Markdown sections such as `## Purpose`, `## Use When`, `## Notes`, and `## Examples`.
- Optional `references/` files for supporting context and documentation.

## Best practices for AI skills in this workspace

- Keep Angular guidance aligned with MT2 UI conventions.
- Prefer strict typing and accessible output.
- Avoid plain text files for skill definitions; use `SKILL.md` instead.
- Put shared context and reference material in companion markdown files.

## Angular tutorial reference

- The detailed Angular tutorial and setup content has been moved to `angular-ai-tutorial-reference.md` for AI agent reference purposes.
- Keep this file focused on AI skill guidance, structure, and workspace conventions.
