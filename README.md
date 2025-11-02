# Ease

Next.js 16 + TypeScript + TailwindCSS + Supabase

## Develop

```bash
# Install dependencies
pnpm install

# Start dev server (webpack)
pnpm dev

# Or try Turbopack (experimental)
pnpm dev:turbo

# App runs at http://localhost:3000
```

## Environment

Create `.env.local` and fill in the required credentials:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# server-only (never expose client-side)
SUPABASE_SERVICE_ROLE_KEY=

# Optional: development helper to bypass auth guard
BYPASS_AUTH=false

## Windows build notes

On some Windows setups, Next.js 16 Turbopack may mis-infer the workspace root (path casing differences), causing `pnpm build` to fail with an error suggesting to set `turbopack.root` even when it's configured. This looks like a Turbopack/path-casing issue on Windows.

Recommended options:

- Develop locally with `pnpm dev` (webpack) and run production builds on CI (Linux) or WSL2.
- Keep an eye on Next.js/Turbopack updates; once fixed upstream, `pnpm build` on Windows should work normally.

We already set `turbopack.root` in `next.config.ts`/`.cjs`.
```

### Windows tips (ports/locks, builds)

- If Next dev complains about a lock or switches to port 3001, clear the lock and stop the old process:

```powershell
ForEach ($p in (Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique)) { try { Stop-Process -Id $p -Force -ErrorAction Stop; Write-Output ("Stopped PID {0}" -f $p) } catch { Write-Output ("Failed to stop PID {0}: {1}" -f $p, $_.Exception.Message) } }
Remove-Item -Path "C:\\Users\\vojta\\projects\\.next\\dev" -Recurse -Force -ErrorAction SilentlyContinue
pnpm dev
```

- DevTools overlay is disabled by default to avoid React hook interop issues in Next 16; enable it by removing `NEXT_DISABLE_DEVTOOLS=1` from the dev script in `package.json` if needed.

- Production build on Windows: Turbopack can fail due to path casing. Build in WSL/macOS/CI or use Docker locally:

```powershell
docker build -t ease-app .
docker run --rm -p 3000:3000 ease-app
```

This uses Webpack-compatible flags in the container to produce a stable build.

- Quick clean if you see "modules that only differ in casing" warnings:

```powershell
pnpm run clean
pnpm dev
```

## Scripts

- Dev: `pnpm dev`
- Build: `pnpm build`
- Start: `pnpm start`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`

## CI and PRs

- CI runs on push/PR: typecheck, lint, build, and tests. See `.github/workflows/ci.yml`.
- Pull requests use a simple template at `.github/pull_request_template.md` to keep reviews focused.

### Branch protection (enable in GitHub UI)

1. Settings → Branches → Add rule
2. Branch name pattern: `main` (and/or `develop`)
3. Require status checks to pass before merging → select the “CI / build-and-check” job
4. Optional: Require PRs before merging; Require linear history
5. Save

## Troubleshooting (Windows)

- If the dev terminal shows many warnings about modules that only differ in casing, ensure you open the workspace with consistent path casing (e.g. `C:\Users\vojta\Projects`). Then run `pnpm run clean` and restart `pnpm dev` to clear cached absolute paths.
- If the editor shows TypeScript errors like “Cannot find module 'next'/'react'”, make sure VS Code uses the workspace TypeScript:
  1. Press Ctrl+Shift+P → “TypeScript: Select TypeScript Version” → “Use Workspace Version”.
  2. Press Ctrl+Shift+P → “TypeScript: Restart TS server”.
  3. Re-open a file to re-trigger diagnostics.

## Supabase

Use the provided utilities:

```ts
// Browser
import { supabaseClient } from "@/lib/supabaseClient";
// Server (RSC/server actions)
import { supabaseServer } from "@/lib/supabaseServer";
```

## LiveKit (in-app meetings)

### Recommended: LiveKit Cloud

For development and production, use **LiveKit Cloud** for full functionality including recording, egress, and storage:

1. Sign up at [cloud.livekit.io](https://cloud.livekit.io) (free tier available)
2. Create a new project
3. Copy your WebSocket URL and API keys
4. Add to `.env.local`:

```
LIVEKIT_WS_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Fallback: Local dev server (no recording)

If you need offline development **without recording capabilities**, run a local LiveKit server with Docker:

```powershell
# from project root
docker compose up -d
```

Add to `.env.local`:

```
LIVEKIT_WS_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
```

**Note:** Local server supports video/audio only. Recording, egress, and storage require LiveKit Cloud or production self-hosted infrastructure (Kubernetes cluster with encoding pipeline).

# Bundle analyzer

- Spusť s `ANALYZE=true pnpm build` pro vizualizaci velikosti bundlu.
- Pokud narazíš na problém s instalací @next/bundle-analyzer, zkontroluj verzi pnpm a případně použij npm/yarn.
