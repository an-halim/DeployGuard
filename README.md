# DeployGuard

DeployGuard is a small, production-oriented web application for deciding whether a release is ready to deploy. Teams create a deployment, complete a structured checklist, and get an immediate readiness signal.

The application is intentionally local-first: deployment records stay in the browser, so the service has no database or backend to operate. The production image is a static React build served by an unprivileged Nginx process.

## Features

- Create and delete deployment readiness reviews.
- Checklist coverage for code quality, testing, security, database, observability, and rollback.
- Live progress and `Ready` / `Not Ready` status.
- Search and status filters.
- Browser persistence with a safe sample record on first use.
- Responsive, keyboard-friendly interface.

## Quick start

Requirements: Node.js 22.12 or newer and npm.

```bash
npm ci
npm run dev
```

Open <http://localhost:5173>.

## Quality checks

```bash
npm run lint
npm run test:coverage
npm run build
```

Coverage thresholds are enforced at 80% for statements, branches, functions, and lines.

## Docker

Build and run the same image used in production:

```bash
docker build -t deployguard:local .
docker run --rm -p 8080:8080 deployguard:local
```

Open <http://localhost:8080>. The health endpoint is available at `/healthz`.

To validate the production Compose manifest locally:

```bash
DEPLOYGUARD_IMAGE=deployguard:local docker compose -f compose.production.yml up -d
```

## Documentation

- [Product scope](docs/product-spec.md)
- [Architecture and decisions](docs/architecture.md)
- [VPS deployment and rollback](docs/deployment.md)
- [Contributing and Git workflow](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [AI-assisted development record](docs/ai-assisted-development.md)

## Production model

Merges to `main` run linting, tests, coverage, application build, and a container build. After CI succeeds, GitHub Actions publishes the image to GHCR and deploys its immutable digest to a configured VPS over SSH.

No credentials are stored in this repository. See the [deployment guide](docs/deployment.md) for the required GitHub environment and VPS setup.

## License

[MIT](LICENSE)
