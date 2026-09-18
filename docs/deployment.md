# VPS deployment

## Prerequisites

- A Linux VPS with Docker Engine and Docker Compose v2.
- A non-root deployment user that can run Docker.
- An existing reverse proxy and DNS record for the desired domain.
- A GitHub repository with Actions enabled.

The workflow stores versioned release bundles under `~/deployguard/releases/<commit>` on the VPS and exposes the application only on `127.0.0.1:8080` by default. The `~/deployguard/current` symlink identifies the active healthy bundle.

Published images support Linux AMD64 and ARM64 hosts.

## 1. Prepare the VPS

Confirm Docker is available for the deployment user:

```bash
docker version
docker compose version
mkdir -p ~/deployguard
```

If the GHCR package is private, log in once using a classic personal access token with `read:packages` only:

```bash
echo "$GHCR_READ_TOKEN" | docker login ghcr.io --username YOUR_GITHUB_USER --password-stdin
chmod 600 ~/.docker/config.json
```

Prefer making the image public when the repository and deployment model allow it. For a private package, use a dedicated read-only machine account/token with an expiry, record its rotation owner, and revoke it when the VPS is retired. Do not place a registry token in the Compose file.

## 2. Create a deployment SSH key

Use a dedicated key with access only to the deployment user. Add its public half to `~/.ssh/authorized_keys` on the VPS.

Collect the trusted VPS host-key line from a trusted network or directly on the server. Verify its fingerprint before storing it; do not discover it blindly during deployment.

## 3. Configure GitHub

Create an environment named `production`. Restrict it to the `main` branch and configure required reviewers before adding secrets.

Add these environment secrets:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | VPS hostname or IP address |
| `VPS_PORT` | SSH port, commonly `22` |
| `VPS_USER` | Dedicated deployment user |
| `VPS_SSH_PRIVATE_KEY` | Dedicated private key in OpenSSH format |
| `VPS_KNOWN_HOSTS` | Verified `known_hosts` entry for the VPS |

The automatically supplied `GITHUB_TOKEN` publishes the image. No write-capable personal token is needed by the workflow.

## 4. Configure the reverse proxy

Example Nginx virtual host fragment:

```nginx
server {
    listen 80;
    server_name deployguard.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name deployguard.example.com;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Use the VPS's existing certificate automation. Enable HSTS only after HTTPS works correctly for the domain and its subdomains. Do not expose container port 8080 publicly.

## 5. Deploy

Open a pull request, let CI pass, and merge to `main`. The deployment workflow then:

1. Checks out the exact commit verified by CI.
2. Builds and publishes SHA and `latest` image tags to GHCR.
3. Copies the production Compose manifest to the VPS.
4. Pulls and starts the image by its immutable registry digest, waiting for its health check.
5. Automatically restores the previous image and Compose manifest if the new container does not become healthy within 60 seconds.

Verify after deployment:

```bash
curl --fail https://deployguard.example.com/healthz
docker inspect --format '{{.State.Health.Status}}' deployguard
docker logs --tail 100 deployguard
```

## Rollback

Find the last known-good image digest in GitHub Actions or GHCR, then run:

```bash
cd ~/deployguard/releases/KNOWN_GOOD_COMMIT
DEPLOYGUARD_IMAGE=ghcr.io/OWNER/REPOSITORY@sha256:KNOWN_GOOD_DIGEST docker compose --project-name deployguard -f compose.yml pull
DEPLOYGUARD_IMAGE=ghcr.io/OWNER/REPOSITORY@sha256:KNOWN_GOOD_DIGEST docker compose --project-name deployguard -f compose.yml up -d --wait --wait-timeout 60
ln -sfn "$PWD" ~/deployguard/current
```

Verify `/healthz` and the application afterward. Because user data lives in browsers, container rollback has no database migration step.

## Operations

- Monitor external HTTPS availability and `/healthz`.
- Keep Docker and the host patched.
- Treat Docker access as root-equivalent. Prefer rootless Docker; otherwise restrict and rotate the dedicated deployment SSH key and protect the GitHub production environment with required reviewers.
- Review Dependabot updates weekly and merge only after CI passes.
- Periodically remove unused GHCR image tags according to the team's retention policy.
- Retain at least one known-good directory under `~/deployguard/releases`; remove older bundles only after their rollback window closes.
- Browser records are not backed up centrally; users should understand that clearing site data removes them.
