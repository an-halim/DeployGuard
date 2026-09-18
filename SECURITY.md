# Security policy

## Supported version

Only the latest revision on `main` is supported during the MVP phase.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub private vulnerability reporting if it is enabled for the repository, or contact the repository owner privately. Include impact, reproduction steps, and any suggested mitigation.

Do not include real credentials, private deployment data, or user information in a report.

## Deployment security notes

- Store SSH material only in the protected GitHub `production` environment.
- Use a dedicated VPS deployment user and SSH key.
- Verify host-key fingerprints before populating `VPS_KNOWN_HOSTS`.
- Keep the application bound to loopback behind a TLS reverse proxy.
- Grant registry credentials only `read:packages` on the VPS.
