#!/usr/bin/env bash
set -euo pipefail
gh auth status --hostname github.com || gh auth login --hostname github.com --web
printf 'Enter the Cloudflare API token at the hidden GitHub CLI prompt below.\n'
gh secret set CLOUDFLARE_API_TOKEN --repo jameshollingworth/lighthouse --app actions
printf 'Enter the Cloudflare account ID at the hidden GitHub CLI prompt below.\n'
gh secret set CLOUDFLARE_ACCOUNT_ID --repo jameshollingworth/lighthouse --app actions
printf 'Both GitHub Actions secrets have been stored.\n'
