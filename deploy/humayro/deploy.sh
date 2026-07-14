#!/usr/bin/env bash

set -Eeuo pipefail

readonly compose_file="docker-compose.prod.yml"
readonly state_file=".deployed-image"

: "${HUMAYRO_IMAGE:?HUMAYRO_IMAGE is required}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed on the deployment host." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is not installed on the deployment host." >&2
  exit 1
fi

# Compose requires this file. It is intentionally host-managed and is never
# copied from CI, so server-only secrets survive deployments.
touch .env.production

previous_image=""
if [[ -f "$state_file" ]]; then
  previous_image="$(<"$state_file")"
fi

wait_until_healthy() {
  local container_id status
  container_id="$(docker compose -f "$compose_file" ps -q app)"

  if [[ -z "$container_id" ]]; then
    return 1
  fi

  for _ in {1..45}; do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")"

    if [[ "$status" == "healthy" ]]; then
      return 0
    fi

    if [[ "$status" == "unhealthy" || "$status" == "exited" || "$status" == "dead" ]]; then
      return 1
    fi

    sleep 2
  done

  return 1
}

deploy_image() {
  export HUMAYRO_IMAGE="$1"
  docker compose -f "$compose_file" pull app
  docker compose -f "$compose_file" up --detach --no-deps --force-recreate app
  wait_until_healthy
}

echo "Deploying $HUMAYRO_IMAGE"

if deploy_image "$HUMAYRO_IMAGE"; then
  printf '%s\n' "$HUMAYRO_IMAGE" >"$state_file"
  echo "Humayro is healthy."
  exit 0
fi

echo "The new container did not become healthy." >&2
docker compose -f "$compose_file" logs --tail=100 app >&2 || true

if [[ -n "$previous_image" && "$previous_image" != "$HUMAYRO_IMAGE" ]]; then
  echo "Rolling back to $previous_image" >&2

  if deploy_image "$previous_image"; then
    echo "Rollback completed." >&2
  else
    echo "Rollback failed; inspect the host immediately." >&2
  fi
fi

exit 1
