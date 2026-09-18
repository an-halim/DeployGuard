# Contributing

## Workflow

1. Create a short-lived branch from an up-to-date `main` branch:
   - `feat/<name>` for user-facing behavior.
   - `fix/<name>` for a defect.
   - `docs/<name>` for documentation only.
   - `chore/<name>` for tooling or maintenance.
2. Add or update tests before changing behavior.
3. Run all local checks.
4. Use focused Conventional Commits.
5. Open a pull request using the repository template.
6. Merge only after CI passes and review feedback is resolved.

Direct pushes to `main` should be disabled with a branch protection rule requiring the `quality` and `container` checks.

## Local checks

```bash
npm ci
npm run lint
npm run test:coverage
npm run build
docker build -t deployguard:check .
```

## Commit examples

```text
feat: add deployment readiness checklist
fix: recover from malformed stored deployments
test: cover readiness status filters
docs: explain VPS rollback process
build: publish immutable GHCR images
```

Keep formatting-only or documentation changes separate from functional changes when that makes review easier. Do not combine unrelated refactoring with a feature or bug fix.

## Design expectations

- Keep readiness rules pure and independent of UI components.
- Validate data at browser or network boundaries.
- Preserve keyboard navigation and meaningful accessible names.
- Avoid adding dependencies for behavior that is simple to implement and test locally.
- Document new environment variables, operations, and architectural decisions.

## Pull request review

Reviewers should verify behavior, automated tests, accessibility, failure handling, security boundaries, and rollback impact. A successful build alone is not approval.
