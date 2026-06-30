#!/usr/bin/env bash
# Manual deploy: build and publish dist/ to the gh-pages branch.
# (Use this if you haven't enabled the GitHub Actions workflow — see README.)
set -euo pipefail
cd "$(dirname "$0")/.."
remote=$(git config --get remote.origin.url)
npm run build
tmp=$(mktemp -d)
cp -r dist/. "$tmp"/
touch "$tmp/.nojekyll"
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" -c user.name=deploy -c user.email=deploy@local commit -q -m "Deploy $(date -u +%FT%TZ)"
git -C "$tmp" push -f "$remote" gh-pages
rm -rf "$tmp"
echo "Deployed to gh-pages."
