#!/bin/bash
set -euo pipefail

echo "=== EC2 SSH tunnel ==="
echo

while true; do
  read -r -p "Enter PEM key file path: " KEYPATH
  KEYPATH="${KEYPATH%\"}"
  KEYPATH="${KEYPATH#\"}"

  if [ -f "$KEYPATH" ]; then
    break
  fi

  echo "ERROR: Key file not found: $KEYPATH"
done

chmod 600 "$KEYPATH"

echo
echo "Using key: $KEYPATH"
echo "Starting tunnel for PostgreSQL, Redis, RabbitMQ..."
echo

ssh -i "$KEYPATH" -N \
  -L 15432:127.0.0.1:5432 \
  -L 16379:127.0.0.1:6379 \
  -L 15673:127.0.0.1:5672 \
  ubuntu@j14e206.p.ssafy.io
