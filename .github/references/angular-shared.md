# Shared Angular AI Reference

This shared reference contains Angular guidance and workspace conventions intended to be consumed
by multiple AI skills in this repository (`angular-developer` and `angular-agent`).
Keep this file focused on shared context — do not put one skill's operational rules here.

---

## Purpose

- Single canonical source of Angular guidance for all AI skills.
- Covers WCI naming, CSS, API, and library preferences for MT2 UI.
- Cross-skill links to more detailed Angular reference material.

---

## Angular Version

This project is on **Angular 20**. Do not suggest or generate code using features from Angular v21+.
Use reactive forms.

---

## WCI Naming Conventions

- **Class names**: PascalCase. Never repeat type suffixes (e.g., use `ConceptService`, not `ConceptServiceService`).
- **File names**: kebab-case matching the class: `concept.service.ts`, `search-result.component.ts`.
- **Variable names**: camelCase starting with a lowercase letter.
- **Constants**: UPPER_SNAKE_CASE for module-level constants; camelCase for local constants.
- **Routing**: Prefer `ActivatedRoute` for reading route data and state. Use `routerLink` in templates for navigation.
- **Component selectors**: Follow the existing selector pattern found in nearby components before generating new ones.
- **Font usage**: Use defined logical font classes or the project default font. Do not introduce ad-hoc font styles.

---

## WCI CSS Conventions

- Define all styles in component `.scss` files or global stylesheets. **Never use inline `style=""` attributes.**
    - ✅ `<div class="cssClass">`
    - ❌ `<div style="margin: 5px">`
- Organize CSS class rules **alphabetically** within shared style files.
- Always add new CSS rules in the correct alphabetical position — do not append to the bottom of a file.
- Avoid utility-style ad-hoc classes; prefer semantic class names tied to the component's purpose.

---

## WCI UI Library Preference

MT2 UI includes both Bootstrap and Angular Material. Follow this preference order:

| Use Case                                                                               | Preferred Library                                                                             |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Layout, grid, spacing, typography utilities                                            | **Bootstrap 5**                                                                               |
| Interactive components (modals, dropdowns, tooltips, popovers, pagination, accordions) | **`@ng-bootstrap/ng-bootstrap`**                                                              |
| Complex data components (tables, form controls with Material Design spec)              | **Angular Material**                                                                          |
| All other cases                                                                        | Bootstrap / ng-bootstrap first; Angular Material only if Bootstrap lacks a suitable component |

Do not mix Bootstrap and Angular Material for the same UI pattern within a component.

---

## WCI API Conventions

- **Never call `HttpClient` directly from a component.** All HTTP calls must go through:
    - `ApiService` (`src/app/services/api.service.ts`) for generic REST calls, or
    - A domain-specific service (e.g., `terminology.service.ts`, `project.service.ts`) that wraps `ApiService`.
- **Base URL**: Always source the API base URL from the environment file.

    ```typescript
    import { environment } from '../../environments/environment';
    // environment.url resolves to:
    //   Dev:  'https://dev.terminologyhub.com'
    //   Prod: 'https://api.terminologyhub.com'
    // Angular's build system automatically swaps the file at build time.
    ```

- Use template literals for URL construction — never string concatenation with `+`:
    - ✅ `` `${this.apiUrl}/v1/concept/${id}` ``
    - ❌ `this.apiUrl + '/v1/concept/' + id`
- Use typed generics on all `HttpClient` calls: `this.http.get<ConceptModel>(url)`.
- Handle errors in the service layer using `catchError`; do not let raw HTTP errors surface to components.

---

## WCI Service Conventions

- Decorator: `@Injectable({ providedIn: 'root' })` for app-wide singletons.
- Injection: Use `inject()` function — not constructor injection.
- Responsibility: One service per domain concern. Do not create catch-all services.
- Observable vs Signal: Return `Observable<T>` from service methods; convert to signals at the component level when local reactivity is needed.

---

## Angular AI Skill Cross-References

For task-specific Angular guidance, consult the `angular-developer` skill references:

- Signals: `references/signals-overview.md`, `references/linked-signal.md`, `references/resource.md`
- Forms: `references/reactive-forms.md` (preferred for this project)
- Routing: `references/define-routes.md`, `references/route-guards.md`
- DI: `references/di-fundamentals.md`, `references/creating-services.md`
- Testing: `references/testing-fundamentals.md` (uses Jest + jest-preset-angular)
