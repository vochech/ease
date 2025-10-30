# AI Agent Instructions (Copilot/ChatGPT for VS Code)

## 0) Mission
You are the coding assistant for the **Ease** workspace. Your job is to:
- generate clean, minimal, production-oriented code,
- keep structure consistent and documented,
- propose sensible defaults and create missing files,
- write short, precise commits and PR bodies.

Prefer **TypeScript**, **Next.js 14 (app router)**, **TailwindCSS**, **Supabase**.
Use **pnpm** as the package manager.

---

## 1) Tech Stack & Conventions
- **Runtime:** Node LTS
- **Framework:** Next.js 14 (app/ folder, RSC by default, server actions if suitable)
- **Lang:** TypeScript strict (no `any`, use `unknown` + narrow)
- **UI:** TailwindCSS; components in `components/`, keep them composable
- **DB:** Supabase (Postgres). Client:
  - `lib/supabaseClient.ts` for browser
  - `lib/supabaseServer.ts` for server (auth context)
- **Requests:** fetch/Next server actions; no axios unless asked
- **State:** server-first; use client state sparingly (Zustand if needed)
- **Env:** `.env.local` only; never commit secrets

**Directory layout (baseline)**
app/
layout.tsx
page.tsx
components/
lib/
styles/
types/
public/

---

## 2) Code Style
- Use named exports when possible.
- Co-locate types: `types/` for shared, local `type.ts` per feature.
- File names: `kebab-case.tsx` for components, no index barrels unless asked.
- Tailwind: utility-first; extract frequently reused chunks into small components.
- Accessibility: semantic tags, labelled inputs, keyboard nav.

ESLint/Prettier:
- Keep default Next.js ESLint base, `prettier` for formatting.
- Fix all warnings introduced by your changes.

---

## 3) Git & Commits
**Conventional Commits**; keep messages concise:
- `feat: add projects list page`
- `fix: handle null session in supabaseServer`
- `chore: configure tailwind and globals`
- `refactor: split ProjectCard`

If you touch multiple concerns, split into multiple commits.

---

## 4) Tasks You Are Allowed To Do
- Create/modify files across the workspace.
- Add minimal dependencies (pnpm) with justification in the PR body.
- Create scaffolding for new features (routing, types, components).
- Add basic tests when applicable (playwright/vitest if present).
- Propose TODOs in code with `// TODO(agent): …` only when unavoidable.

---

## 5) Tasks You Must Avoid
- Do NOT commit secrets or `.env*`.
- Do NOT change package manager (must stay **pnpm**).
- Do NOT introduce heavy UI kits without approval.
- Do NOT ship dead code or commented leftovers.

---

## 6) Supabase
- Client files:
  - `lib/supabaseClient.ts`
  - `lib/supabaseServer.ts`
- Read environment from:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (server) `SUPABASE_SERVICE_ROLE_KEY` (never used client-side)
- Add basic error handling and return typed results.

---

## 7) DX Utilities To Add (if missing)
- `.gitignore` (node, next, env)
- `.editorconfig`
- `README.md` with run instructions
- `tailwind.config.ts`, `postcss.config.js`, `styles/globals.css`

---

## 8) Default Scaffolds

### Page scaffold
```tsx
// app/(group)/example/page.tsx
export default function Page() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Example</h1>
      <p className="text-sm text-gray-500">
        Replace this with real content. Keep server-first; make client components only when necessary.
      </p>
    </main>
  );
}
// app/layout.tsx
import type { Metadata } from "next";
import "./styles/globals.css";

export const metadata: Metadata = {
  title: "Ease",
  description: "Ease – Project management workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-dvh bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
Simple UI component
// components/dashboard-card.tsx
import { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
};

export function DashboardCard({ title, description, action, children }: DashboardCardProps) {
  return (
    <section className="rounded-xl border border-gray-200 p-4 shadow-sm">
      <header className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

Supabase client (browser)
// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars missing. Check NEXT_PUBLIC_SUPABASE_URL/ANON_KEY.");
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

Supabase server utility (RSC/server)
// lib/supabaseServer.ts
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

Minimal API route (Next.js app router)
// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}

Tailwind setup
// tailwind.config.ts
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "rgba(17, 24, 39, 1)" }, // adjust later
      },
    },
  },
  plugins: [],
};
export default config;

// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --radius: 12px;
}

html, body { height: 100%; }

.gitignore
# Node / Next
node_modules
.next
out
dist

# Env
.env*
!.env.example

# OS / Editor
.DS_Store
.vscode/*
!.vscode/extensions.json

.editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

README seed
# Ease

Next.js 14 + TypeScript + Tailwind + Supabase

## Develop
```bash
pnpm install
pnpm dev
# http://localhost:3000

Env

Create .env.local:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # server-only (do not expose)


---

## 9) First run script (agent may execute)
```sh
# Run after repo creation
pnpm dlx create-next-app@latest . --ts --eslint --tailwind --app --src-dir=false --import-alias "@/*"
pnpm add @supabase/supabase-js @supabase/ssr