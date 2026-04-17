# ADR-005: React Query for Server State

**Status**: Accepted

## Context

Chorely client manages two types of state:
1. **Server State**: Families, users, chores, rewards (stored in database)
2. **UI State**: Modal open/close, form inputs, sort order (stored in React)

The team evaluated state management strategies:
1. React Query (TanStack Query) for server state + Zustand for UI state
2. Redux for everything
3. SWR
4. Zustand for everything
5. Context API for everything

## Decision

We adopted a **hybrid approach**:

- **React Query**: Server state (families, chores, users) with caching, refetching, mutations
- **Zustand**: UI state (UI preferences, form state, temporary values)
- **Firebase Auth**: Authentication state (managed by Firebase SDK)

### Server State (React Query)

```typescript
// Hooks in client/hooks/use-chores.ts
export function useChores(familyId: number) {
  return useQuery({
    queryKey: [api.families.getChores.path, familyId],
    queryFn: async () => {
      const res = await apiFetch(`/api/families/${familyId}/chores`);
      return await res.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

// Mutations invalidate queries automatically
export function useCreateChore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [api.families.getChores.path] 
      });
    },
  });
}
```

### UI State (Zustand)

```typescript
// store/useStore.ts
interface UiState {
  selectedChoreId: number | null;
  setSelectedChoreId: (id: number | null) => void;
  // ...
}

export const useStore = create<UiState>((set) => ({
  selectedChoreId: null,
  setSelectedChoreId: (id) => set({ selectedChoreId: id }),
}));
```

## Integration Pattern

```typescript
// Components use both seamlessly
function ChoreList() {
  // Server state: automatic refetch, caching
  const { data: chores, isLoading } = useChores(familyId);
  
  // UI state: local management
  const selectedChoreId = useStore((s) => s.selectedChoreId);
  
  if (isLoading) return <LoadingSpinner />;
  
  return chores.map(chore => (
    <ChoreCard
      chore={chore}
      selected={chore.id === selectedChoreId}
      onClick={() => useStore.setState({ selectedChoreId: chore.id })}
    />
  ));
}
```

## Consequences

### Benefits
- ✅ **Separation of Concerns**: Server state logic separate from UI state
- ✅ **Automatic Caching**: React Query handles cache invalidation
- ✅ **Optimistic Updates**: Mutations can update UI before server response
- ✅ **Built-in Refetch**: Handles background refetch, stale data, deduplication
- ✅ **Zustand is Lightweight**: Minimal boilerplate, no actions/reducers
- ✅ **Dev Tools**: React Query and Zustand have excellent dev tools
- ✅ **No Redux Boilerplate**: Reduces code verbosity significantly

### Trade-offs
- ⚠️ **Two Systems**: Developers must understand when to use which
- ⚠️ **Query Key Naming**: Must be consistent across app (centralized in shared/routes.ts)
- ⚠️ **No Time-travel Debugging**: Zustand doesn't replay state changes like Redux
- ⚠️ **Learning Curve**: React Query has unique patterns (staleTime, cacheTime, etc.)

## Query Key Strategy

All query keys defined centrally in [shared/routes.ts](../../shared/routes.ts):

```typescript
export const api = {
  families: {
    getChores: {
      path: "/api/families/:id/chores",
      queryKey: ["families", "chores"],
    },
  },
};

// In component
const { data } = useQuery({
  queryKey: [api.families.getChores.path, familyId],
  queryFn: async () => { /* ... */ },
});
```

This ensures:
- Consistency across app
- Single place to update cache invalidation
- Type-safe query keys

## Mutation Patterns

### Standard Mutation
```typescript
const mutation = useMutation({
  mutationFn: async (data) => postChore(data),
  onSuccess: (newChore) => {
    queryClient.invalidateQueries({ queryKey: ["chores"] });
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

mutation.mutate({ title: "Clean room", points: 50 });
```

### Optimistic Update
```typescript
const mutation = useMutation({
  mutationFn: completeChore,
  onMutate: async (choreId) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ["chores"] });
    
    // Snapshot current data
    const previousChores = queryClient.getQueryData(["chores"]);
    
    // Update UI immediately
    queryClient.setQueryData(["chores"], (old) => 
      old.map(c => c.id === choreId ? { ...c, completed: true } : c)
    );
    
    return previousChores; // For rollback
  },
  onError: (err, choreId, previousChores) => {
    // Rollback on error
    queryClient.setQueryData(["chores"], previousChores);
  },
});
```

## Stale Time vs Cache Time

- **staleTime**: How long before data is considered stale (refetch in background)
  - 30 seconds for fresh data (leaderboard, points)
  - 5 minutes for less critical data
  
- **gcTime** (formerly cacheTime): How long to keep unused data in memory
  - Default 5 minutes; fine for most cases

## Error Handling

React Query provides:
- `error` state in query
- `isError` flag
- `onError` callback in mutations
- Automatic retry with exponential backoff

```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ["chores"],
  queryFn: fetchChores,
  retry: 3, // Retry failed requests up to 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (error) return <ErrorAlert message={error.message} />;
```

## Alternatives Considered

1. **Redux**: Overkill for this project; more boilerplate
2. **SWR**: Simpler but less powerful; React Query is better for complex queries
3. **Zustand Alone**: No built-in cache, refetch, or deduplication for server state
4. **Context API**: Not designed for frequent updates; causes unnecessary re-renders

## Best Practices

1. **Keep queries in hooks**: Don't fetch in components
2. **Use query keys consistently**: Defined in shared/routes.ts
3. **Leverage invalidation**: Don't manual refetch
4. **Set appropriate staleTime**: Balance freshness vs network load
5. **Combine with Real-time**: SSE broadcasts can trigger invalidation
6. **Error boundaries**: Wrap components to catch query errors

## Related ADRs

- ADR-001: Monorepo (allows shared query key definitions)
- ADR-004: Real-time Updates (SSE can trigger manual invalidation)
