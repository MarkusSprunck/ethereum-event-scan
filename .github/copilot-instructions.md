# Copilot instructions

See [AGENTS.md](../AGENTS.md) for commands, layout and rules. Key points:

- Angular 21 + TypeScript, Jest tests co-located as `*.spec.ts`; run `npm test` and `npm run lint` before finishing.
- Treat URL parameters and blockchain data as untrusted: escape before `innerHTML`, escape user input before `RegExp`, cap decoded ABI size.
- Prefer small, focused changes; update README/AGENTS.md when behavior or commands change.
- Docker image runs unprivileged nginx on port 8080; keep CSP in `secure_headers.conf` strict.
