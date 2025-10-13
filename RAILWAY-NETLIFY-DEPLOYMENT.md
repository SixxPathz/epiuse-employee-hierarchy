# 🚀 Railway Backend + Netlify Frontend Deployment Guide

## Overview
- **Backend**: Railway (using your existing PostgreSQL)
- **Frontend**: Netlify
- **Database**: Your existing Railway PostgreSQL

---

## Step 1: Deploy Backend to Railway

### 1.1 Commit Your Code
```bash
git add .
git commit -m "Production ready - enhanced search, org chart, and UI improvements"
git push origin main
```

### 1.2 Create Railway Service
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository: `SixxPathz/epiuse-employee-hierarchy`
4. **Important**: Set **Root Directory** to `apps/backend`

### 1.3 Configure Environment Variables
In Railway dashboard → Your service → Variables tab:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
NEXTAUTH_SECRET=another_super_secret_key_minimum_32_characters_long
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-netlify-site.netlify.app
```

**Key Points**:
- `${{Postgres.DATABASE_URL}}` automatically connects to your existing PostgreSQL
- You'll update `FRONTEND_URL` after deploying to Netlify (Step 2)

### 1.4 Deploy & Get URL
- Railway will automatically build and deploy
- You'll get a URL like: `https://your-backend-abc123.up.railway.app`
- **Save this URL** - you'll need it for Netlify

---

## Step 2: Deploy Frontend to Netlify

### 2.1 Create Netlify Site
1. Go to [Netlify](https://app.netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect GitHub → Select `SixxPathz/epiuse-employee-hierarchy`

### 2.2 Configure Build Settings
- **Base directory**: `apps/frontend`
- **Build command**: `npm run build`
- **Publish directory**: `apps/frontend/.next`

### 2.3 Set Environment Variables
In Netlify → Site settings → Environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
NEXTAUTH_URL=https://your-netlify-site.netlify.app
NEXTAUTH_SECRET=same_secret_as_your_backend
```

### 2.4 Deploy & Get URL
- Netlify will build and deploy your frontend
- You'll get a URL like: `https://amazing-site-name.netlify.app`

---

## Step 3: Update Backend CORS (Important!)

After getting your Netlify URL, update Railway backend:

1. Go to Railway → Your backend service → Variables
2. Update `FRONTEND_URL` to your actual Netlify URL:
   ```
   FRONTEND_URL=https://your-actual-netlify-site.netlify.app
   ```
3. Railway will automatically redeploy with new CORS settings

---

## Step 4: Initialize Database (One-time)

Run migrations on your Railway database:

```bash
# In your local apps/backend directory
# First, get your Railway DATABASE_URL from the dashboard
# Update your local .env file temporarily

# Run migrations
npm run prisma:migrate

# Optional: Seed with sample data
npm run prisma:seed
```

---

## Step 5: Test Your Deployed App

1. **Visit your Netlify URL**
2. **Test login** - Register a new user (first user becomes ADMIN automatically)
3. **Test all features**:
   - Employee management (add/edit/delete)
   - Search functionality
   - Organization chart
   - Dashboard stats
   - Profile uploads

---

## Environment Variables Summary

### Railway Backend Variables:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your_32_char_secret
NEXTAUTH_SECRET=your_32_char_secret  
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-netlify-url.netlify.app
```

### Netlify Frontend Variables:
```env
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app
NEXTAUTH_URL=https://your-netlify-url.netlify.app
NEXTAUTH_SECRET=same_as_backend
```

---

## Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Make sure `FRONTEND_URL` in Railway matches your Netlify URL exactly
   - Include `https://` in the URL

2. **Database Connection Issues**
   - Verify `DATABASE_URL=${{Postgres.DATABASE_URL}}` in Railway
   - Run `npm run prisma:migrate` locally to set up tables

3. **Build Failures**
   - Check build logs in Railway/Netlify dashboards
   - Ensure `apps/backend` and `apps/frontend` directories are set correctly

4. **Authentication Issues**
   - Verify `NEXTAUTH_SECRET` is the same in both services
   - Check `NEXTAUTH_URL` points to your Netlify domain

### Check Deployment Status:
- **Railway**: `https://your-railway-url.up.railway.app/health`
- **Netlify**: Your main site URL should load the login page

---

## Post-Deployment Checklist

- [ ] Backend deploys successfully on Railway
- [ ] Frontend deploys successfully on Netlify  
- [ ] Database migrations completed
- [ ] CORS configured correctly
- [ ] Environment variables set in both services
- [ ] Test user registration and login
- [ ] Test all major features (search, org chart, CRUD)
- [ ] Mobile responsiveness works
- [ ] File uploads work (profile pictures)

Your EPI-USE Employee Management System is now live! 🎉

---

## URLs to Save:
- **Live App**: https://your-netlify-site.netlify.app
- **API Backend**: https://your-railway-backend.up.railway.app
- **Railway Dashboard**: https://railway.app/dashboard
- **Netlify Dashboard**: https://app.netlify.com/sites/your-site-name