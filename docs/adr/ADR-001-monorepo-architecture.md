# ADR-001: Monorepo Architecture

**Status**: Accepted

## Context

Chorely consists of three interconnected layers:
- **Client**: React web application with Vite
- **Server**: Express API backend
- **Shared**: Type definitions and utilities used by both

The team needed to decide whether to use a monorepo structure or separate repositories.

## Decision

We chose a **monorepo architecture** with the following structure:
```
project/
├── client/              # React frontend (Vite)
├── server/              # Express backend
├── shared/              # Shared types, routes, schemas
├── scripts/             # Build utilities
└── migrations/          # Database migrations
```

## Consequences

### Benefits
- ✅ **Shared Types**: Single source of truth for API contracts via TypeScript and Zod schemas
- ✅ **Atomic Commits**: Changes to both client and server in a single commit
- ✅ **Unified Build**: Single `npm run build` command compiles everything to `dist/`
- ✅ **Easier Refactoring**: IDE can track changes across client/server/shared
- ✅ **Single Dependency Management**: One `package.json` reduces version conflicts

### Trade-offs
- ⚠️ **Larger Repository**: All code in one repo (mitigated with `.gitignore`)
- ⚠️ **Unified Dependency Graph**: One version of React Query, Zustand, etc. for both client and server
- ⚠️ **Single Deploy Unit**: Can't deploy client and server independently

## Alternatives Considered

1. **Separate Repositories**: Would require separate CI/CD, more complex type sharing
2. **Nx Monorepo**: Would add complexity; simple solution sufficient for current scale
3. **pnpm Workspaces**: Not needed at current scale; npm workspaces also an option

## Related ADRs

- ADR-005: React Query for Server State (affects monorepo's dependency choices)
