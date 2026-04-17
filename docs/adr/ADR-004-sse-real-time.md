# ADR-004: Server-Sent Events for Real-time Updates

**Status**: Accepted

## Context

Chorely requires real-time features:
- Live chat messages in family chat room
- Activity feed updates (chores completed, rewards claimed, etc.)
- Leaderboard score changes visible immediately
- Multiple family members see updates without page refresh

The team evaluated real-time transport mechanisms:
1. Server-Sent Events (SSE) over HTTP
2. WebSockets
3. Polling
4. Long-polling

## Decision

We chose **Server-Sent Events (SSE)** for initial real-time updates:

```typescript
// Server: stream events to client
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  const unsubscribe = registerSseClient(userId, res);
  req.on("close", unsubscribe);
});

// Broadcast activity when chore completed
await recordActivity(...);
broadcast({
  type: "chore_completed",
  data: { choreId, userId, points }
});

// Client: listen to events
function useFamilyLive() {
  useEffect(() => {
    const eventSource = new EventSource("/api/stream");
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Update UI
    };
  }, []);
}
```

## Server Implementation

**File**: [server/realtime.ts](../../server/realtime.ts)

```typescript
// Global registry of active clients
const sseClients = new Map<number, Set<Response>>();

export function registerSseClient(userId: number, res: Response): () => void {
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId)!.add(res);
  
  return () => {
    sseClients.get(userId)?.delete(res);
  };
}

export function broadcast(userId: number, event: any): void {
  const clients = sseClients.get(userId) || new Set();
  clients.forEach((res) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });
}
```

## Client Implementation

**File**: [client/hooks/use-family-live.ts](../../client/src/hooks/use-family-live.ts)

Uses this hook to subscribe to all activity in the family.

## Consequences

### Benefits
- ✅ **Simple**: Built-in to HTTP/browsers—no special WebSocket infrastructure
- ✅ **Works Behind Proxies**: Works with most corporate/reverse proxy setups
- ✅ **Automatic Reconnection**: Browsers handle reconnection by default
- ✅ **Lower Overhead**: No upgrade handshake like WebSockets
- ✅ **Server-Initiated**: Perfect for notifications (client doesn't need to ask)

### Trade-offs
- ⚠️ **Unidirectional**: Server → Client only (clients must use regular HTTP for requests)
- ⚠️ **Scaling**: Each client needs one open connection (watch memory in production)
- ⚠️ **Load Balancing**: Sticky sessions required (client connected to specific server instance)
- ⚠️ **No Binary Data**: Text-only (fine for JSON, but not for binary payloads)

## Production Considerations

### Memory Management
- Currently clients stored in memory; in production consider:
  - Redis pub/sub for multi-instance deployments
  - Connection timeout (5 minutes idle → close & reconnect)

### Scaling Strategy
1. **Single Server**: Current implementation works fine
2. **Multiple Servers**: Implement Redis pub/sub backend:
   ```typescript
   // Broadcast publishes to Redis channel
   redis.publish(`family:${familyId}`, JSON.stringify(event));
   
   // Each server subscribes to family channels for its users
   ```

### Monitoring
- Track active connections per user
- Monitor for connection leaks (abandoned connections)
- Alert if connections exceed threshold

## Error Handling

- **Network Disconnect**: Browser automatically reconnects
- **Server Restart**: Clients reconnect to new connection after timeout
- **Large Events**: Keep payloads < 64KB to avoid TCP fragmentation

## Event Types (Extensible)

Currently broadcast:
- `message_created`: New chat message
- `activity_created`: Chore completed, reward claimed, etc.
- `user_updated`: User profile or points changed
- `typing`: User is typing (optional, future)

## Alternatives Considered

1. **WebSockets**: More overhead, but bidirectional; unnecessary here
2. **Polling**: Simple but wastes bandwidth; client must ask constantly
3. **Long-polling**: Works but more complex than SSE
4. **Firebase Realtime Database**: Vendor lock-in; SSE keeps us flexible

## Future Enhancements

1. **Message Compression**: gzip event stream data
2. **Event History**: Store last 100 events in Redis, replay on reconnect
3. **Presence**: Track who's currently viewing dashboard
4. **Activity Filtering**: Let client specify event types to receive

## Related ADRs

- ADR-001: Monorepo (allows shared event types)
