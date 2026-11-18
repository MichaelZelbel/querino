#!/usr/bin/env bash
# The factory's private test copy of Querino: harness/test-copy/README.md.
#
#   harness/test-copy.sh dev [port]     start the copy if needed, then the app against it (one call)
#   eval "$(harness/test-copy.sh up)"   start this checkout's copy, export what a lap needs
#   harness/test-copy.sh env            print the exports again
#   harness/test-copy.sh down           remove its containers, volumes, network and .env.local
#   harness/test-copy.sh status|list|prune
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
CLI="$HERE/test-copy/cli.mjs"
LOCK="$ROOT/harness/.results/test-copy.lock"
LOCK_WAIT="${QUERINO_TEST_COPY_LOCK_WAIT:-120}"

# One up or down at a time per checkout: a second one waits for the first,
# then gives up with a plain message, so neither deletes the other's folder
# or stack. The lock file sits beside the copy's folder, which down deletes.
with_lock() {
  mkdir -p "$(dirname "$LOCK")"
  if ! command -v flock >/dev/null 2>&1; then
    "$@"
    return
  fi
  (
    if ! flock -w "$LOCK_WAIT" 9; then
      echo "[test-copy] FAILED: another up or down of this checkout's test copy was still running after ${LOCK_WAIT}s. Run this again when it has finished; harness/test-copy.sh status says where it stands." >&2
      exit 75
    fi
    "$@"
  ) 9>"$LOCK"
}

case "${1:-}" in
  up | down)
    with_lock node "$CLI" "$@"
    ;;
  dev)
    port="${2:-}"
    if [ -z "$port" ]; then
      port="$(node -e 'const s=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})')"
    fi
    with_lock node "$CLI" up >/dev/null
    eval "$(node "$CLI" env)"
    echo "[test-copy] the app on http://127.0.0.1:$port talks to the test copy at $VITE_SUPABASE_URL" >&2
    cd "$ROOT"
    exec bun run dev --port "$port" --strictPort --host 127.0.0.1
    ;;
  *)
    exec node "$CLI" "$@"
    ;;
esac
