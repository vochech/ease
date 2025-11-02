# Ease App – Code Guidelines

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase · Tailwind CSS · RLS policies

## Core Principles

- Functional, composable components
- Server-first architecture
- Data layer isolated from UI
- Explicit typing – no `any`
- Consistent naming (`camelCase` for vars, `PascalCase` for components)
- React hooks over class logic
- Tailwind for design tokens (no inline style attributes)
- RLS-aware Supabase queries with clear error handling
- Accessible UI (aria, keyboard, roles)

## Review Goals

- Separation of concerns (logic, data, presentation)
- Predictable async flows
- Minimal repetition (DRY)
- Readable & maintainable code
- Clean project hierarchy

## Architecture Patterns

### Server Components (Default)

- Use `async` functions for data fetching
- Import `supabaseServer` from `@/lib/supabaseServer`
- Handle auth and redirects at layout/page level
- Pass data as props to client components

### Client Components

- Mark with `"use client"` directive
- Use React hooks for interactivity
- Keep logic minimal, delegate to hooks
- Import `supabaseClient` for client-side operations

### API Routes

- Use Next.js 14+ route handlers (`route.ts`)
- Validate params with correct async context types
- Use `supabaseServer` for authenticated requests
- Return proper HTTP status codes
- Handle errors gracefully with try/catch

### TypeScript

- Strict mode enabled
- No `any` – use `unknown` and narrow
- Define types in `types/` for shared models
- Use `satisfies` for type assertions where appropriate
- Prefer interfaces for objects, types for unions

### Supabase

- Use RLS policies for security
- Check auth status before queries
- Handle null/undefined cases
- Use proper error handling
- Avoid N+1 queries with joins

### Tailwind

- Use utility classes consistently
- Extract repeated patterns to components
- Use semantic color tokens
- Ensure responsive design
- Maintain accessibility (contrast, focus states)

## File Organization

```
app/
  layout.tsx              # Root layout
  [orgSlug]/              # Org-scoped routes
    layout.tsx            # Org layout with auth
    dashboard/            # Feature folders
      page.tsx
components/
  feature/                # Group by feature
lib/
  supabaseServer.ts       # Server-side client
  supabaseClient.ts       # Browser client
types/
  *.ts                    # Shared type definitions
```

## Common Patterns to Avoid

- ❌ Mixing data fetching with UI in client components
- ❌ Using `any` type
- ❌ Inline styles instead of Tailwind
- ❌ Missing error handling in async operations
- ❌ Ignoring TypeScript errors with `@ts-ignore`
- ❌ Hardcoded values instead of env vars
- ❌ Legacy `createRouteHandlerClient` (use `supabaseServer`)

## Best Practices

- ✅ Separate data fetching from rendering
- ✅ Use server components by default
- ✅ Client components only for interactivity
- ✅ Proper TypeScript types everywhere
- ✅ Consistent error handling
- ✅ Accessible UI components
- ✅ Responsive design with Tailwind
- ✅ Clear naming and code organization
