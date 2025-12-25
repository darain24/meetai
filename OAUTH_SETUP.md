# OAuth Setup Guide

This guide explains how to configure OAuth providers (Google and GitHub) for authentication.

## Google OAuth Setup

### Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type (unless you have a Google Workspace)
   - Fill in the required app information
   - Add your email as a test user (for development)
   - Save and continue through the scopes and summary

### Step 2: Configure OAuth Client

1. Application type: **Web application**
2. Name: Give it a descriptive name (e.g., "CollabSpace Production")
3. **Authorized redirect URIs**: Add the following URIs:

   **Production:**
   ```
   https://collabspace-ruddy.vercel.app/api/auth/callback/google
   ```

   **Development (Local):**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

   **Note:** If you have multiple Vercel deployments (preview branches), add their URLs too:
   ```
   https://your-preview-branch.vercel.app/api/auth/callback/google
   ```

4. Click **Create**
5. Copy the **Client ID** and **Client Secret**

### Step 3: Add Environment Variables

Add these to your `.env.local` (for local development) and Vercel environment variables:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=https://collabspace-ruddy.vercel.app
```

**Important:** 
- For local development, `NEXT_PUBLIC_APP_URL` should be `http://localhost:3000`
- For production, use your actual Vercel domain

## GitHub OAuth Setup

### Step 1: Create OAuth App in GitHub

1. Go to your GitHub account settings
2. Navigate to **Developer settings** > **OAuth Apps** > **New OAuth App**
3. Fill in the application details:
   - **Application name**: CollabSpace (or your preferred name)
   - **Homepage URL**: `https://collabspace-ruddy.vercel.app`
   - **Authorization callback URL**: 
     ```
     https://collabspace-ruddy.vercel.app/api/auth/callback/github
     ```
4. Click **Register application**
5. Copy the **Client ID** and generate a **Client Secret**

### Step 2: Add Environment Variables

Add these to your `.env.local` and Vercel environment variables:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Common Issues

### "Invalid Origin" Error

- Make sure `NEXT_PUBLIC_APP_URL` or `BETTER_AUTH_URL` is set correctly
- The URL should match exactly (including `https://` and no trailing slash)

### "Redirect URI Mismatch" Error

- Ensure the redirect URI in Google Cloud Console matches exactly:
  - Must include the full path: `/api/auth/callback/google`
  - Must match the protocol (`http://` for local, `https://` for production)
  - No trailing slashes

### Multiple Environments

If you have multiple Vercel deployments (production, preview, staging), you'll need to:
1. Add each redirect URI to Google Cloud Console
2. Or use a wildcard domain if your OAuth provider supports it
3. Make sure `NEXT_PUBLIC_APP_URL` is set correctly for each environment

## Testing

1. **Local Development:**
   - Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`
   - Make sure `http://localhost:3000/api/auth/callback/google` is in Google Cloud Console

2. **Production:**
   - Set `NEXT_PUBLIC_APP_URL=https://collabspace-ruddy.vercel.app` in Vercel
   - Make sure `https://collabspace-ruddy.vercel.app/api/auth/callback/google` is in Google Cloud Console

## Security Notes

- Never commit `.env.local` or environment variables to git
- Rotate secrets if they're ever exposed
- Use different OAuth apps for development and production if possible
- Regularly review OAuth app permissions and authorized domains

