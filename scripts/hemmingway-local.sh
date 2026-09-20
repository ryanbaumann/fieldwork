#!/usr/bin/env bash
# Runner for local Hemmingway on Apple Silicon using uv and MLX
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

exec uv run --python 3.12 --with mlx-lm --with huggingface-hub python scripts/local_hemmingway.py "$@"
