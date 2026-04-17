# Development Guide for Chorely

Welcome to Chorely development! This guide covers local setup, development workflows, testing, and debugging.

## Quick Start (5 minutes)

### Option A: Quick Demo (No Database Required)

```bash
# 1. Install dependencies
npm install

# 2. Create minimal config
cp .env.example .env
cp client/.env.example client/.env.local

# 3. Enable demo mode
# Edit .env and set CHORELY_DEMO_MODE=true

# 4. Start dev server
npm run dev

# 5. Open http://localhost:5173
```

**Demo Features**:
- Pre-loaded sample family and users
- Mock chores and rewards
- Mock messages and activity
- No Firebase credentials needed
- No database required

### Option B: Full Setup (With Database)

See [Setup Steps](#setup-steps) below.

## Setup Steps

### 1. Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- PostgreSQL 12+ (local, Docker, or cloud)
- Firebase project (free tier fine for dev)
- Git installed

### 2. Clone and Install

```bash
git clone <repo-url>
cd Chorely-20
npm install
```

### 3. Database Setup

#### Option A: Docker (Easiest)

```bash
# Start PostgreSQL container
docker run --name chorely-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=chorely \
  -p 5432:5432 \
  postgres:16

# In .env, use:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chorely
```

#### Option B: Local PostgreSQL

```bash
# Create database
sudo -u postgres psql

# In psql:
CREATE DATABASE chorely;
\q

# In .env:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/chorely
```

#### Option C: Cloud (Neon or Supabase)

See [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### 4. Firebase Setup

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

Quick version:
1. Create Firebase project at https://console.firebase.google.com/
2. Copy web config to `client/.env.local`
3. Generate service account key and add to `.env`

### 5. Initialize Database

```bash
npm run db:push
```

This applies the schema to your database.

### 6. Start Development

```bash
npm run dev
```

Open http://localhost:5173 in browser.

## Development Workflows

### Daily Development

```bash
# Terminal 1: Start dev server (auto-restarts on changes)
npm run dev

# Terminal 2: Run tests in watch mode
npm run test:watch

# Terminal 3: Run linting
npm run lint

# Format code on save:
npm run format
```

### Before Commit

```bash
# Fix linting issues
npm run lint:fix

# Fix formatting
npm run format

# Run full verification
npm run verify

# Then commit
git add .
git commit -m "Your message"
```

### Pre-commit Hooks (Optional)

To auto-run linting and tests before commit:

```bash
# Enable pre-commit hooks (one-time setup)
npx husky install

# Hooks will now run automatically:
# - pre-commit: lint & format
# - pre-push: full verify (check + test + build)
```

## Project Structure

```
Chorely-20/
├── client/                    # React web frontend
│   ├── src/
│   │   ├── pages/            # Page components (Dashboard, Admin, etc.)
│   │   ├── components/       # Reusable UI components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities (Firebase, API, etc.)
│   │   ├── store/            # Zustand state management
│   │   ├── index.css         # Global styles
│   │   ├── App.tsx           # Main router setup
│   │   └── main.tsx          # Entry point
│   └── .env.local            # Client env vars (git ignored)
│
├── server/                    # Express API backend
│   ├── routes.ts             # API endpoint definitions
│   ├── auth.ts               # Firebase token verification
│   ├── db.ts                 # Database connection
│   ├── services/             # Business logic
│   │   ├── chore-service.ts
│   │   ├── reward-service.ts
│   │   └── ...
│   └── index.ts              # Server entry point
│
├── shared/                    # Shared code (types, schemas)
│   ├── schema.ts             # Database schema (Drizzle)
│   ├── routes.ts             # API route definitions + types
│   ├── constants.ts          # Shared constants
│   └── achievements.ts       # Achievement logic
│
├── docs/                      # Documentation
│   └── adr/                   # Architecture Decision Records
│
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite config
├── drizzle.config.ts         # Drizzle config
├── .env.example              # Server env template
├── .eslintrc.json            # ESLint config
├── .prettierrc.json          # Prettier config
└── README.md                 # Quick reference
```

## Common Development Tasks

### Add a New Chore Field

1. **Update Database Schema** (`shared/schema.ts`):
```typescript
export const chores = pgTable("chores", {
  // ... existing fields
  newField: varchar("new_field", { length: 100 }).notNull().default(""),
});
```

2. **Generate Migration**:
```bash
npm run db:generate
```

3. **Review Generated SQL** in `migrations/` folder

4. **Apply Migration**:
```bash
npm run db:push
```

5. **Update Validation Schema** (`shared/schema.ts`):
```typescript
export const ChoreSchema = createInsertSchema(chores);
```

6. **Update API Routes** (`server/routes.ts`):
```typescript
// Validate input with new field
const choreData = ChoreSchema.parse(req.body);
```

7. **Update UI** (`client/pages/Admin.tsx`, etc.):
```typescript
// Form input for new field
<input name="newField" />
```

### Add a New API Endpoint

1. **Define Route** in `shared/routes.ts`:
```typescript
export const api = {
  myEndpoint: {
    path: "/api/my-endpoint",
    method: "POST",
    input: z.object({ /* ... */ }),
    responses: { 201: z.object({ /* ... */ }) },
  },
};
```

2. **Implement Handler** in `server/routes.ts`:
```typescript
app.post("/api/my-endpoint", requireAuth, async (req, res) => {
  const data = api.myEndpoint.input.parse(req.body);
  // Process request
  res.status(201).json(result);
});
```

3. **Create Hook** in `client/hooks/use-*.ts`:
```typescript
export function useMyEndpoint() {
  return useMutation({
    mutationFn: (data) => apiFetch(api.myEndpoint.path, { /* ... */ }),
  });
}
```

4. **Use in Component**:
```typescript
const mutation = useMyEndpoint();
mutation.mutate({ /* ... */ });
```

### Add a New Page

1. **Create Component** in `client/pages/MyPage.tsx`:
```typescript
export default function MyPage() {
  return <div>My Page</div>;
}
```

2. **Add Route** in `client/App.tsx`:
```typescript
const MyPage = lazy(() => import("@/pages/MyPage"));

// In Switch:
<Route path="/my-page" component={MyPage} />
```

3. **Add Navigation** in `client/components/BottomNav.tsx` or wherever needed

## Testing

### Run Tests

```bash
# Run once
npm run test

# Watch mode (reruns on file changes)
npm run test:watch

# With coverage
npm run test -- --coverage
```

### Write Tests

Create `.test.ts` or `.test.tsx` file:

```typescript
// client/src/lib/__tests__/utils.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "../utils";

describe("myFunction", () => {
  it("should work correctly", () => {
    expect(myFunction()).toBe("expected");
  });
});
```

Tests automatically discovered and run by Vitest.

## Debugging

### Browser Console

```typescript
// Log React Query state
import { useQueryClient } from "@tanstack/react-query";

function DebugComponent() {
  const queryClient = useQueryClient();
  console.log(queryClient.getQueryData(["chores"]));
}
```

### React DevTools

1. Install [React DevTools](https://react-devtools-tutorial.vercel.app/) browser extension
2. Use to inspect component state, props, hooks

### Network Tab

1. Open Browser DevTools → Network tab
2. Watch API requests/responses
3. Check response status, timing, payload

### Debug Endpoint (Dev Only)

```bash
# Decode Firebase ID token without hitting Firebase
curl http://localhost:5000/api/debug/auth \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response shows decoded token claims:
```json
{
  "iss": "https://securetoken.google.com/...",
  "aud": "...",
  "auth_time": 1234567890,
  "user_id": "...",
  "sub": "...",
  "iat": 1234567890,
  "exp": 1234571490,
  "email": "user@example.com",
  "email_verified": true
}
```

### Server Logs

Development server logs API requests with:
- Method & path
- Status code
- Duration in ms
- Response body (for JSON endpoints)

```
15:30:42 [express] POST /api/chores 201 in 145ms :: {"id":42,"title":"..."}
```

### TypeScript Checking

```bash
# Check for type errors
npm run check

# Watch mode
npx tsc --watch
```

## Environment Variables

### Server (.env)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/chorely` |
| `FIREBASE_PROJECT_ID` | Yes | `my-project` |
| `FIREBASE_CLIENT_EMAIL` | Yes | `firebase-adminsdk...@...iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Yes | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `PORT` | No | `5000` (default) |
| `NODE_ENV` | No | `development` (default) or `production` |
| `CHORELY_DEMO_MODE` | No | `true` to enable mock data |

### Client (client/.env.local)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_FIREBASE_API_KEY` | Yes | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | `my-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Yes | `my-project` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | `my-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | `123456789` |
| `VITE_FIREBASE_APP_ID` | Yes | `1:123...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | `G-XXXXX` |

## Performance Tips

### Development

```bash
# Faster rebuilds: Use esbuild instead of tsc
npm run build  # Uses optimized build script

# Faster tests: Run specific test file
npm run test -- client/src/lib/utils.test.ts
```

### Production Checks

```bash
# Check bundle size
npm run build

# Analyze bundle
npm run build -- --analyze  # (if analyzer configured)
```

## Common Issues & Solutions

### "Cannot find module '@shared'"

❌ TypeScript path alias not resolving

✅ Solution:
```bash
npm install
npm run check  # Validate tsconfig.json
```

### "Database connection failed"

❌ PostgreSQL not running or wrong DATABASE_URL

✅ Solution:
```bash
# Verify PostgreSQL running
docker ps | grep postgres

# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### "Firebase credentials missing"

❌ `.env` or `client/.env.local` not configured

✅ Solution:
```bash
cp .env.example .env
cp client/.env.example client/.env.local

# Edit both files with real credentials
# Or use demo mode: CHORELY_DEMO_MODE=true
```

### "Port 5000 already in use"

❌ Another process on port 5000

✅ Solution:
```bash
# Change port in .env
PORT=5001

# Or kill process on port 5000:
# Linux/macOS: lsof -ti:5000 | xargs kill -9
# Windows: netstat -ano | findstr :5000
#         taskkill /PID [PID] /F
```

### "Hot module reload not working"

❌ Vite dev server issue

✅ Solution:
```bash
# Restart dev server
npm run dev

# Or check for unsupported modifications
# (HMR doesn't work for all file changes)
```

## Code Style

### Formatting

```bash
# Auto-fix formatting
npm run format

# Check (don't fix)
npm run format:check
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix where possible
npm run lint:fix
```

### Type Checking

```bash
# Check for type errors
npm run check
```

### Pre-commit (Optional)

```bash
# Enable auto-lint before commits
npx husky install
```

Now all commits auto-run: lint, format, test.

## Production Builds

```bash
# Build for production
npm run build

# Output in dist/ folder:
# - dist/public/ - Client bundle (Vite)
# - dist/index.cjs - Server bundle (ESBuild)

# Start production server
npm run start
```

## Deployment

### To Replit

1. Push to GitHub
2. Connect Replit to repo
3. Set environment variables in Replit
4. Replit auto-deploys main branch

### To Your Server

1. Build: `npm run build`
2. Upload `dist/` folder
3. Copy `.env.production` to server
4. Run: `npm run start`

## Resources

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express Guide](https://expressjs.com/)
- [Drizzle Docs](https://orm.drizzle.team/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Chorely ADRs](./docs/adr/)

## Getting Help

1. Check existing issues on GitHub
2. Review Architecture Decision Records in `docs/adr/`
3. Check error messages carefully (often descriptive)
4. Ask in team Slack/Discord
5. Read comments in relevant source file

---

Happy coding! 🚀
