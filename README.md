# Ease

Next.js 14 + TypeScript + Tailwind + Supabase

## Develop
```bash
# Install dependencies
pnpm install

# Start dev server (webpack)
pnpm dev:webpack
# or with Turbopack (if you encounter issues, use webpack)
pnpm dev

# Server runs at http://localhost:3000
# Health check at http://localhost:3000/api/health
```

Env

Create .env.local:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # server-only (do not expose)
