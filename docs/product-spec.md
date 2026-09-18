# Product specification

## Problem

Small engineering teams often rely on an informal list of release checks. Important items such as rollback planning, monitoring, or database compatibility can be missed under time pressure.

## Users

- An engineer preparing a production deployment.
- A reviewer confirming that a release meets the team's minimum bar.

## Core journey

1. Create a deployment with a name, version, owner, and environment.
2. Complete checklist items grouped by operational concern.
3. Observe progress and readiness update immediately.
4. Search or filter past and active reviews.
5. Remove records that are no longer needed.

## Readiness rule

A deployment is `Ready` only when every checklist item is complete. The rule is intentionally deterministic and visible; DeployGuard does not claim to prove that a release is safe.

## Data and privacy

All records are stored as plaintext in the browser's origin-wide `localStorage`. No data is sent to a server. Clearing browser site data removes all records, and records do not sync between browsers or team members. Use a dedicated DeployGuard origin and never enter credentials, secrets, or sensitive personal data in deployment metadata.

## Non-goals for this version

- Authentication or multi-user synchronization.
- Integrations with CI providers or issue trackers.
- Approval signatures or audit-grade history.
- A backend database.

These are deliberate constraints for a focused six-hour MVP. The architecture document describes an evolution path if shared records become necessary.

## Acceptance criteria

- Users can create and delete deployment records.
- Each record starts with all standard checklist items incomplete.
- Toggling an item persists and recalculates progress.
- Completing every item marks the deployment ready.
- Search matches deployment name, version, or owner.
- Status filters separate ready and not-ready records.
- Invalid or obsolete locally stored data falls back safely.
- Core behavior is covered by automated tests with at least 80% coverage.
