#!/usr/bin/env bash
# Runner for local Hemmingway on Apple Silicon using uv and MLX
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

if ! command -v uv >/dev/null 2>&1; then
  echo "ERROR: 'uv' is required to run local MLX models on Apple Silicon. Install uv: https://docs.astral.sh/uv/" >&2
  exit 1
fi

exec uv run --python 3.12 --with mlx-lm --with huggingface-hub python scripts/local_hemmingway.py "$@"
