# AGENTS.md

Angular 22 single-page app that scans Ethereum smart-contract events via web3.js. Configuration (provider, contract, ABI, block range) lives in the URL query string; there is no backend.

## Commands
- `npm ci` – install; `npm start` – dev server on port 55226
- `npm test` – Jest (jest-preset-angular); `npm run lint` – ESLint
- `npm run build` – production build to `dist/ethereum-event-scan`
- Docker: build the app first, then `docker build .` (nginx-unprivileged, port 8080)

## Layout
- `src/app/services/reader.service.ts` – event reading, ABI decoding from URL (base64/hex, gzip/zlib via pako)
- `src/app/services/provider.service.ts` – web3 provider setup (http/ws only)
- `src/app/services/utils.service.ts` – URL param handling
- `src/app/components/` – settings, events-table (+ `highlight` pipe), modal dialogs
- `nginx.conf`, `secure_headers.conf` – runtime hardening (CSP etc.)

## Rules
- All data from the URL or the blockchain is untrusted. Never use `bypassSecurityTrust*` without escaping first; the `highlight` pipe HTML-escapes and must remain the only path to `innerHTML` for event data.
- Never build `RegExp` from user input without escaping.
- Keep limits on decoded/decompressed ABI input.
- Don't commit secrets, test output (`jest-*.json`) or IDE files.
- Add/adjust a Jest spec next to the source file (`*.spec.ts`) for every behavior change; all tests must pass.
- Keep `npm audit --omit=dev` clean; use `overrides` in `package.json` only when no upstream fix exists, and verify web3 still works.
- Style: 4-space indentation, single quotes (see `.editorconfig`).
