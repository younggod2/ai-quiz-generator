# Contributing

This repository uses lightweight, consistent conventions so history stays readable and reviews stay fast.

## Workflow
- Create a feature branch from `main`.
- Keep changes focused and small.
- Open a PR/MR early for review if the change is non-trivial.
- `main` should stay green: tests + lint must pass before merge.

## Commit messages
We follow **Conventional Commits**.

Format:
```
<type>(<scope>): <summary>
```

Examples:
- `feat(api): add endpoint for health check`
- `fix(parser): handle empty input`
- `refactor(db): extract repository layer`
- `docs(readme): update local setup`
- `chore(deps): bump numpy to 1.26`

Rules:
- Use **imperative** verbs: `add`, `fix`, `remove`, `update`.
- Keep the subject ≤ 72 chars, no trailing period.
- One commit = one logical change. If you need "and", split into multiple commits.
- Optional body explains **why** (not just what).

Breaking changes:
- Add `!` after type or scope: `feat(api)!: remove v1 endpoints`
- Describe migration steps in the commit body.

## Scopes
Use a meaningful scope when possible (module/folder name), e.g.:
`api`, `ui`, `db`, `etl`, `ml`, `infra`, `docs`.

## Pull Requests / Merge Requests
PR description should include:
- **What** changed
- **Why** it changed
- **How** to test
- Risks / rollout notes if relevant

## Testing
- Add/adjust tests for bug fixes and behavior changes.
- Document manual test steps in the PR if automated tests are not possible.

## Style
- Prefer clarity over cleverness.
- Refactors must be behavior-preserving unless explicitly stated.
