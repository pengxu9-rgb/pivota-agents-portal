#!/bin/bash
# Checks, in headless Chrome against the BUILT CSS, that a button-styled legacy link inside the v2
# shell keeps its own text color (Docs "Manage API keys": text-white on the accent background).
# Tailwind v4 puts utilities in @layer utilities, and any UNLAYERED rule beats every layer, so the
# v2 default link color must live in @layer base. A control element styled by an unlayered rule
# must still turn accent, proving the page reproduces the original bug.
#
# Usage: NEXT_PUBLIC_FEATURE_PORTAL_V2=true npx next build && scripts/verify-v2-link-colors.sh
# Needs Google Chrome installed locally. Reads only local files.
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/.." && pwd)
CHROME=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
shopt -s nullglob
css=("$ROOT"/.next/static/css/*.css)
[ ${#css[@]} -gt 0 ] || { echo "no built CSS: run next build with NEXT_PUBLIC_FEATURE_PORTAL_V2=true first"; exit 2; }
grep -q 'pv2' "${css[@]}" || { echo "built CSS has no v2 rules: build with NEXT_PUBLIC_FEATURE_PORTAL_V2=true"; exit 2; }

TMP=$(mktemp -d)
trap 'rm -rf -- "$TMP"' EXIT
{
  echo '<!doctype html><html><head><meta charset="utf-8">'
  for f in "${css[@]}"; do echo "<link rel=\"stylesheet\" href=\"file://$f\">"; done
  echo '<style>.pv2 .ctl a { color: var(--accent); }</style></head><body><div class="pv2"><main>'
  echo '<a id="docs" href="#" class="inline-flex rounded-xl bg-[var(--portal-accent)] px-4 py-2.5 text-sm font-medium text-white">Manage API keys</a>'
  echo '<a id="plain" href="#">plain</a><a id="pri" href="#" class="pv2-btn pv2-btn-pri">primary</a>'
  echo '<div class="ctl"><a id="ctl" href="#" class="text-white">control</a></div></main></div><pre id="out"></pre>'
  echo '<script>const s=(id)=>getComputedStyle(document.getElementById(id));'
  echo 'document.getElementById("out").textContent=[s("docs").color,s("docs").backgroundColor,s("plain").color,s("pri").color,s("ctl").color].join("|");</script></body></html>'
} > "$TMP/check.html"

out=$("$CHROME" --headless=new --disable-gpu --no-first-run --allow-file-access-from-files \
  --user-data-dir="$TMP/profile" --dump-dom "file://$TMP/check.html" 2>/dev/null \
  | sed -n 's/.*<pre id="out">\([^<]*\)<\/pre>.*/\1/p')
IFS='|' read -r docs docs_bg plain pri ctl <<< "$out"
white='rgb(255, 255, 255)'
fail=0
[ "$docs" = "$white" ] || { echo "FAIL: Docs button text is $docs on $docs_bg (want white)"; fail=1; }
[ "$docs_bg" != "$white" ] || { echo "FAIL: Docs button lost its accent background"; fail=1; }
[ "$plain" = "$docs_bg" ] || { echo "FAIL: a plain v2 link is $plain (want the accent, $docs_bg)"; fail=1; }
[ "$pri" = "$white" ] || { echo "FAIL: v2 primary button text is $pri (want white)"; fail=1; }
[ "$ctl" = "$docs_bg" ] || { echo "FAIL: control did not reproduce the bug ($ctl): the check can't tell"; fail=1; }
[ $fail -eq 0 ] && echo "ok: Docs button $docs on $docs_bg; plain link $plain; primary $pri; control $ctl"
exit $fail
