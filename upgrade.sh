#!/usr/bin/env bash
set -euo pipefail

# upgrade.sh — Upgrade dependencies and attempt an Angular major-version migration.
# Usage: ./upgrade.sh 2>&1 | tee upgrade-logs/upgrade.log
# Creates logs under upgrade-logs/ and will try to perform stepwise Angular upgrades
# (16 -> 17 -> 18 -> 19 -> 20 -> 21). It makes minimal tsconfig adjustments to ease
# the transition (allowSyntheticDefaultImports, skipLibCheck, moduleResolution=bundler).

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/upgrade-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/upgrade-$(date +%Y%m%d-%H%M%S).log"

echo "Starting upgrade at $(date)" | tee "$LOG_FILE"

echo "Checking environment" | tee -a "$LOG_FILE"
node -v 2>&1 | tee -a "$LOG_FILE" || { echo "node not found" | tee -a "$LOG_FILE"; exit 1; }
npm -v 2>&1 | tee -a "$LOG_FILE" || { echo "npm not found" | tee -a "$LOG_FILE"; exit 1; }

# 1) Upgrade package.json dependencies using npm-check-updates (ncu)
echo "Running npm-check-updates (ncu) to update package.json versions" | tee -a "$LOG_FILE"
npx --yes npm-check-updates -u 2>&1 | tee -a "$LOG_FILE" || true

# 2) Install updated packages
echo "Installing updated packages (npm install)" | tee -a "$LOG_FILE"
npm install 2>&1 | tee -a "$LOG_FILE" || true

# 3) Make safe TypeScript compiler relaxations to ease 3rd-party typings
# We edit tsconfig.json to set allowSyntheticDefaultImports and skipLibCheck and moduleResolution=bundler
TSCONFIG="$ROOT_DIR/tsconfig.json"
if [ -f "$TSCONFIG" ]; then
  echo "Patching $TSCONFIG" | tee -a "$LOG_FILE"
  node -e "const fs=require('fs'); const p=process.env.TSCONFIG || '$TSCONFIG'; const raw=fs.readFileSync(p,'utf8'); const stripComments=(t)=>t.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,''); const json=stripComments(raw); const cfg=JSON.parse(json); cfg.compilerOptions=cfg.compilerOptions||{}; cfg.compilerOptions.allowSyntheticDefaultImports=true; cfg.compilerOptions.skipLibCheck=true; cfg.compilerOptions.moduleResolution='bundler'; fs.writeFileSync(p, JSON.stringify(cfg,null,2)); console.log('patched',p);" 2>&1 | tee -a "$LOG_FILE"
else
  echo "$TSCONFIG not found, skipping tsconfig patch" | tee -a "$LOG_FILE"
fi

# 4) Stepwise Angular CLI/Core updates
# ng update prevents jumping major versions. We'll try sequentially from 17..21.
# If your workspace starts at an older major, adjust the sequence.

ANGULAR_TARGETS=(17 18 19 20 21)
for ver in "${ANGULAR_TARGETS[@]}"; do
  echo "Attempting: ng update @angular/cli@${ver} @angular/core@${ver} --allow-dirty --force --yes" | tee -a "$LOG_FILE"
  # run with --allow-dirty and --force as fallback; remove these flags if you want safer, interactive process
  npx --yes -p @angular/cli@${ver} ng update @angular/cli@${ver} @angular/core@${ver} --allow-dirty --force --yes 2>&1 | tee -a "$LOG_FILE" || echo "ng update to ${ver} failed or had migrations; see log" | tee -a "$LOG_FILE"
done

# 5) Install again to ensure lockfile coherence
echo "Installing packages after ng update" | tee -a "$LOG_FILE"
npm install 2>&1 | tee -a "$LOG_FILE"

# 6) Try a production build (AOT). If it fails, retry without AOT to obtain diagnostics.
BUILD_LOG="$LOG_DIR/ng-build-$(date +%Y%m%d-%H%M%S).log"
echo "Running production build (AOT)" | tee -a "$LOG_FILE"
if npx --yes ng build --configuration production --aot 2>&1 | tee "$BUILD_LOG"; then
  echo "Production build (AOT) succeeded" | tee -a "$LOG_FILE"
else
  echo "Production build (AOT) failed, retrying without AOT to gather errors" | tee -a "$LOG_FILE"
  npx --yes ng build --configuration production --no-aot 2>&1 | tee "$BUILD_LOG" || true
fi

echo "Upgrade finished. Main logs:" | tee -a "$LOG_FILE"
echo "  $LOG_FILE" | tee -a "$LOG_FILE"
echo "Build log:" | tee -a "$LOG_FILE"
echo "  $BUILD_LOG" | tee -a "$LOG_FILE"

echo "Tip: inspect $BUILD_LOG and $LOG_FILE. Fix any template/standalone/ng module mismatches as needed." | tee -a "$LOG_FILE"

exit 0

