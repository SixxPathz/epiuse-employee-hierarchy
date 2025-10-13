# 🚨 Deployment Troubleshooting Guide

## Current Issues & Solutions

### 1. **404 Error on Login**
**Problem**: Frontend can't reach backend API endpoints
**Solution**: Update API URLs in deployment configuration

### 2. **Environment Variables Missing**
**Problem**: `NEXT_PUBLIC_API_URL` not set in Netlify
**Solution**: Configure environment variables in both services

### 3. **CORS Errors**
**Problem**: Backend not allowing requests from Netlify domain
**Solution**: Update CORS configuration and FRONTEND_URL

---

## 🔧 Step-by-Step Fix

### Step 1: Get Your Actual URLs

1. **Railway Backend URL**: 
   - Go to Railway Dashboard → Your backend service
   - Copy the URL (looks like: `https://epiuse-backend-production-abc123.up.railway.app`)

2. **Netlify Frontend URL**:
   - Go to Netlify Dashboard → Your site
   - Copy the URL (looks like: `https://amazing-site-name.netlify.app`)

### Step 2: Update Netlify Configuration

1. **Update `netlify.toml`**:
   ```toml
   # Replace with your actual Railway URL
   [[redirects]]
     from = "/api/*"
     to = "https://YOUR-ACTUAL-RAILWAY-URL.up.railway.app/api/:splat"
     status = 200
     force = true
   ```

2. **Set Environment Variables in Netlify**:
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add these variables:
   ```
   NEXT_PUBLIC_API_URL = https://YOUR-ACTUAL-RAILWAY-URL.up.railway.app
   NEXTAUTH_URL = https://YOUR-ACTUAL-NETLIFY-URL.netlify.app
   NEXTAUTH_SECRET = 9f4a7c2e6b1d8f3a5c0e7d9b2a6f4c1e8d3b7a0f5c9e2d1b6a8f3c0e7d4b1a9f2
   ```

### Step 3: Update Railway Configuration

1. **Update Environment Variables in Railway**:
   - Go to Railway Dashboard → Your backend service → Variables
   - Update `FRONTEND_URL`:
   ```
   FRONTEND_URL = https://YOUR-ACTUAL-NETLIFY-URL.netlify.app
   ```

### Step 4: Seed Production Database

Run this command to create test users:
```bash
curl -X POST https://YOUR-ACTUAL-RAILWAY-URL.up.railway.app/api/admin/seed-production \
  -H "Content-Type: application/json" \
  -H "x-seed-secret: epiuse-seed-2025" \
  -d '{}'
```

### Step 5: Test Login Credentials

After seeding, use these credentials:
- **Admin**: `thabo.mthembu@epiuse.com` / `securepassword123`
- **Manager**: `sipho.ngcobo@epiuse.com` / `securepassword123`
- **Employee**: `kagiso.morake@epiuse.com` / `securepassword123`

---

## 🔍 Debugging Steps

### Check Backend Health
Visit: `https://YOUR-RAILWAY-URL.up.railway.app/health`
Should return: `{"status": "OK", "timestamp": "..."}`

### Check Frontend Build
1. Go to Netlify Dashboard → Deploys
2. Check build logs for errors
3. Verify all files are in the `out` directory

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Look for failed requests (red entries)
5. Check Console tab for JavaScript errors

### Common Error Messages

**"Failed to load resource: 404"**
- API URL not configured correctly
- Backend not deployed or wrong URL

**"CORS error"**
- FRONTEND_URL not set in Railway
- Netlify URL doesn't match Railway CORS settings

**"Invalid credentials"**
- Database not seeded
- Wrong email/password combination

**"Login error: Z"**
- This is likely a browser extension issue
- Try in incognito mode
- Disable browser extensions temporarily

---

## 🚀 Quick Fix Commands

### Update URLs in Files
```bash
# Replace YOUR-RAILWAY-URL with actual Railway URL
# Replace YOUR-NETLIFY-URL with actual Netlify URL

# Update netlify.toml
sed -i 's/your-actual-railway-url/YOUR-ACTUAL-RAILWAY-URL/g' netlify.toml

# Update _redirects
sed -i 's/your-actual-railway-url/YOUR-ACTUAL-RAILWAY-URL/g' apps/frontend/public/_redirects
```

### Redeploy
```bash
git add .
git commit -m "Fix deployment URLs and CORS configuration"
git push origin main
```

---

## 📞 Support Checklist

Before asking for help, verify:
- [ ] Railway backend is running (health check works)
- [ ] Netlify frontend is deployed (site loads)
- [ ] Environment variables are set in both services
- [ ] Database is seeded with test users
- [ ] URLs are correctly configured (no placeholders)
- [ ] CORS is configured for your Netlify domain

---

## 🎯 Expected Result

After completing these steps:
1. ✅ Frontend loads without 404 errors
2. ✅ Login form works
3. ✅ Authentication succeeds
4. ✅ Dashboard loads with employee data
5. ✅ All features work as expected

Your EPI-USE Employee Management System should be fully functional! 🎉
