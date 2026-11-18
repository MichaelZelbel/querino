#!/usr/bin/env bash
# The factory's private test copy of Querino: harness/test-copy/README.md.
#
#   eval "$(harness/test-copy.sh up)"   start this checkout's copy, export what a lap needs
#   harness/test-copy.sh env            print the exports again
#   harness/test-copy.sh down           remove its containers, volumes and network
#   harness/test-copy.sh status|list|prune
set -euo pipefail
exec node "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/test-copy/cli.mjs" "$@"
