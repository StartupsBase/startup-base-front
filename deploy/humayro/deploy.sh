#!/usr/bin/env bash

set -Eeuo pipefail

readonly compose_file="docker-compose.yml"

: "${HUMAYRO_IMAGE:?HUMAYRO_IMAGE is required}"
: "${HUMAYRO_DEPLOYMENT:?HUMAYRO_DEPLOYMENT must be development or production}"

case "$HUMAYRO_DEPLOYMENT" in
  development)
    : "${HUMAYRO_PORT:=3003}"
    : "${HUMAYRO_CONTAINER_NAME:=humayro-development-front}"
    : "${HUMAYRO_COMPOSE_PROJECT:=humayro-development}"
    : "${HUMAYRO_ENV_FILE:=.env.development}"
    ;;
  production)
    : "${HUMAYRO_PORT:=3000}"
    : "${HUMAYRO_CONTAINER_NAME:=humayro-production-front}"
    : "${HUMAYRO_COMPOSE_PROJECT:=humayro-production}"
    : "${HUMAYRO_ENV_FILE:=.env.production}"
    ;;
  *)
    echo "Unsupported HUMAYRO_DEPLOYMENT: $HUMAYRO_DEPLOYMENT" >&2
    exit 1
    ;;
esac

readonly state_file=".deployed-image.$HUMAYRO_DEPLOYMENT"
readonly -a compose=(
  docker compose
  --project-name "$HUMAYRO_COMPOSE_PROJECT"
  -f "$compose_file"
)

export HUMAYRO_CONTAINER_NAME HUMAYRO_ENV_FILE HUMAYRO_PORT

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed on the deployment host." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is not installed on the deployment host." >&2
  exit 1
fi

# Compose requires an environment-specific file. It is host-managed and is
# never copied from CI, so server-only secrets survive deployments.
touch "$HUMAYRO_ENV_FILE"

previous_image=""
if [[ -f "$state_file" ]]; then
  previous_image="$(<"$state_file")"
fi

wait_until_healthy() {
  local container_id status
  container_id="$("${compose[@]}" ps -q app)"

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
  "${compose[@]}" pull app
  "${compose[@]}" up --detach --no-deps --force-recreate app
  wait_until_healthy
}

echo "Deploying $HUMAYRO_IMAGE"

if deploy_image "$HUMAYRO_IMAGE"; then
  printf '%s\n' "$HUMAYRO_IMAGE" >"$state_file"
  echo "Humayro $HUMAYRO_DEPLOYMENT is healthy on 127.0.0.1:$HUMAYRO_PORT."
  exit 0
fi

echo "The new container did not become healthy." >&2
"${compose[@]}" logs --tail=100 app >&2 || true

if [[ -n "$previous_image" && "$previous_image" != "$HUMAYRO_IMAGE" ]]; then
  echo "Rolling back to $previous_image" >&2

  if deploy_image "$previous_image"; then
    echo "Rollback completed." >&2
  else
    echo "Rollback failed; inspect the host immediately." >&2
  fi
fi

exit 1
