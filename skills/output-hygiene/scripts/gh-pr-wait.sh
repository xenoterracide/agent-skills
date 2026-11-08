#!/usr/bin/env bash

# SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
#
# SPDX-License-Identifier: MIT

# Polls `gh pr checks` until every check is terminal, printing one line:
# pass, "fail: <names>", or "pending after Nm: <names>". Exits 0 pass,
# 1 fail or gh error, 2 still pending after --timeout, 64 usage. Every
# other argument is forwarded to `gh pr checks`.

set -u

usage() {
  echo "usage: gh-pr-wait.sh [--interval SECONDS] [--timeout SECONDS] [gh pr checks args...]" >&2
  exit 64
}

interval=10
timeout=600
args=()
while [ $# -gt 0 ]; do
  case $1 in
  --interval)
    [ $# -ge 2 ] || usage
    interval=$2
    shift 2
    ;;
  --timeout)
    [ $# -ge 2 ] || usage
    timeout=$2
    shift 2
    ;;
  *)
    args+=("$1")
    shift
    ;;
  esac
done

case $interval in '' | *[!0-9]*) usage ;; esac
case $timeout in '' | *[!0-9]*) usage ;; esac

err=$(mktemp "${TMPDIR:-/tmp}/gh-pr-wait.XXXXXXXX")
trap 'rm -f "$err"' EXIT

deadline=$(($(date +%s) + timeout))
query='(map(select(.bucket == "fail" or .bucket == "cancel") | .name) | join(",")) + "\t" + (map(select(.bucket == "pending") | .name) | join(",")) + "\t" + (length | tostring)'

while :; do
  line=$(gh pr checks ${args[@]+"${args[@]}"} --json name,bucket --jq "$query" 2>"$err")
  code=$?

  # In JSON mode gh exits 0 on any successful render, whatever the check
  # state, so the rendered line — not the exit code — carries the state.
  # A tab means gh spoke checks; anything else is a gh error.
  case $line in
  *$'\t'*) ;;
  *)
    cat "$err" >&2
    [ "$code" -ne 0 ] || code=1
    exit "$code"
    ;;
  esac

  fails=${line%%$'\t'*}
  rest=${line#*$'\t'}
  pending=${rest%%$'\t'*}
  count=${rest#*$'\t'}
  # an unparseable count is never a pass signal
  case $count in
  '' | *[!0-9]*) count=0 ;;
  esac

  if [ -n "$fails" ]; then
    echo "fail: ${fails//,/, }"
    exit 1
  fi
  # a runless head has no check rows yet — checks may not have queued, so
  # it polls like pending instead of passing on empty
  if [ -n "$pending" ] || [ "$count" -eq 0 ]; then
    if [ "$(date +%s)" -lt "$deadline" ]; then
      sleep "$interval"
      continue
    fi
    if [ -z "$pending" ]; then
      echo "pending after $((timeout / 60))m: no check runs yet"
    else
      echo "pending after $((timeout / 60))m: ${pending//,/, }"
    fi
    exit 2
  fi

  echo pass
  exit 0
done
