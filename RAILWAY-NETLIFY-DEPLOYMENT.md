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

#### Step-by-Step Railway Setup:

1. **Go to Railway Dashboard**: Open https://railway.app in your browser
2. **Sign in**: Use your GitHub account to sign in
3. **Create New Project**: 
   - Click the big **"New Project"** button
   - Select **"Deploy from GitHub repo"**
   
4. **Select Repository**:
   - Find and click on `SixxPathz/epiuse-employee-hierarchy`
   - Railway will start importing your repository

5. **Configure Service** (CRITICAL STEP):
   - After import, Railway will show your project dashboard
   - You'll see a service created (might be called "epiuse-employee-hierarchy")
   - **Click on your service** to open its settings
   
6. **Set Root Directory** (THIS IS THE KEY STEP):
   - In your service dashboard, look for **"Settings"** tab at the top
   - Click **"Settings"**
   - Scroll down to find **"Source"** section
   - Look for **"Root Directory"** field
   - **Enter exactly**: `apps/backend`
   - Click **"Save"** or it might auto-save
   
7. **Verify Configuration**:
   - Go back to the **"Deployments"** tab
   - Railway should now rebuild using only the backend folder
   - The build logs should show it's working in `/apps/backend`

### 1.3 Configure Environment Variables

#### Step-by-Step Environment Setup:

1. **Access Variables**:
   - In your Railway service dashboard, click the **"Variables"** tab
   - You'll see a form to add new environment variables

2. **Add Each Variable** (Click "Add Variable" for each one):

```env
DATABASE_URL=postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway
JWT_SECRET=c8f2d7a1e5b3f6c9d4a8b0e1f7c3d2a5b9e6f1d0c4a7b3e8f2d1c6a9b0e5f3d7
NEXTAUTH_SECRET=9f4a7c2e6b1d8f3a5c0e7d9b2a6f4c1e8d3b7a0f5c9e2d1b6a8f3c0e7d4b1a9f2
NODE_ENV=production
PORT=5000
AI_API_KEY=AdvYMJkv1vO5NKws64vw1IDjdekQvLgQ
AI_AGENT_URL=https://yf3setptzah4zwyou2rr2now.agents.do-ai.run
EMAIL_USER=dsandile58@gmail.com
EMAIL_APP_PASSWORD=wjnvuguhbqcdpnde
FRONTEND_URL=https://your-netlify-site.netlify.app
```

3. **How to Add Each Variable**:
   - Variable Name: `DATABASE_URL`
   - Variable Value: `postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway`
   - Click "Add"
   
   - Variable Name: `JWT_SECRET`
   - Variable Value: `c8f2d7a1e5b3f6c9d4a8b0e1f7c3d2a5b9e6f1d0c4a7b3e8f2d1c6a9b0e5f3d7`
   - Click "Add"
   
   *(Repeat for all variables above)*

**Important Notes**:
- Use your existing DATABASE_URL (Railway PostgreSQL connection)
- Change `NODE_ENV` from `development` to `production`
- You'll update `FRONTEND_URL` after deploying to Netlify (Step 2)
- All your existing secrets and API keys are preserved

### 1.4 Deploy & Get URL
- Railway will automatically build and deploy
- You'll get a URL like: `https://your-backend-abc123.up.railway.app`
- **Save this URL** - you'll need it for Netlify

---

## Step 2: Deploy Frontend to Netlify

### 2.1 Create Netlify Site

#### Step-by-Step Netlify Setup:

1. **Go to Netlify**: Open https://app.netlify.com in your browser
2. **Sign In**: Use your GitHub account to sign in
3. **Create New Site**:
   - Click **"Add new site"** button
   - Select **"Import an existing project"**
4. **Connect GitHub**:
   - Click **"Deploy with GitHub"**
   - Find and select `SixxPathz/epiuse-employee-hierarchy`
   - Click on your repository

### 2.2 Configure Build Settings

#### CRITICAL: Set These Exact Settings:

1. **Site Settings Form** (you'll see this after selecting your repo):
   - **Owner**: SixxPathz (auto-selected)
   - **Branch to deploy**: `main` (auto-selected)
   
2. **Build Settings** (VERY IMPORTANT):
   - **Base Directory**: `apps/frontend` ⚠️ Type this exactly
   - **Build Command**: `npm run build`
   - **Publish Directory**: `apps/frontend/out` ⚠️ Type this exactly (NOT .next)
   
3. **Click "Deploy Site"** (don't worry about environment variables yet)

### 2.3 Set Environment Variables

#### After Initial Deployment:

1. **Get Your Backend URL**: 
   - Go back to Railway dashboard
   - Copy your backend URL (looks like: `https://your-backend-abc123.up.railway.app`)

2. **Configure Netlify Variables**:
   - In Netlify dashboard, go to **"Site settings"**
   - Click **"Environment variables"** in the left sidebar
   - Click **"Add variable"** for each:

```env
NEXT_PUBLIC_API_URL=https://your-actual-railway-backend-url.up.railway.app
NEXTAUTH_URL=https://your-actual-netlify-site.netlify.app
NEXTAUTH_SECRET=9f4a7c2e6b1d8f3a5c0e7d9b2a6f4c1e8d3b7a0f5c9e2d1b6a8f3c0e7d4b1a9f2
```

3. **Replace URLs with Your Actual URLs**:
   - Replace `your-actual-railway-backend-url` with your Railway URL
   - Replace `your-actual-netlify-site` with your Netlify URL

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

### 4.1 Seed Production Database

After Railway deployment completes, seed your production database with test users:

```bash
# Replace YOUR-RAILWAY-URL with your actual Railway backend URL
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/admin/seed-production \
  -H "Content-Type: application/json" \
  -H "x-seed-secret: epiuse-seed-2025" \
  -d '{}'
```

### 4.2 Test Login Credentials

After seeding, you can log in with these accounts:

| **Role** | **Email** | **Password** | **Access Level** |
|----------|-----------|--------------|------------------|
| **Admin** | `admin@epiuse.com` | `securepassword123` | Full admin access |
| **CEO** | `thabo.mthembu@epiuse.com` | `securepassword123` | Admin access |
| **Manager** | `sipho.ngcobo@epiuse.com` | `securepassword123` | Manager access |
| **Employee** | `kagiso.morake@epiuse.com` | `securepassword123` | Employee access |

### 4.3 Alternative: Local Migration (Advanced)

If you prefer to run migrations locally:

```bash
# In your local apps/backend directory
# First, get your Railway DATABASE_URL from the dashboard
# Update your local .env file temporarily

# Run migrations
npm run prisma:migrate

# Seed with sample data
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
DATABASE_URL=postgresql://postgres:WIlbTptekRaSpDPGxUPxrDGpeSFDhlVS@switchyard.proxy.rlwy.net:11405/railway
JWT_SECRET=c8f2d7a1e5b3f6c9d4a8b0e1f7c3d2a5b9e6f1d0c4a7b3e8f2d1c6a9b0e5f3d7
NEXTAUTH_SECRET=9f4a7c2e6b1d8f3a5c0e7d9b2a6f4c1e8d3b7a0f5c9e2d1b6a8f3c0e7d4b1a9f2
NODE_ENV=production
PORT=5000
AI_API_KEY=AdvYMJkv1vO5NKws64vw1IDjdekQvLgQ
AI_AGENT_URL=https://yf3setptzah4zwyou2rr2now.agents.do-ai.run
EMAIL_USER=dsandile58@gmail.com
EMAIL_APP_PASSWORD=wjnvuguhbqcdpnde
FRONTEND_URL=https://your-actual-netlify-url.netlify.app
```

### Netlify Frontend Variables:
```env
NEXT_PUBLIC_API_URL=https://your-actual-railway-url.up.railway.app
NEXTAUTH_URL=https://your-actual-netlify-url.netlify.app
NEXTAUTH_SECRET=9f4a7c2e6b1d8f3a5c0e7d9b2a6f4c1e8d3b7a0f5c9e2d1b6a8f3c0e7d4b1a9f2
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

## Step 6: Update CORS Configuration

Before going live, update your backend CORS settings:

### 6.1 Update Backend CORS
In `apps/backend/src/app.ts`, update the CORS configuration:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000', // Development
    process.env.FRONTEND_URL!, // Production Netlify URL
  ],
  credentials: true
}));
```

## Step 7: Database Migration & Verification

### 7.1 Verify Migrations Ran
After Railway deployment:
1. Check Railway service logs for migration messages
2. Go to Railway PostgreSQL → Data tab
3. Verify tables exist: `User`, `Employee`, `_prisma_migrations`

### 7.2 Manual Migration (if needed)
If migrations didn't run automatically:
1. In Railway dashboard → your backend service
2. Add environment variable: `RUN_MIGRATIONS=true`
3. Trigger a new deployment

## Step 8: Testing Your Deployment

### 8.1 Backend Health Check
Visit: `https://your-railway-url.up.railway.app/health`
Should return: `{"status": "ok", "database": "connected"}`

### 8.2 Frontend Testing
1. Visit your Netlify URL
2. Test login functionality
3. Check employee table loads
4. Test organization chart
5. Verify search works
6. Check browser console for errors

### 8.3 API Testing
```bash
# Test health endpoint
curl https://your-railway-url.up.railway.app/health

# Test authentication
curl -X POST https://your-railway-url.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"your-password"}'
```

## Step 9: Troubleshooting Common Issues

### Backend Issues
- **Database connection errors**: Verify DATABASE_URL in Railway
- **CORS errors**: Update FRONTEND_URL to match Netlify domain
- **Migration errors**: Check Prisma schema syntax

### Frontend Issues
- **API calls fail**: Verify NEXT_PUBLIC_API_URL points to Railway
- **Auth errors**: Ensure NEXTAUTH_SECRET matches backend
- **Build failures**: Check TypeScript errors in Netlify logs

### Quick Fixes
```bash
# If you need to redeploy quickly
git add .
git commit -m "Fix deployment issue"
git push origin main
```

## Step 10: Post-Deployment Checklist

### ✅ Verify Everything Works
- [ ] Backend health endpoint responds
- [ ] Database tables created and accessible
- [ ] User authentication works
- [ ] Employee data displays correctly
- [ ] Organization chart renders
- [ ] Search functionality works
- [ ] File uploads work (profile pictures)
- [ ] Role-based permissions function
- [ ] Mobile responsiveness

### ✅ Security & Performance
- [ ] HTTPS enabled on both domains
- [ ] Environment variables secure
- [ ] Database access restricted
- [ ] API rate limiting configured
- [ ] Error handling working

Your EPI-USE Employee Management System is now live! 🎉

---

## Important URLs to Save

- **Live Application**: https://your-netlify-site.netlify.app
- **API Backend**: https://your-railway-backend.up.railway.app  
- **Railway Dashboard**: https://railway.app/dashboard
- **Netlify Dashboard**: https://app.netlify.com/sites/your-site-name
- **PostgreSQL Database**: Available in Railway PostgreSQL service

## Next Steps After Deployment

1. **Monitor Performance**: Check Railway and Netlify analytics
2. **Set Up Alerts**: Configure notifications for downtime
3. **Regular Backups**: Railway handles this automatically
4. **Security Updates**: Keep dependencies updated
5. **User Training**: Prepare documentation for end users

## Support & Maintenance

- **Logs**: Check Railway service logs for backend issues
- **Analytics**: Use Netlify analytics for frontend insights  
- **Updates**: Use `git push` to deploy updates automatically
- **Scaling**: Railway auto-scales based on usage

Your employee hierarchy application is ready for production use!