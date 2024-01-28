#!/bin/sh

REALPATH_BIN=$(which realpath)

if command -v grealpath >/dev/null 2>&1; then
  REALPATH_BIN=$(which grealpath)
  echo "Using GNU realpath"
fi

if ! command -v jotbot >/dev/null 2>&1; then
  echo "ERROR: jotbot not found. Run the following command to install it:"
  echo "  go install github.com/modernice/jotbot/cmd/jotbot@latest"
  exit 1
fi

ROOT=$(git rev-parse --show-toplevel)
ENV_FILE=$($REALPATH_BIN --relative-to="$PWD" "$ROOT/jotbot.env")

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: jotbot.env file not found. Run the following command to create it:"
  echo "  cp $ENV_FILE.example $ENV_FILE"
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

jotbot generate .
