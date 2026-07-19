#!/usr/bin/env bash

set -Eeuo pipefail

readonly domain="wedding24.uz"
readonly script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly letsencrypt_dir="/etc/letsencrypt/live/$domain"

email="${1:-}"

if [[ "$EUID" -ne 0 ]]; then
  echo "Run this one-time bootstrap as root (or with sudo)." >&2
  exit 1
fi

if [[ -z "$email" ]]; then
  echo "Usage: sudo bash bootstrap-vps.sh <letsencrypt-email>" >&2
  exit 1
fi

for command_name in nginx certbot; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "$command_name is required. Install it before running this script." >&2
    exit 1
  fi
done

install -d -m 0755 /var/www/certbot /etc/nginx/sites-available /etc/nginx/sites-enabled
install -m 0644 "$script_dir/nginx-http.conf" /etc/nginx/sites-available/wedding24.uz.conf
ln -sfn /etc/nginx/sites-available/wedding24.uz.conf /etc/nginx/sites-enabled/wedding24.uz.conf

nginx -t
systemctl enable --now nginx
systemctl reload nginx

if [[ ! -f "$letsencrypt_dir/fullchain.pem" ]]; then
  certbot certonly \
    --webroot \
    --webroot-path /var/www/certbot \
    --domain "$domain" \
    --domain "www.$domain" \
    --email "$email" \
    --agree-tos \
    --no-eff-email \
    --non-interactive
fi

install -m 0644 "$script_dir/nginx.conf" /etc/nginx/sites-available/wedding24.uz.conf
nginx -t
systemctl reload nginx

echo "Nginx and TLS are configured for https://$domain."
