# Humayro development and production deployment

Humayro has two isolated delivery paths. A push to `dev` builds the frontend
against the development API and deploys it to the development container. A push
to `main` builds against the production API and deploys only the production
container.

| Git branch | GitHub environment | Frontend | API | Host port |
| --- | --- | --- | --- | --- |
| `dev` | `development` | `https://dev.humayro.uz` | `https://dev-api.humayro.uz` | `127.0.0.1:3001` |
| `main` | `production` | `https://humayro.uz` | `https://swagger.humayro.uz` | `127.0.0.1:3000` |

Each environment has its own Docker Compose project, container name, runtime
environment file, deployment directory, and rollback state. A failed
development deployment therefore cannot replace or roll back production.

## 1. DNS, backend, and VPS

Point both `humayro.uz` and `dev.humayro.uz` to the frontend VPS. Keep the two
backend deployments isolated as well:

- development backend: `dev-api.humayro.uz`;
- production backend: `swagger.humayro.uz`.

The development backend must allow `https://dev.humayro.uz` in CORS and OAuth
redirect settings. Production must allow `https://humayro.uz`. Do not share a
database, object-storage prefix, OAuth callback, or backend runtime secret
between these environments.

Install Docker Engine with Compose v2, Nginx, and Certbot. Copy this directory
to each VPS once, then configure the matching Nginx host and TLS certificate:

```bash
sudo bash bootstrap-vps.sh development ops@example.com
sudo bash bootstrap-vps.sh production ops@example.com
```

Run only the matching command when development and production use different
servers. When they share one VPS, run both; the script installs separate Nginx
site files and does not overwrite the other environment.

Create separate writable deployment directories:

```bash
mkdir -p /opt/humayro-development-front /opt/humayro-production-front
touch /opt/humayro-development-front/.env.development
touch /opt/humayro-production-front/.env.production
chmod 600 /opt/humayro-development-front/.env.development
chmod 600 /opt/humayro-production-front/.env.production
```

These files are host-managed and CI never overwrites them. `NEXT_PUBLIC_*`
values do not belong in them because Next.js embeds public values while the
container image is built.

## 2. GitHub configuration

Create two GitHub Environments named `development` and `production`. Put the
following secrets in each environment, using that environment's server values:

- `HUMAYRO_DEPLOY_HOST`
- `HUMAYRO_DEPLOY_USER`
- `HUMAYRO_DEPLOY_SSH_KEY`
- `HUMAYRO_DEPLOY_KNOWN_HOSTS`

Put these variables in the `development` environment:

- `HUMAYRO_DEPLOY_PATH=/opt/humayro-development-front`
- `HUMAYRO_APP_PORT=3001`
- `HUMAYRO_CONTAINER_NAME=humayro-development-front`
- `HUMAYRO_COMPOSE_PROJECT=humayro-development`
- `HUMAYRO_ENVIRONMENT_FILE=.env.development`
- `HUMAYRO_DEPLOY_PORT=22` (optional)

Put the corresponding variables in `production`:

- `HUMAYRO_DEPLOY_PATH=/opt/humayro-production-front`
- `HUMAYRO_APP_PORT=3000`
- `HUMAYRO_CONTAINER_NAME=humayro-production-front`
- `HUMAYRO_COMPOSE_PROJECT=humayro-production`
- `HUMAYRO_ENVIRONMENT_FILE=.env.production`
- `HUMAYRO_DEPLOY_PORT=22` (optional)

The workflow already has safe URL defaults. If they need to change, add these
as repository variables because the target-resolution job intentionally runs
before a deployment environment is selected:

- `HUMAYRO_DEV_API_URL`
- `HUMAYRO_DEV_SITE_URL`
- `HUMAYRO_PRODUCTION_API_URL`
- `HUMAYRO_PRODUCTION_SITE_URL`

Keep `HUMAYRO_YANDEX_MAPS_API_KEY` as a repository secret and allow both
frontend origins in Yandex. Restrict the GitHub `production` environment to the
`main` branch and require approval if desired. Restrict `development` to `dev`.

Obtain `HUMAYRO_DEPLOY_KNOWN_HOSTS` from a trusted network or the provider
console and verify its fingerprint. Never collect and trust the host key during
the workflow itself.

## 3. CI/CD behavior

Pull requests targeting `dev` build with development URLs. Pull requests
targeting `main` build with production URLs. Pushes to either branch run lint,
TypeScript, and a target-specific build, publish an immutable GHCR image, then
deploy only the matching environment. Each environment keeps an independent
previous-image pointer for automatic rollback.

The workflow can also be run manually. Select `dev` or `main` in the GitHub
Actions branch selector; any other branch is rejected.

## 4. Local scripts and Husky

Local Humayro development uses the development API by default:

```bash
pnpm dev:humayro
pnpm --filter humayro generate:api:development
pnpm --filter humayro build:development
```

Production contract generation and builds are explicit:

```bash
pnpm --filter humayro generate:api:production
pnpm --filter humayro build:production
```

Husky inspects the remote ref during `git push`. Pushing `dev` runs
`check:humayro:dev`; pushing `main` runs `check:humayro:main`. Other branch
pushes are not blocked by Humayro's deployment checks.

## 5. Host operations

Useful development commands:

```bash
cd /opt/humayro-development-front
HUMAYRO_IMAGE="$(cat .deployed-image.development)" \
HUMAYRO_DEPLOYMENT=development bash deploy.sh
docker compose --project-name humayro-development -f docker-compose.yml ps
curl -I http://127.0.0.1:3001
```

Production uses `HUMAYRO_DEPLOYMENT=production`, project
`humayro-production`, state file `.deployed-image.production`, and port 3000.

The OAuth redirect URIs must be registered exactly as:

```text
https://dev.humayro.uz/api/auth/google/callback
https://humayro.uz/api/auth/google/callback
```
