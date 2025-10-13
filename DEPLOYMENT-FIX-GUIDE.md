# 🚀 EPI-USE Deployment Fix Guide

## Your Deployment URLs
- **Frontend (Netlify)**: https://epiuse-nexus.netlify.app/
- **Backend (Railway)**: https://epiuse-employee-hierarchy-production.up.railway.app/

## ✅ Configuration Files Updated
The following files have been updated with your Railway backend URL:
- `netlify.toml` - API proxy configuration
- `apps/frontend/public/_redirects` - Netlify redirects

## 🔧 Required Environment Variables

### Netlify Environment Variables
Go to: Netlify Dashboard → Site Settings → Environment Variables

Add these variables:
```
NEXT_PUBLIC_API_URL = https://epiuse-employee-hierarchy-production.up.railway.app
NEXTAUTH_URL = https://epiuse-nexus.netlify.app
NEXTAUTH_SECRET = 9f4a7c2e6b1d8f3a5c0e7d9b2a6f4c1e8d3b7a0f5c9e2d1b6a8f3c0e7d4b1a9f2
```

### Railway Environment Variables
Go to: Railway Dashboard → Your backend service → Variables

Update this variable:
```
FRONTEND_URL = https://epiuse-nexus.netlify.app
```

## 🌱 Seed Production Database

Run this command to create test users:
```bash
curl -X POST https://epiuse-employee-hierarchy-production.up.railway.app/api/admin/seed-production \
  -H "Content-Type: application/json" \
  -H "x-seed-secret: epiuse-seed-2025" \
  -d '{}'
```

## 🧪 Test Login Credentials

After seeding, use these credentials:
- **Admin**: `thabo.mthembu@epiuse.com` / `securepassword123`
- **Manager**: `sipho.ngcobo@epiuse.com` / `securepassword123`
- **Employee**: `kagiso.morake@epiuse.com` / `securepassword123`

## 🚀 Deploy Changes

```bash
git add .
git commit -m "Fix deployment configuration with correct URLs"
git push origin main
```

## 🔍 Testing Steps

1. **Test Backend Health**: https://epiuse-employee-hierarchy-production.up.railway.app/health
2. **Test Frontend**: https://epiuse-nexus.netlify.app/
3. **Test Login**: Try logging in with the test credentials
4. **Check Console**: Open browser dev tools and check for any errors

## 🎯 Expected Results

After completing these steps:
- ✅ Frontend loads without 404 errors
- ✅ Login form works properly
- ✅ Authentication succeeds
- ✅ Dashboard loads with employee data
- ✅ All features work as expected

## 🆘 Troubleshooting

If you still get errors:

1. **Check Environment Variables**: Make sure all variables are set correctly in both Netlify and Railway
2. **Check Build Logs**: Look at Netlify and Railway deployment logs for errors
3. **Clear Browser Cache**: Try incognito mode or clear browser cache
4. **Check Network Tab**: Use browser dev tools to see which requests are failing

Your EPI-USE Employee Management System should now work perfectly! 🎉
