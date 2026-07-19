# Wending production deployment

This deployment builds `apps/wending` as a Next.js standalone container, stores
immutable images in GitHub Container Registry, and updates a single Docker
Compose service on the VPS. Nginx terminates TLS and proxies only to
`127.0.0.1:3002`; the Next.js server is never exposed directly.

## 1. Prepare DNS and the VPS

Point the `A` record for `wedding24.uz` to the VPS. Point `www.wedding24.uz`
to the same host, either with another `A` record or a `CNAME` to the apex
domain. Allow inbound TCP 80 and 443 in both the provider firewall and the host
firewall.

Install Docker Engine with the Compose v2 plugin, Nginx, and Certbot. Copy this
directory to the VPS and run the one-time TLS bootstrap:

```bash
sudo bash bootstrap-vps.sh ops@example.com
```

Create the application directory. A clean default is `/opt/wending-front`:

```bash
mkdir -p /opt/wending-front
touch /opt/wending-front/.env.production
chmod 600 /opt/wending-front/.env.production
```

The committed `.env.production.example` documents host-managed runtime values.

## 2. Configure GitHub

Create these repository secrets:

- `WENDING_DEPLOY_HOST`: VPS hostname or IP.
- `WENDING_DEPLOY_USER`: SSH user for deployment.
- `WENDING_DEPLOY_SSH_KEY`: private key dedicated to CI deployment.
- `WENDING_DEPLOY_KNOWN_HOSTS`: verified SSH host-key line for the VPS.

Create these repository variables:

- `WENDING_DEPLOY_PORT=22`
- `WENDING_DEPLOY_PATH=/opt/wending-front`

## 3. Deploy

Pull requests run lint, TypeScript, and the production build. A push to `main`
publishes an image addressed by its digest. Successful `main` builds copy the
Compose manifest and deployment script to the VPS, wait for the new container
health check, and roll back to the previous image if needed.

Useful host commands:

```bash
cd /opt/wending-front
export WENDING_IMAGE="$(cat .deployed-image)"
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200 app
curl -I http://127.0.0.1:3002
curl -I https://wedding24.uz
```
