# Chorely

Chorely is a mobile-first family chore game built with React, Vite, Express, PostgreSQL, Drizzle, and Firebase Authentication.

## 🚀 Quick Start

### Windows Users
Run the automated setup script:
```powershell
.\setup.ps1
```

### macOS/Linux Users
```bash
npm install
cp .env.example .env
cp client/.env.example client/.env.local
npm run db:push 2>/dev/null || npm run dev  # db:push optional for demo mode
npm run dev
```

## 📚 Setup Guides

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detailed Firebase authentication configuration
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - PostgreSQL setup (Local, Docker, Neon, Supabase)
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Complete development workflow and debugging guide
- **[docs/adr/](./docs/adr/)** - Architecture Decision Records explaining key design decisions

## ⚡ Demo Mode (No Database Required)

To quickly test the app without Firebase or PostgreSQL:

1. Install dependencies: `npm install`
2. Create minimal config:
   ```bash
   cp .env.example .env
   cp client/.env.example client/.env.local
   ```
3. Edit `.env` and add: `CHORELY_DEMO_MODE=true`
4. Start: `npm run dev`
5. Open http://localhost:5173

Demo includes sample family, chores, rewards, and real-time chat—perfect for testing UI!

## 📋 Useful Scripts

### Development
- `npm run dev` - Start dev server (Express + Vite, auto-reload)
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Check code style
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Auto-format code
- `npm run format:check` - Check formatting without changes
- `npm run check` - TypeScript type checking

### Database
- `npm run db:push` - Sync schema to database
- `npm run db:generate` - Generate migration files

### Build & Deploy
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run start` - Run production server
- `npm run verify` - Run all checks: typecheck → lint → format → test → build

## 🏗️ Architecture

Chorely follows a monorepo architecture with:
- **Client** (`client/src/`) - React web app with Vite
- **Server** (`server/`) - Express API backend
- **Shared** (`shared/`) - Type definitions, schemas, routes

See [Architecture Decision Records](./docs/adr/) for design decisions.

## 🔐 Auth Model

- **Client**: Firebase SDK handles sign-in, identity, token refresh
- **Server**: Express middleware verifies Firebase ID tokens
- **Database**: User profiles linked via `firebaseUid`
- **Email**: Verification gating for password-based signups

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed auth configuration.

## ✨ V1 Features

- Family creation and join flows with guided starter content
- Google sign-in, email/password sign-in, and email verification gating
- Dashboard focused on today, upcoming work, recent wins, activity, achievements, and monthly winners
- Real-time chat and family activity updates through Server-Sent Events
- Approval-required chores and rewards for parent trust
- Activity history, achievements, and monthly winner records
- Admin review queues, role management, invite sharing, chore creation, reward creation, and leaderboard visibility controls
- Avatar customization with lightweight profile personalization

## 🛠️ Tech Stack

| Layer | Tech | Purpose |
|-------|------|---------|
| **Frontend** | React 18, Vite, TypeScript | UI framework & build tool |
| **Backend** | Express, Node.js | API server |
| **Database** | PostgreSQL, Drizzle ORM | Data & schema management |
| **State** | React Query, Zustand | Server & UI state |
| **Real-time** | Server-Sent Events (SSE) | Live updates & chat |
| **Auth** | Firebase Auth | Identity & authentication |
| **UI Components** | shadcn/ui, Radix UI | Accessible component library |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Testing** | Vitest, React Testing Library | Testing framework |
| **Validation** | Zod | Schema validation |

## 🧪 Code Quality

- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Type Safety**: TypeScript strict mode across all layers
- **Pre-commit Hooks**: Optional Husky hooks for auto-lint/format
- **Tests**: Vitest with global test environment

Setup: See [DEVELOPMENT.md](./DEVELOPMENT.md) for pre-commit hook setup.

## 📖 Documentation

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Full development guide, workflows, debugging
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase configuration and troubleshooting
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Database options and setup
- **[docs/adr/](./docs/adr/)** - Architecture Decision Records (5 key decisions documented)

## 📝 Notes

- **Demo Mode**: Set `CHORELY_DEMO_MODE=true` in `.env` to use mock data (no DB required)
- **Database**: PostgreSQL required for full setup. See [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Migrations**: Check `migrations/` folder before deploying to existing databases
- **Windows Setup**: Run `.\setup.ps1` for automated setup
- **Pre-commit Hooks**: Optional; run `npx husky install` to enable auto-lint on commits

## 🎯 First Steps

1. **New to Chorely?** Start with [DEVELOPMENT.md](./DEVELOPMENT.md)
2. **Need Firebase setup?** See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
3. **Want context for architecture?** Read [docs/adr/](./docs/adr/)
4. **Ready to contribute?** Follow the workflow in [DEVELOPMENT.md](./DEVELOPMENT.md#development-workflows)
