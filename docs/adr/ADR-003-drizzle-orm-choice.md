# ADR-003: Drizzle ORM for Database

**Status**: Accepted

## Context

Chorely manages relational data:
- Families and members
- Chores and completions
- Rewards and claims
- Messages and activity
- Achievements and leaderboard records

The team evaluated database access strategies:
1. Drizzle ORM with migrations
2. TypeORM
3. Prisma
4. Raw SQL queries

## Decision

We chose **Drizzle ORM** for the following reasons:

```typescript
// TypeScript-first, no code generation needed
export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").references(() => families.id),
  title: varchar("title", { length: 255 }).notNull(),
  points: integer("points").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id),
  // ...
});

// Can use Zod schemas to ensure type safety end-to-end
export const ChoreSchema = createInsertSchema(chores);
```

## Key Features Used

### 1. Schema Definition
- Type-safe table definitions
- Automatic foreign key relationships
- Built-in validations (NOT NULL, UNIQUE, etc.)

### 2. Drizzle Kit Integration
```bash
npm run db:generate  # Generate SQL migration files
npm run db:push      # Apply migrations to database
```

### 3. Zod Schema Integration
```typescript
// Single schema definition used for validation
export const ChoreSchema = createInsertSchema(chores);
const validatedData = ChoreSchema.parse(req.body);
```

### 4. Query Builder Benefits
- Type-safe queries with IDE autocomplete
- No SQL string interpolation (no SQL injection risk)
- Explicit LEFT/INNER/RIGHT joins
- Subqueries and aggregations

## Consequences

### Benefits
- ✅ **Zero Runtime Overhead**: No code generation, pure TypeScript
- ✅ **SQL Visibility**: Generates readable SQL files for review, backward compatibility
- ✅ **Lightweight**: Minimal abstraction—SQL-like but type-safe
- ✅ **Relationship Integrity**: Foreign keys enforced at DB level
- ✅ **Easy Migrations**: Git-trackable SQL files for schema changes
- ✅ **Zod Integration**: Single source of truth for validation

### Trade-offs
- ⚠️ **Migration Management**: Requires manual SQL review (good for control, slightly more overhead)
- ⚠️ **Learning Curve**: Unlike Prisma's `client.prisma.model`, query syntax requires learning
- ⚠️ **Relationships**: No automatic eager loading like Prisma—must be explicit

## Database Setup

Current setup uses PostgreSQL:
- **Local**: Docker or local PostgreSQL instance
- **Cloud**: Neon or Supabase

## Schema Organization

```
shared/schema.ts         # All table definitions
migrations/              # Generated SQL migration files
server/services/         # Query logic (chore-service.ts, etc.)
```

## Future Considerations

1. **Connection Pooling**: Currently using raw `pg` driver; consider PgBouncer for production
2. **Read Replicas**: Schema supports multi-region if needed
3. **Soft Deletes**: Not currently implemented; can be added if needed
4. **Audit Logging**: Could be added to track data changes

## Alternatives Considered

1. **Prisma**: Great migrations, but larger payload; Drizzle is lighter
2. **TypeORM**: More decorators, more opinionated; Drizzle simpler
3. **Raw SQL**: Too verbose for application code; Drizzle provides safety
4. **Sequelize**: Older, less type-safe

## Related ADRs

- ADR-001: Monorepo (allows shared schema.ts)
