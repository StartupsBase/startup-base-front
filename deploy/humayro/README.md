# Humayro production deployment

This deployment builds `apps/humayro` as a Next.js standalone container, stores
immutable images in GitHub Container Registry, and updates a single Docker
Compose service on the VPS. Nginx terminates TLS and proxies only to
`127.0.0.1:3000`; the Next.js server is never exposed directly.

The production topology keeps frontend and backend separated on the same VPS:

- `humayro.uz` and `www.humayro.uz` proxy only to the frontend container on
  `127.0.0.1:3000`.
- `swagger.humayro.uz` continues to proxy only to the backend service on
  `127.0.0.1:8080`.
- The frontend talks to the backend through
  `NEXT_PUBLIC_API_URL=https://swagger.humayro.uz`.

## 1. Prepare DNS and the VPS

The `A` record for `humayro.uz` must point to the VPS. Allow inbound TCP 80 and
443 in both the provider firewall and the host firewall. SSH must be reachable
from GitHub-hosted runners, or the workflow must use a self-hosted runner.

Install Docker Engine with the Compose v2 plugin, Nginx, and Certbot. Add the
deployment user to the `docker` group, then sign in again so the group change is
applied. Copy this directory to the VPS and run the one-time TLS bootstrap:

```bash
sudo bash bootstrap-vps.sh ops@example.com
```

Create the application directory as the deployment user. Any absolute path is
valid as long as the SSH user can write to it. If the server keeps frontend and
backend assets under `/opt`, use `/opt/humayro-front` and set
`HUMAYRO_DEPLOY_PATH` to the same value in GitHub:

```bash
mkdir -p /opt/humayro-front
touch /opt/humayro-front/.env.production
chmod 600 /opt/humayro-front/.env.production
```

The committed `.env.production.example` documents server-only variables. Public
`NEXT_PUBLIC_*` values do not belong in this host file because Next.js embeds
them in the browser bundle while building the image.

## 2. Configure GitHub

Create a `production` GitHub Environment. Add these environment secrets:

- `HUMAYRO_DEPLOY_HOST`: VPS hostname or IP.
- `HUMAYRO_DEPLOY_USER`: unprivileged SSH user with Docker access.
- `HUMAYRO_DEPLOY_SSH_KEY`: private key dedicated to CI deployment.
- `HUMAYRO_DEPLOY_KNOWN_HOSTS`: verified SSH host-key line for the VPS.

Add this repository secret so the image-build job can read it:

- `HUMAYRO_YANDEX_MAPS_API_KEY`: browser API key restricted to
  `https://humayro.uz/*` at Yandex.

Add these repository variables:

- `HUMAYRO_API_URL=https://swagger.humayro.uz`
- `HUMAYRO_DEPLOY_PORT=22` (optional)
- `HUMAYRO_DEPLOY_PATH=/opt/humayro-front`

Obtain `HUMAYRO_DEPLOY_KNOWN_HOSTS` from a trusted network or the VPS provider's
console and compare its fingerprint before saving it. Do not blindly trust a
host key collected during CI.

## 3. Deploy

Pull requests run lint, TypeScript, and the production build. A push to `main`
publishes an image addressed by its digest. Successful `main` builds copy the
Compose manifest, deployment script, and current Nginx configs to the VPS, wait
for the new container health check, and roll back to the previous image if
needed.

When the OAuth callback opens as raw JSON, the VPS is still using an older
Nginx config that sends `/api/auth/google/callback` to the backend. Install the
current config once and reload Nginx:

```bash
sudo install -m 0644 /opt/humayro-front/nginx.conf /etc/nginx/sites-available/humayro.conf
sudo nginx -t
sudo systemctl reload nginx
```

The Google OAuth client and the backend must both use this exact redirect URI:

```text
https://humayro.uz/api/auth/google/callback
```

Add it under **Authorized redirect URIs** in Google Cloud Console. Even a
different protocol, subdomain, path, or trailing slash causes
`redirect_uri_mismatch`.

The workflow can also be started manually from **Actions > Humayro CI/CD**.

Useful host commands:

```bash
cd /opt/humayro-front
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 app
curl -I http://127.0.0.1:3000
```
