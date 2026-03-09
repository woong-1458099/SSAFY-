#!/bin/bash
set -euo pipefail

echo "=== EC2 SSH connect ==="
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

echo
echo "Using key: $KEYPATH"
echo

chmod 600 "$KEYPATH"

echo "Connecting to ubuntu@j14e206.p.ssafy.io ..."
echo
ssh -i "$KEYPATH" ubuntu@j14e206.p.ssafy.io

echo
echo "SSH exited."
