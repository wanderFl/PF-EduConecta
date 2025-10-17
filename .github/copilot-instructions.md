<!--
Purpose: Quick, actionable instructions for AI coding agents working on PF-EduConecta.
Keep this short (20–50 lines). Reference concrete files and commands so an agent can be productive immediately.
-->

# PF-EduConecta — Copilot instructions

- Repo layout (big picture)
  - frontend/: Vite + React + TypeScript UI. Entry: `frontend/src/main.tsx`, main component `frontend/src/App.tsx`.
  - backend/: TypeScript Express API and realtime. Scripts in `backend/package.json` expect an entry at `backend/src/index.ts` (dev uses `ts-node-dev`).
  - backend/prisma/: Prisma schema. Generator writes client to `backend/generated/prisma`. The datasource uses env var `DATABASE_URL`.
  - aia-service/: placeholder Python service (empty `requirements.txt`) — treat as independent microservice for AI/ML work.
  - docker-compose.yml exists but is currently empty; do not assume containers are wired.

- Key commands (run these from repo root or subfolders as indicated)
  - Frontend (in `frontend/`):
    - dev: `npm run dev` — starts Vite HMR (file: `frontend/package.json`).
    - build: `npm run build` — runs `tsc -b` then `vite build`.
    - preview: `npm run preview` — preview the production build.
  - Backend (in `backend/`):
    - dev: `npm run dev` — `ts-node-dev --respawn --transpile-only src/index.ts` (hot-reload TypeScript).
    - build: `npm run build` — `tsc` (transpile to `dist/`).
    - prisma: `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:studio` (see `backend/package.json`).

- Integration points & patterns to watch for
  - HTTP API: frontend uses `axios` (dependency in `frontend/package.json`) to call backend endpoints. Search `frontend/src` to locate specific requests.
  - Realtime: backend depends on `socket.io` (see `backend/package.json`) — look for socket wiring in backend entrypoint and for corresponding client usage in frontend assets.
  - DB: Prisma is the single source of truth. The schema is in `backend/prisma/schema.prisma`; the generated client is at `backend/generated/prisma` (imports should reference that path).

- Project-specific conventions
  - TypeScript-first: both front and back use TypeScript. Backend scripts assume `src/index.ts` as run target; frontend assumes Vite + TSX entries.
  - Prisma client generation: generator output customized to `../generated/prisma` — regenerate after schema changes.
  - Minimal / missing infra: docker-compose is present but empty, and `aia-service/requirements.txt` is empty — do not assume ready infra or CI configuration.

- Quick examples an agent can apply
  - To add a backend endpoint, modify `backend/src/index.ts` (or create it if missing), wire Express routes there, and ensure the build script (`npm run build`) emits `dist/index.js`.
  - To call an API from the frontend, add an axios call in `frontend/src/*` and prefer keeping request logic in a small `services/` module (not present by default).
  - When changing the DB schema, update `backend/prisma/schema.prisma` and run `cd backend && npm run prisma:generate && npm run prisma:migrate`.

- Notes about AI-agent configuration (non-executable)
  - I cannot programmatically "enable Claude Sonnet 3.5 for all clients" from inside this repo. If you want agents to prefer that model, add a top-line instruction in your agent management UI or org policy.
  - Suggested wording for operator consoles: "Prefer Claude Sonnet 3.5 for code edits and pull request generation for PF-EduConecta — fall back to other models only if unavailable." Copy this into your agent settings.

- Where to look first (priority files)
  - `frontend/package.json` — scripts and deps
  - `frontend/src/main.tsx`, `frontend/src/App.tsx` — UI entry and example components
  - `backend/package.json` — dev/build/prisma scripts
  - `backend/prisma/schema.prisma` — DB schema and generator target

If anything in this doc looks incorrect or out of date, mention the file(s) to update and provide the intended commands/paths. Ask for missing infra details (CI, env secrets, DB host) before changing deployment code.
