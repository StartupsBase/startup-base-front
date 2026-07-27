#!/usr/bin/env bash

set -Eeuo pipefail

readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

environment="${1:-}"
email="${2:-}"

case "$environment" in
  development)
    readonly domain="dev.humayro.uz"
    ;;
  production)
    readonly domain="humayro.uz"
    ;;
  *)
    echo "Usage: sudo bash bootstrap-vps.sh <development|production> <letsencrypt-email>" >&2
    exit 1
    ;;
esac

readonly site_file="humayro-$environment.conf"
readonly http_config="$script_dir/nginx-$environment-http.conf"
readonly tls_config="$script_dir/nginx-$environment.conf"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run this one-time bootstrap as root (or with sudo)." >&2
  exit 1
fi

if [[ -z "$email" ]]; then
  echo "Usage: sudo bash bootstrap-vps.sh <development|production> <letsencrypt-email>" >&2
  exit 1
fi

for command_name in nginx certbot; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required. Install it before running this script." >&2
    exit 1
  fi
done

install -d -m 0755 /var/www/certbot /etc/nginx/sites-available /etc/nginx/sites-enabled
install -m 0644 "$http_config" "/etc/nginx/sites-available/$site_file"
ln -sfn "/etc/nginx/sites-available/$site_file" "/etc/nginx/sites-enabled/$site_file"

nginx -t
systemctl enable --now nginx
systemctl reload nginx

if [[ ! -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]]; then
  certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --domain "$domain" \
    --email "$email" \
    --agree-tos \
    --no-eff-email \
    --non-interactive
fi

install -m 0644 "$tls_config" "/etc/nginx/sites-available/$site_file"
nginx -t
systemctl reload nginx

echo "Nginx and TLS are configured for $environment at https://$domain."
