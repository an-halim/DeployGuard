#!/bin/sh

set -eu

release_image=${1:?Usage: deploy.sh <image-reference>}
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir"

deployment_root=$(dirname -- "$(dirname -- "$script_dir")")
current_link="$deployment_root/current"
previous_dir=''
if [ -L "$current_link" ]; then
  previous_dir=$(readlink "$current_link")
fi

DEPLOYGUARD_IMAGE="$release_image" docker compose -f compose.yml pull

if DEPLOYGUARD_IMAGE="$release_image" docker compose --project-name deployguard -f compose.yml up \
  -d --remove-orphans --wait --wait-timeout 60; then
  printf '%s\n' "$release_image" > image-ref
  ln -sfn "$script_dir" "$current_link"
  docker image prune -f
  exit 0
fi

echo "Deployment health check failed." >&2

if [ -n "$previous_dir" ] && [ -f "$previous_dir/compose.yml" ] && [ -f "$previous_dir/image-ref" ]; then
  previous_image=$(cat "$previous_dir/image-ref")
  echo "Rolling back release bundle to $previous_image" >&2
  DEPLOYGUARD_IMAGE="$previous_image" docker compose --project-name deployguard \
    -f "$previous_dir/compose.yml" up -d --remove-orphans --wait --wait-timeout 60
fi

exit 1
