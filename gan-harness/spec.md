# DeployGuard evaluation spec

Build a responsive React/TypeScript deployment-readiness application. A user can create and delete deployment records, complete a six-category checklist, see progress and deterministic readiness, search records, filter by readiness, and retain data across page reloads. The application must handle malformed persisted data safely and remain fully usable by keyboard.

The production artifact is a non-root static Nginx container with a health endpoint. Continuous integration must lint, test with at least 80% coverage, compile the production bundle, and build the container. Successful `main` CI publishes an immutable GHCR image and deploys it to a user-managed VPS over SSH.
