# 🚀 Complete Setup Guide - Unsubscribe Dashboard

This guide will walk you through every step to get your Unsubscribe Dashboard running locally.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Node.js 18+** installed ([Download here](https://nodejs.org/))
- [ ] **pnpm** installed (run: `npm install -g pnpm`)
- [ ] **Google account** for OAuth setup
- [ ] **Terminal/Command Line** access

Verify your installations:

```bash
node --version    # Should be 18.0.0 or higher
pnpm --version    # Should be 8.0.0 or higher
```

---

## 🏗️ Step 1: Project Setup

1. **Clone and install dependencies:**

   ```bash
   git clone https://github.com/yourusername/unsubscribe-dashboard.git
   cd unsubscribe-dashboard
   pnpm install
   ```

2. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```

---

## 🔐 Step 2: Google Cloud Console Setup

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `unsubscribe-dashboard`
4. Click **"Create"**
5. Wait for the project to be created and select it

### 2.2 Enable Gmail API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Gmail API"**
3. Click on **"Gmail API"** and click **"Enable"**

### 2.3 Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**

Fill out the required fields:

- **App name**: `Unsubscribe Dashboard`
- **User support email**: Your email address
- **Developer contact information**: Your email address

4. Click **"Save and Continue"**
5. **Scopes**: Click **"Save and Continue"** (we'll add scopes automatically)
6. **Test users**: Add your email address as a test user
7. Click **"Save and Continue"**

### 2.4 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
3. Select **"Web application"**
4. Name: `Unsubscribe Dashboard Web Client`

**⚠️ IMPORTANT - Authorized redirect URIs:**
Add these EXACT URIs (case-sensitive):

```
http://localhost:5173/login
```

**Why `localhost:5173` and not the server?**

- The frontend (React app) runs on port 5173
- Google redirects users back to the frontend after authentication
- The frontend then sends the auth code to the backend API
- The backend (port 3001) handles the token exchange internally

5. Click **"Create"**
6. **Copy your credentials:**
   - **Client ID**: Starts with something like `123456789-abc...googleusercontent.com`
   - **Client Secret**: A shorter string like `GOCSPX-abc123...`

---

## 🔑 Step 3: Generate JWT Secret

**Option 1: Using Node.js (Recommended)**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option 2: Using OpenSSL**

```bash
openssl rand -hex 64
```

**Option 3: Online Generator**
Visit [JWT.io](https://jwt.io/) and use their secret generator, or use any crypto generator for a 64-character hex string.

Example output: `a1b2c3d4e5f6...` (128 characters long)

---

## ⚙️ Step 4: Configure Environment Variables

Edit your `.env` file with your actual values:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_actual_client_secret_here

# Application URLs (Keep these as-is for local development)
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:5173/api

# Security - Replace with your generated JWT secret
JWT_SECRET=your_64_character_hex_string_here

# Optional: Analytics & Error Tracking (leave empty for now)
VITE_ANALYTICS_ID=
VITE_SENTRY_DSN=
```

### Example of a properly configured `.env`:

```env
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEf1234567890
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:5173/api
JWT_SECRET=a1b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

---

## 🚀 Step 5: Start the Application

**Start both frontend and backend:**

```bash
pnpm dev:full
```

You should see output like:

```
> concurrently "npm run dev:server" "npm run dev"

[0] 🚀 Server running on port 3001
[0] 📍 Environment: development
[1]
[1] ➜  Local:   http://localhost:5173/
[1] ➜  Network: use --host to expose
```

**Alternative - Start services separately:**

```bash
# Terminal 1 - Backend
pnpm dev:server

# Terminal 2 - Frontend
pnpm dev
```

---

## ✅ Step 6: Test the Application

1. **Open your browser** and go to `http://localhost:5173`

2. **You should see the login page** with a "Sign in with Google" button

3. **Click "Sign in with Google"**

   - You'll be redirected to Google's login page
   - Sign in with your Google account
   - Grant permissions to access Gmail
   - You should be redirected back to the dashboard

4. **Expected behavior:**
   - After login, you should see the dashboard with stats cards
   - The system will start fetching emails with unsubscribe links
   - You can search, filter, and interact with the email table

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### ❌ "Error: redirect_uri_mismatch"

**Problem**: Google OAuth redirect URI doesn't match
**Solution**:

- Check that your redirect URI in Google Console is exactly: `http://localhost:5173/login`
- No trailing slash, no additional paths
- Case-sensitive

#### ❌ "Client ID not found" or "Invalid client"

**Problem**: Wrong Client ID
**Solution**:

- Double-check your `VITE_GOOGLE_CLIENT_ID` in `.env`
- Make sure you copied the full Client ID including `.googleusercontent.com`
- Restart the development server after changing `.env`

#### ❌ "Gmail API has not been used"

**Problem**: Gmail API not enabled
**Solution**:

- Go to Google Cloud Console → APIs & Services → Library
- Search for "Gmail API" and enable it

#### ❌ "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen not configured
**Solution**:

- Complete the OAuth consent screen setup in Google Cloud Console
- Add your email as a test user
- Make sure all required fields are filled

#### ❌ "Failed to fetch emails"

**Problem**: Authentication or API issues
**Solution**:

- Check browser console for detailed error messages
- Verify Gmail API is enabled
- Try logging out and logging back in
- Check that your Google account has Gmail access

#### ❌ Backend connection errors

**Problem**: Frontend can't reach backend
**Solution**:

- Make sure both servers are running (`pnpm dev:full`)
- Check that backend is running on port 3001
- Verify the proxy configuration in `vite.config.ts`

#### ❌ "Module not found" errors

**Problem**: Dependencies not installed
**Solution**:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 🔒 Security Notes

1. **Never commit your `.env` file** - it's already in `.gitignore`
2. **Use a strong JWT secret** - minimum 64 characters
3. **For production**: Use different secrets and HTTPS URLs
4. **Gmail permissions**: The app only requests read access to your emails

---

## 🎯 Next Steps

Once everything is working:

1. **Explore the features:**

   - View inbox statistics
   - Search and filter emails
   - Click unsubscribe links to open in new tabs
   - Toggle dark/light mode

2. **Customize the app:**

   - Modify the theme in `src/contexts/ThemeContext.tsx`
   - Add additional email filters
   - Enhance the UI components

3. **Deploy to production:**
   - Set up hosting for frontend (Vercel, Netlify)
   - Deploy backend (Railway, Heroku, DigitalOcean)
   - Update OAuth redirect URIs for production domain

---

## 🆘 Still Having Issues?

If you're still having problems:

1. **Check the browser console** for error messages
2. **Check the terminal** for backend error logs
3. **Verify all environment variables** are set correctly
4. **Make sure both servers are running** on the correct ports
5. **Try the troubleshooting steps** above

Need more help? Create an issue in the repository with:

- Your error message
- Browser console logs
- Terminal output
- Steps you've already tried

---

**🎉 Congratulations!**

If you've made it this far, you should have a fully functional Unsubscribe Dashboard running locally. You can now manage your email subscriptions with ease!
