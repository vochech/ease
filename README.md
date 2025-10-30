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

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in the required credentials:

### Supabase
- Create a project at https://supabase.com
- Get URL and anon key from project settings
- Add to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

### OpenAI
- Get API key from https://platform.openai.com
- Add to `.env.local`:
  ```
  OPENAI_API_KEY=your-api-key
  OPENAI_ORG_ID=optional-org-id
  ```

### Google Calendar
1. Create a project in Google Cloud Console
2. Enable Calendar API
3. Create OAuth 2.0 credentials
4. Add to `.env.local`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
   ```

## Service Utilities

### Supabase
```typescript
// Browser
import { supabaseClient } from "@/lib/supabaseClient";
// Server
import { supabaseServer } from "@/lib/supabaseServer";
```

### OpenAI
```typescript
import { openai, generateText } from "@/lib/openaiClient";

// Example: Generate text
const response = await generateText("Your prompt here");
```

### Google Calendar
```typescript
import { getGoogleAuthClient, listEvents } from "@/lib/googleCalendar";

// Example: List events (requires auth setup)
const auth = getGoogleAuthClient();
// ... handle OAuth flow ...
const events = await listEvents(auth);
```
