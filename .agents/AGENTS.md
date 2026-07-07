# Workspace — Agent Rules

These rules apply to all AI agents and automation tooling working in this workspace (Copilot-style assistants, scripted agents, CI automations, and human-invoked LLM tools).

Canonical guidance sources (read in this order unless otherwise instructed):

- `.agents/AGENTS.md` — workspace-wide agent rules (this file).
- `.github/copilot-instructions.md` — repository-wide AI instructions and coding expectations.
- `.github/references/angular-shared.md` — shared Angular conventions (WCI naming, CSS, API, UI preferences).
- `.agents/skills/angular-developer/SKILL.md` — Angular code generation skill (consult when generating code or when the skill is explicitly invoked).

Notes for agents:

- Always load and apply rules from the three canonical sources above before making code changes or generating files.
- Treat `.github/skills/angular-agent/references/angular-ai-tutorial-reference.md` as a large archive — do NOT read it eagerly; only load it when the user explicitly requests tutorial or setup content.
- If an agent does not have permission to read a file, report the missing file path and continue with available guidance.
- Agents with MCP access should use the project's MCP integration service patterns defined in skill references rather than making direct external changes without a human in the loop.

---

## Angular Version

- This project uses **Angular 20**. Do not use or suggest features from Angular v21+.
- Use reactive forms for all form handling.
- Standalone components are the default; do not set `standalone: true` explicitly.
- Do not set `changeDetection: ChangeDetectionStrategy.OnPush`.

## TypeScript

- Use strict TypeScript typing throughout. Avoid `any`; use `unknown` when the type is uncertain.
- Prefer type inference when the type is obvious.

## Components and Templates

- Use `input()` and `output()` functions instead of `@Input()` / `@Output()` decorators.
- Use `@if`, `@for`, `@switch` instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use class/style bindings instead of `ngClass`/`ngStyle`.
- Do not use `@HostBinding` or `@HostListener`; use the `host` object in the component decorator.
- Prefer inline templates for small components.
- Use `NgOptimizedImage` for static images.

## Reactivity and State

- Prefer signals for local component state and `computed()` for derived state.
- Use `inject()` for dependency injection — not constructor injection.

## Services

- Use `@Injectable()` decorator (not `@Service` — that does not exist in Angular).
- Use `providedIn: 'root'` for application-wide singleton services.
- Keep services focused on a single responsibility.
- New services follow the naming pattern: `<feature>.service.ts` (e.g., `concept.service.ts`).

## HTTP and API Layer

- **Never call `HttpClient` directly from a component.** All HTTP must go through `ApiService`
  (`src/app/services/api.service.ts`) or a domain-specific service that wraps it.
- Base URLs are sourced from the environment files:
  - Dev: `src/environments/environment.ts` → `environment.url = 'https://dev.terminologyhub.com'`
  - Prod: `src/environments/environment.prod.ts` → `environment.url = 'https://api.terminologyhub.com'`
- Always import from `environment` (Angular's build system swaps the file at build time).
- Use template literals for string interpolation in API queries: `` `${this.apiUrl}/endpoint` ``

## Styling and UI Libraries

- **Prefer Bootstrap 5** for layout, spacing, typography utilities, and general UI structure.
- **Prefer `@ng-bootstrap/ng-bootstrap`** for interactive Angular-aware Bootstrap components
  (modals, tooltips, dropdowns, popovers, pagination, etc.).
- **Use Angular Material (`@angular/material`)** only when a Bootstrap/ng-bootstrap equivalent
  does not exist or is substantially inferior for the use case.
- Define styles in component `.scss` files or global styles. Never use inline `style=""` attributes.
- Follow the WCI CSS convention: organize class rules **alphabetically** in shared style files;
  add new rules in the proper alphabetical position, not appended to the bottom.

## Testing

- This project uses **Jest** with `jest-preset-angular`. Do not use Vitest.
- Test configuration: `jest.config.js` and `setup-jest.ts` at the project root.
- E2E tests use **Cypress** (`cypress.config.ts`).
- Run `ng build` after generating component/service code to verify no compilation errors.

## Accessibility

- All generated output must be AXE-compliant and meet **WCAG AA** standards.
- Use semantic HTML and ARIA attributes for custom interactive components.

## Routing

- Use `ActivatedRoute` for reading route data and params inside components.
- Use `routerLink` in templates for navigation links.

## WCI Naming Conventions

- **Classes**: PascalCase. Avoid redundant suffixes (e.g., do not name a file `concept.service.service.ts`).
- **Variables**: camelCase starting with a lowercase letter.
- **Component selectors**: follow existing patterns in the codebase (inspect nearby components before generating new ones).
