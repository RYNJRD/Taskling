# Firebase Setup Guide for Chorely

This guide walks you through setting up Firebase authentication for Chorely development and production.

## Overview

Chorely uses Firebase Authentication for:
- Google sign-in
- Email/password authentication
- Email verification
- Password reset flows
- Multi-factor authentication (optional)

## Prerequisites

- Google account (for Firebase Console access)
- Active Firebase project or ability to create one
- Node.js 18+ installed

## Step 1: Create a Firebase Project

### Via Firebase Console

1. Navigate to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Click **"Create a new project"** or **"Add project"**
3. Enter project name (e.g., "chorely-dev")
4. (Optional) Enable Google Analytics if desired
5. Click **"Create project"**
6. Wait 1-2 minutes for provisioning

### Alternative: Create via Google Cloud Console

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Select or create a new project
3. Enable Firebase API
4. Firebase is now linked to this project

## Step 2: Enable Authentication Methods

1. In Firebase Console, click your project
2. Left sidebar → **"Authentication"** → **"Get started"** (or **"Sign-in method"**)
3. Enable the following:

### Google Sign-In
1. Click **"Google"**
2. Toggle **"Enabled"** to ON
3. Enter a **Project support email** (can be your account email)
4. Click **"Save"**

### Email/Password
1. Click **"Email/Password"**
2. Toggle **"Enabled"** to ON
3. Toggle **"Email link (passwordless sign-in)"** to OFF (optional)
4. Click **"Save"**

### (Optional) Anonymous
- Toggle ON if you want demo/preview functionality without sign-up

## Step 3: Get Firebase Client Credentials

### For Web/Client (`client/.env.local`)

1. In Firebase Console, click the **gear icon** → **"Project settings"**
2. Go to **"General"** tab
3. Scroll down to **"Your apps"** section
4. Find your web app (or create one by clicking **"</>"**)
5. Copy the Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
  measurementId: "MEASUREMENT_ID"
};
```

6. Update `client/.env.local`:
```env
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=SENDER_ID
VITE_FIREBASE_APP_ID=APP_ID
VITE_FIREBASE_MEASUREMENT_ID=MEASUREMENT_ID
```

## Step 4: Get Firebase Admin Credentials

### For Server/Backend (`.env`)

1. In Firebase Console, go **Project settings** → **"Service accounts"** tab
2. Click **"Generate new private key"**
3. A JSON file downloads with credentials

The file contains:
```json
{
  "type": "service_account",
  "project_id": "YOUR_PROJECT_ID",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

4. Update `.env` with:
```env
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@YOUR_PROJECT.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### ⚠️ Important: Private Key Format

In `.env` files, the private key must have `\n` literals (not actual newlines):

❌ WRONG:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkq...
-----END PRIVATE KEY-----"
```

✅ CORRECT:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n"
```

**Tip**: If pasting from the JSON file, use the command line:
```bash
# macOS/Linux
cat service-account-key.json | jq -r '.private_key'

# Windows PowerShell
(Get-Content service-account-key.json | ConvertFrom-Json).private_key
```

## Step 5: Configure Authorized Domains (Production)

For production deployment:

1. Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **"Authorized domains"**
3. Add your production domain (e.g., `example.com`)
4. Firebase will show a verification TXT record to add to DNS

For **local development**: `localhost` is pre-authorized.

## Step 6: Setup Email Verification (Optional but Recommended)

### Enable Email Verification

1. Firebase Console → **Authentication** → **Templates** tab
2. Click **"Email address verification"**
3. Customize email template (optional)
4. Click **"Publish"**

### Configure Email Sender

By default, emails come from `noreply@firebase.com`. To use a custom sender:

1. Firebase Console → **Settings** (gear icon) → **"Project settings"**
2. Click **"Email"** tab
3. Click **"Edit" on the sender name/email**
4. Enter your domain and email address
5. Verify the sender via SPF/DKIM records (Firebase provides instructions)

Chorely uses a custom email action page for verification. See [Email Verification Flow](#email-verification-flow) below.

## Step 7: Test Firebase Auth Locally

### Quick Test

Run:
```bash
npm run dev
```

1. Open client: http://localhost:5173
2. Try sign-up with email
3. Check DB → `users` table to confirm user created
4. Look at browser console for any errors

### Debug Endpoint

While in development, use:
```bash
curl http://localhost:5000/api/debug/auth \
  -H "Authorization: Bearer <your_id_token>"
```

This decodes the token without hitting Firebase Admin SDK, useful for debugging.

## Email Verification Flow

Chorely implements a custom email verification flow:

### User Signs Up
```
1. User enters email/password
2. Firebase sends verification email with link
3. User clicks link → redirected with `?mode=verifyEmail&oobCode=XXX`
```

### App Handles Verification
```
1. EmailAction page (`/email-action`) checks URL params
2. Calls Firebase SDK: `confirmPasswordReset(auth, oobCode)`
3. Marks email as verified
4. Redirects to dashboard
```

### Verification Gate
```
1. Components check auth.currentUser.emailVerified
2. If false, redirect to `/verify-email`
3. User can resend verification email
```

## Troubleshooting

### "Missing Firebase credentials" on startup

❌ Error appears when:
- `.env` missing `FIREBASE_PROJECT_ID`
- `client/.env.local` missing `VITE_FIREBASE_PROJECT_ID`

✅ Fix:
```bash
# Copy template
cp .env.example .env
cp client/.env.example client/.env.local

# Edit both files with real credentials
```

### "Auth/invalid-api-key" in browser console

❌ Likely causes:
- `VITE_FIREBASE_API_KEY` is incorrect
- API key domain restriction set, but `localhost` not added

✅ Fix:
1. Verify API key is copied correctly
2. Firebase Console → **Settings** → **API restrictions**
3. Add `localhost` to allowed domains for development

### "Permission denied" when creating user

❌ Likely cause:
- Firebase security rules restrict user creation (unlikely default)

✅ Fix:
1. Firebase Console → **Authentication** → **Users** tab
2. Check if you can manually add a user
3. Check browser console for detailed error

### Email not arriving

❌ Likely causes:
- Email verification not enabled in Firebase
- Custom domain sender not verified
- Email in spam folder

✅ Fix:
1. Check Firebase → **Authentication** → **Templates** → verify email is "Publish"ed
2. If using custom sender, verify SPF/DKIM records added to DNS
3. Check spam folder
4. Try from Account Settings page → **"Resend verification email"**

### "Invalid or expired oobCode" during email verification

❌ Likely cause:
- User clicked old verification link
- Link expired (default: 24 hours)

✅ Fix:
1. Click **"Resend verification email"** in UI
2. Use new link immediately

## Production Checklist

- [ ] Firebase project created
- [ ] Authentication methods enabled (Google, Email/Password)
- [ ] Web app registered in Firebase Console
- [ ] Client credentials in `.env.local` on client machines
- [ ] Service account key generated for server
- [ ] Server credentials in `.env` on server
- [ ] Custom domain added to authorized domains
- [ ] Email verification template customized (optional)
- [ ] Custom email sender verified (optional)
- [ ] Backup of service account key stored securely
- [ ] Database backups enabled
- [ ] Firebase security rules reviewed
- [ ] Billing alert set up for Firebase project

## Security Best Practices

1. **Private Key Storage**
   - Never commit `.env` to git
   - Use `.gitignore` to exclude `.env` files
   - Use secret management for production (GitHub Secrets, AWS Secrets Manager)

2. **API Key Restrictions**
   - Restrict API key to web/HTTP origins only
   - Add your production domain(s)
   - For development: `localhost:*`

3. **Authorized Domains**
   - Only add trusted domains
   - Firebase warns about security risks of overly permissive configs

4. **Email Verification**
   - Enforce for password-based signups (Chorely already does this)
   - Helps prevent typos and compromised accounts

5. **Monitoring**
   - Monitor Firebase Auth events in Console
   - Set up alerts for unusual activity patterns
   - Review sign-in methods monthly

## Migration: Local Firebase to Production

When deploying to production:

1. **Create Production Firebase Project** (separate from dev)
2. **Update Environment Variables**:
   - Update `.env` with production service account
   - Update `client/.env.local` with production config
   - Update `client/src/lib/firebase.ts` if needed
3. **Migrate User Data** (if applicable):
   - Drizzle migrations handle database schema
   - User data migrated by Drizzle or manual export
4. **Enable Production Domain**:
   - Add production domain to Firebase authorized domains
5. **Test Thoroughly**:
   - Test sign-up, sign-in, password reset
   - Test email verification
   - Verify logs in Firebase Console

## References

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Chorely ADR-002: Firebase Auth Strategy](./docs/adr/ADR-002-firebase-auth-strategy.md)

## Support

For issues specific to Chorely, check:
- [README.md](./README.md)
- [Architecture Decision Records](./docs/adr/)
- Terminal debug output: `npm run dev`
