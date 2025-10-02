# Authentication Setup Guide for Fincare

## 🎯 Overview

This guide explains how to set up and configure Supabase authentication for the Fincare application. After following these steps, users will be able to register, login, and access protected routes.

---

## 📋 Table of Contents

1. [Supabase Setup](#1-supabase-setup)
2. [Environment Variables](#2-environment-variables)
3. [Authentication Flow](#3-authentication-flow)
4. [Testing Authentication](#4-testing-authentication)
5. [Troubleshooting](#5-troubleshooting)
6. [Advanced Configuration](#6-advanced-configuration)

---

## 1. Supabase Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in
4. Click "New Project"
5. Fill in:
   - **Name**: `fincare` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project" (takes ~2 minutes)

### Step 2: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. **Email Auth** should be enabled by default
3. Configure Email Settings:
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation email (optional)

### Step 3: Disable Email Confirmation (For Development)

⚠️ **For development only** - skip email confirmation:

1. Go to **Authentication** → **Providers**
2. Scroll to **Email** provider
3. Toggle **OFF** "Confirm email"
4. Click **Save**

**For Production:** Keep email confirmation ON and configure SMTP settings.

### Step 4: Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)

---

## 2. Environment Variables

### Create `.env.local` file

In your project root (`/home/khanhngoo/Desktop/Fincare_New_version/frontend2/`), create `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API (if not already set)
GEMINI_API_KEY=your-gemini-api-key
```

**Replace with your actual values from Step 4 above!**

### Verify Environment Variables

```bash
# Check file exists
ls -la .env.local

# Should show something like:
# -rw-r--r-- 1 user user 250 Oct 2 12:00 .env.local
```

---

## 3. Authentication Flow

### How It Works

```
┌─────────────────────────────────────────────────┐
│  User visits /loan-form (protected route)      │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
            ┌─────────────────┐
            │  Authenticated?  │
            └────┬─────────┬───┘
                 │         │
            YES  │         │  NO
                 │         │
                 ▼         ▼
        ┌────────────┐  ┌──────────────────┐
        │ Allow      │  │ Redirect to      │
        │ Access     │  │ /login           │
        └────────────┘  └──────────────────┘
```

### Protected Routes

The following routes require authentication:
- `/loan-form` - Loan application form
- `/dashboard/*` - All dashboard pages
  - `/dashboard/loan-options`
  - `/dashboard/documents`
  - `/dashboard/analysis`

### Public Routes

These routes are accessible without login:
- `/` - Homepage
- `/login` - Login page
- `/register` - Registration page
- `/about` - About page
- `/how-it-works` - How it works page

---

## 4. Testing Authentication

### Manual Testing Steps

#### Test 1: Register New User

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser: `http://localhost:3000/register`

3. Fill in the form:
   - **Full Name**: John Doe
   - **Email**: john@example.com
   - **Password**: password123
   - **Confirm Password**: password123

4. Click "Create Account"

5. **Expected Result**:
   - ✅ Success message "Account Created!"
   - ✅ Auto-redirect to `/login` after 2 seconds

#### Test 2: Login

1. Go to: `http://localhost:3000/login`

2. Enter credentials:
   - **Email**: john@example.com
   - **Password**: password123

3. Click "Sign In"

4. **Expected Result**:
   - ✅ Redirect to `/loan-form`
   - ✅ User menu appears in navbar (shows initials/avatar)

#### Test 3: Protected Route Access

1. While logged in, visit: `http://localhost:3000/loan-form`
   - ✅ Should show loan form

2. Click "Log out" from user menu

3. Try to visit: `http://localhost:3000/loan-form`
   - ✅ Should redirect to `/login`
   - ✅ URL should include redirect parameter: `/login?redirect=/loan-form`

#### Test 4: Complete User Flow

1. **Register** → Login automatically
2. Fill out **Loan Form** → Submit
3. View **Loan Options** → Click "View Analysis"
4. Complete **Documents** → Enter data
5. View **Analysis** → See AI report

**All pages should work without "Unauthorized" errors!**

---

## 5. Troubleshooting

### Issue 1: "Unauthorized" Error on API Calls

**Symptoms:**
- Form submission shows "Unauthorized"
- API returns 401 status

**Solutions:**

1. **Check if logged in:**
   ```
   - Look for user menu in navbar
   - If not visible, login again
   ```

2. **Verify environment variables:**
   ```bash
   cat .env.local
   # Should show NEXT_PUBLIC_SUPABASE_URL and KEY
   ```

3. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Check browser cookies:**
   - Open DevTools → Application → Cookies
   - Look for `sb-*` cookies
   - If missing, login again

### Issue 2: "User Already Exists" on Registration

**Symptoms:**
- Registration fails with "An account with this email already exists"

**Solutions:**

1. **Use different email**, or

2. **Delete existing user** in Supabase:
   - Go to **Authentication** → **Users**
   - Find user with that email
   - Click "..." → "Delete User"
   - Try registering again

### Issue 3: Infinite Redirect Loop

**Symptoms:**
- Page keeps redirecting between `/login` and `/loan-form`

**Solutions:**

1. **Clear cookies:**
   - DevTools → Application → Cookies
   - Delete all `sb-*` cookies
   - Refresh page

2. **Check middleware configuration:**
   ```typescript
   // middleware.ts should have:
   const protectedRoutes = ['/loan-form', '/dashboard']
   const authRoutes = ['/login', '/register']
   ```

### Issue 4: Email Confirmation Required

**Symptoms:**
- After registration, can't login
- Says "Email not confirmed"

**Solutions:**

1. **Disable email confirmation** (Development only):
   - Supabase Dashboard → Authentication → Providers
   - Email → Toggle OFF "Confirm email"

2. **Or check spam folder** for confirmation email

3. **Or manually confirm** in Supabase:
   - Authentication → Users
   - Find user → Click "..." → "Send verification email"

### Issue 5: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls fail with network errors

**Solutions:**

1. **Check Supabase URL** in `.env.local`:
   ```
   Should be: https://xxxxx.supabase.co
   NOT: http://xxxxx.supabase.co (no http!)
   ```

2. **Add allowed origins** in Supabase:
   - Settings → API → URL Configuration
   - Add: `http://localhost:3000`

---

## 6. Advanced Configuration

### Email Templates Customization

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup** - Sent after registration
   - **Magic Link** - For passwordless login
   - **Change Email Address** - When user updates email
   - **Reset Password** - Forgot password flow

### Social Authentication (Optional)

Enable Google/Facebook/GitHub login:

1. **Authentication** → **Providers**
2. Click provider (e.g., Google)
3. Enter OAuth credentials
4. Update login page to include social buttons

### Row Level Security (RLS)

Already configured in `schema.sql`:

```sql
-- Users can only access their own loan applications
CREATE POLICY "Users can view own applications" ON loan_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON loan_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Session Management

Current settings:
- **Session duration**: 1 week (default)
- **Refresh token**: Auto-refresh enabled
- **Persistent sessions**: Yes (cookies)

To modify:
```typescript
// lib/supabase/client.ts
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
```

---

## 📁 Files Created for Authentication

### Pages:
```
✅ /app/login/page.tsx - Login page
✅ /app/register/page.tsx - Registration page
```

### Components:
```
✅ /components/auth/user-menu.tsx - User dropdown menu with logout
```

### Middleware:
```
✅ /middleware.ts - Route protection and auth checks
```

### Updated Files:
```
✅ /components/common/navbar.tsx - Added user menu
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env.local` to git
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically

### 2. Password Requirements
Current settings (in register page):
- Minimum 6 characters
- Can add complexity requirements:
  ```typescript
  // Add to password validation
  const hasUpperCase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*]/.test(password)
  ```

### 3. Rate Limiting
Supabase provides automatic rate limiting:
- Max 30 requests per hour for auth endpoints
- Configurable in dashboard

### 4. Email Verification (Production)
For production, **always enable email confirmation**:
1. Authentication → Providers → Email
2. Enable "Confirm email"
3. Configure SMTP settings (or use Supabase's default)

---

## 🎯 Quick Start Checklist

Follow this checklist to set up authentication:

- [ ] Create Supabase project
- [ ] Get Project URL and anon key
- [ ] Create `.env.local` with credentials
- [ ] Disable email confirmation (dev only)
- [ ] Restart dev server: `npm run dev`
- [ ] Test registration: `http://localhost:3000/register`
- [ ] Test login: `http://localhost:3000/login`
- [ ] Test protected route: `http://localhost:3000/loan-form`
- [ ] Test logout from user menu
- [ ] Submit loan form (should work without "Unauthorized")

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

## 🎊 Summary

**Authentication is now fully configured!**

✅ **Login/Register pages** created
✅ **Protected routes** with middleware
✅ **User menu** with logout
✅ **Session management** automatic
✅ **Error handling** complete

**Next Steps:**
1. Follow the setup checklist above
2. Test all authentication flows
3. Configure email templates (optional)
4. Enable email confirmation for production

**Your Fincare app is now ready for authenticated users!** 🚀

---

**Last Updated:** 2025-10-02
**Status:** ✅ Complete
