# ADR-002: Firebase Auth + Express Verification

**Status**: Accepted

## Context

Chorely requires:
- Secure user authentication supporting multiple providers (Google, email/password)
- Cross-platform sign-in (web, mobile-friendly)
- Backend protection of sensitive operations
- Email verification gating for password-based accounts

The team evaluated several auth strategies:
1. Firebase Auth on client + backend token verification
2. Express session-based auth with separate user management
3. OAuth2 authorization server

## Decision

We chose **Firebase Auth on client with Express backend verification**:

```
Browser → Firebase Auth → Get ID Token → API Request
API Request → Express: Verify with Firebase Admin SDK → Process Request
```

### Implementation Details
- **Client**: Firebase SDK handles sign-in, sign-up, password reset
- **Client**: Retrieves ID token via `getIdToken()` after auth state changes
- **Client**: Attaches token to API requests in `Authorization: Bearer` header
- **Server**: Express middleware (`verifyBearerToken`) decodes token without external calls via JWT verification
- **Server**: In development, can use debug endpoint (`/api/debug/auth`) to inspect tokens
- **Database**: Users table links via `firebaseUid` for profile management

## Implementation Flow

### Sign-In
```
1. User enters credentials → Firebase SDK
2. Firebase returns ID token
3. Client stores token in Auth context
4. Token auto-refreshes when expired
```

### API Call
```
1. Client includes: Authorization: Bearer <token>
2. Express extracts and verifies token signature
3. Extracts `firebaseUid` from claims
4. Looks up user profile in database
5. Executes authorized request
```

### Email Verification Gating
```
1. User signs up with email/password
2. Firebase sends verification email
3. React component (`EmailVerificationGate`) checks `auth.currentUser.emailVerified`
4. Redirects to `/verify-email` if not verified
5. After user clicks email link, token claims include `email_verified: true`
```

## Consequences

### Benefits
- ✅ **Decoupled Auth**: Firebase handles identity, we focus on authorization
- ✅ **Multiple Providers**: Google sign-in works without backend code changes
- ✅ **No Session Storage**: Stateless—easier to scale horizontally
- ✅ **Built-in MFA**: Firebase supports SMS/TOTP without custom integration
- ✅ **Dev-friendly**: Debug endpoint lets developers test tokens locally

### Trade-offs
- ⚠️ **Firebase Dependency**: Application tightly coupled to Firebase
- ⚠️ **Token Refresh**: Client responsible for keeping tokens fresh
- ⚠️ **Limited Offline**: API calls fail if Firebase-issued token expires
- ⚠️ **Firebase Admin Key**: Server requires Firebase project credentials

## Security Considerations

1. **Token Verification**: Uses Firebase's public key (cached locally)—no external API call needed
2. **ID Token Format**: JWT with expiration (1 hour default), signed by Firebase
3. **Credential Storage**: Firebase manages credentials client-side (secure, HttpOnly cookies available)
4. **Private Key Handling**: Server-side Firebase private key should never be exposed or logged

## Error Handling

- **Invalid Token**: Returns 401 Unauthorized
- **Expired Token**: Client refreshes token automatically via `getIdToken(true)`
- **User Deleted**: Frontend signs out when token becomes invalid

## Alternatives Considered

1. **Session-based Auth**: Would require session storage (Redis) and CSRF tokens
2. **OAuth2 Provider**: More overhead; Firebase already provides this
3. **API Key Auth**: Less secure, harder to revoke per-user
4. **Passwordless (Magic Links)**: Limited to email; Firebase auth supports multiple providers

## Related ADRs

- None explicitly, but impacts user profile design (see schema.ts)
