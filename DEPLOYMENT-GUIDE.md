# 🚀 EPI-USE Employee Management System - Complete Deployment Guide

## Table of Contents
1. [Quick Start (Vercel + Railway)](#quick-start)
2. [DigitalOcean Deployment](#digitalocean)
3. [AWS Deployment](#aws)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Troubleshooting](#troubleshooting)

## Quick Start (Vercel + Railway) - Recommended

### Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free tier)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/epiuse-employee-hierarchy.git
git push -u origin main
```

### Step 2: Database Setup (Free PostgreSQL)
1. Go to [Neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Create project: "epiuse-employee-db"
4. Copy connection string: `postgresql://user:pass@ep-xyz.region.aws.neon.tech/neondb`

### Step 3: Deploy Backend (Railway)
1. Visit [Railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory: `apps/backend`
5. Add environment variables:
```
DATABASE_URL=your_neon_postgresql_connection_string
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
NODE_ENV=production
NEXTAUTH_SECRET=another_super_secret_key_at_least_32_characters
PORT=5000
```
6. Deploy! You'll get a URL like: `https://your-app.up.railway.app`

### Step 4: Initialize Database
```bash
# In your local apps/backend directory
# Update .env with your Neon DATABASE_URL
npm run prisma:migrate
npm run prisma:seed
```

### Step 5: Deploy Frontend (Vercel)
1. Visit [Vercel.com](https://vercel.com)
2. "New Project" → Import from GitHub
3. Set root directory: `apps/frontend`
4. Add environment variables:
```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=same_secret_as_backend
```
5. Deploy! Your app will be live at: `https://your-app.vercel.app`

### Step 6: Create Admin User
Visit your deployed app and register the first user - they'll automatically be assigned ADMIN role.

---

## DigitalOcean Deployment (More Control)

### Step 1: Create Droplet
- Ubuntu 22.04 LTS
- Minimum: 2GB RAM, 1 CPU ($12/month)
- Add your SSH key

### Step 2: Server Setup
```bash
# SSH into droplet
ssh root@your_droplet_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install process manager and web server
npm install -g pm2
apt install nginx -y

# Install Git
apt install git -y
```

### Step 3: Database Configuration
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE epiuse_employee_db;
CREATE USER epiuse_user WITH ENCRYPTED PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE epiuse_employee_db TO epiuse_user;
ALTER USER epiuse_user CREATEDB;
\q

# Configure PostgreSQL for local connections
echo "local all epiuse_user md5" >> /etc/postgresql/14/main/pg_hba.conf
systemctl restart postgresql
```

### Step 4: Application Deployment
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/epiuse-employee-hierarchy.git
cd epiuse-employee-hierarchy

# Backend setup
cd apps/backend
npm install --production
npm run build

# Create production environment
cat > .env << EOF
DATABASE_URL="postgresql://epiuse_user:SecurePassword123!@localhost:5432/epiuse_employee_db"
JWT_SECRET="your_super_secret_jwt_key_minimum_32_characters_long"
NODE_ENV="production"
NEXTAUTH_SECRET="another_super_secret_key_minimum_32_characters_long"
PORT=5000
EOF

# Database migrations and seeding
npm run prisma:migrate
npm run prisma:seed

# Start backend with PM2
pm2 start dist/server.js --name "epiuse-backend"

# Frontend setup
cd ../frontend
npm install --production

# Create production environment
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET="same_secret_as_backend"
EOF

npm run build
pm2 start npm --name "epiuse-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup ubuntu
```

### Step 5: Nginx Configuration
```bash
# Create Nginx site configuration
cat > /etc/nginx/sites-available/epiuse << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # File uploads
    client_max_body_size 10M;
}
EOF

# Enable site
rm /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/epiuse /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 6: SSL Certificate (Free)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
certbot renew --dry-run

# Add to crontab for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

### Step 7: Firewall Setup
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

## AWS Deployment (Production Scale)

### Step 1: AWS Services Setup
1. **RDS PostgreSQL Database**
   - Create RDS PostgreSQL instance
   - Note connection details

2. **EC2 Instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)

3. **S3 Bucket** (for file uploads)
   - Create S3 bucket for profile pictures
   - Configure CORS

### Step 2: EC2 Instance Setup
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Follow DigitalOcean steps 2-4 but use RDS connection string
DATABASE_URL="postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/epiuse_db"
```

### Step 3: Load Balancer & Auto Scaling (Optional)
- Set up Application Load Balancer
- Configure Auto Scaling Group
- Use CloudFormation or Terraform for infrastructure as code

---

## Environment Variables Reference

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Security
JWT_SECRET="your_super_secret_jwt_key_minimum_32_characters"
NEXTAUTH_SECRET="another_super_secret_key_minimum_32_characters"

# Environment
NODE_ENV="production"
PORT=5000

# Optional
AI_API_KEY="your_ai_api_key_if_needed"
```

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL="https://your-backend-domain.com"

# Authentication
NEXTAUTH_URL="https://your-frontend-domain.com"
NEXTAUTH_SECRET="same_secret_as_backend"

# Optional
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
```

---

## Database Setup Scripts

### Create First Admin User (SQL)
```sql
-- Connect to your database and run:
INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'admin@epiuse.com',
  '$2a$12$encrypted_password_hash',
  'ADMIN',
  NOW(),
  NOW()
);
```

### Or use the built-in script:
```bash
cd apps/backend
npm run prisma:seed
```

---

## Post-Deployment Checklist

### ✅ Functionality Testing
1. [ ] User registration/login works
2. [ ] Employee CRUD operations
3. [ ] Search functionality
4. [ ] Organization chart displays
5. [ ] File uploads work
6. [ ] Role-based permissions
7. [ ] Data export functionality

### ✅ Security Checklist
1. [ ] HTTPS enabled
2. [ ] Strong JWT secrets (32+ characters)
3. [ ] Database credentials secure
4. [ ] File upload restrictions
5. [ ] Rate limiting enabled
6. [ ] CORS properly configured

### ✅ Performance Checklist
1. [ ] Database indexes created
2. [ ] Static files cached
3. [ ] Gzip compression enabled
4. [ ] Image optimization
5. [ ] Database connection pooling

---

## Monitoring & Maintenance

### Set up monitoring:
```bash
# Install monitoring tools
npm install -g pm2
pm2 install pm2-server-monit

# View logs
pm2 logs
pm2 monit
```

### Backup strategy:
```bash
# Database backup script
#!/bin/bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is running
   systemctl status postgresql
   
   # Check connection
   psql $DATABASE_URL
   ```

2. **Build Errors**
   ```bash
   # Clear caches
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Permission Errors**
   ```bash
   # Fix file permissions
   chown -R $USER:$USER /path/to/app
   chmod -R 755 /path/to/app
   ```

4. **PM2 Process Issues**
   ```bash
   # Restart processes
   pm2 restart all
   
   # Delete and recreate
   pm2 delete all
   pm2 start ecosystem.json
   ```

---

## Support

For deployment support:
- Check application logs: `pm2 logs`
- Database logs: `tail -f /var/log/postgresql/postgresql-14-main.log`
- Nginx logs: `tail -f /var/log/nginx/error.log`

Contact your development team with specific error messages and logs.