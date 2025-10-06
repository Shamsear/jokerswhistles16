# 🚀 Deployment Guide

## Quick Deployment to Vercel (5 minutes)

### Prerequisites
- [x] GitHub account
- [x] Vercel account (free at vercel.com)
- [x] Neon database created

---

## Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Complete tournament system ready for deployment"

# Create GitHub repository and push
git branch -M main
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `prisma generate && next build`
   - **Install Command**: `npm install`

5. Add **Environment Variables**:
   ```
   DATABASE_URL=your-neon-connection-string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=generate-random-secret-here
   ```

6. Click **"Deploy"**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts and add environment variables
```

---

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Variables:

**DATABASE_URL**
```
postgresql://username:password@host.neon.tech/database?sslmode=require
```
Get this from your Neon dashboard.

**NEXTAUTH_URL**
```
https://your-app-name.vercel.app
```
Use your actual Vercel deployment URL.

**NEXTAUTH_SECRET**
```
Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 4: Database Migration

After deployment, your database should already be set up (Prisma schema was pushed during development).

If you need to push schema changes:

```bash
# Run locally with production database
DATABASE_URL="your-neon-url" npx prisma db push

# Or from Vercel terminal
vercel env pull
npx prisma db push
```

---

## Step 5: Test Your Deployment

### Verify URLs:
- **Homepage**: `https://your-app.vercel.app`
- **Admin**: `https://your-app.vercel.app/admin`
- **Player Info**: `https://your-app.vercel.app/player`
- **Registration**: `https://your-app.vercel.app/register?token=xxx`

### Test Flow:
1. Visit admin panel
2. Create tournament
3. Generate registration link
4. Open registration link
5. Register a player
6. Verify player appears in admin

---

## Troubleshooting

### Build Fails

**Issue**: `Prisma Client not generated`

**Solution**:
```bash
# Add to package.json scripts:
"postinstall": "prisma generate"
```

---

### Database Connection Error

**Issue**: `Can't reach database server`

**Solution**:
- Verify DATABASE_URL in Vercel environment variables
- Ensure `?sslmode=require` is in the connection string
- Check Neon database is active

---

### API Routes Return 500

**Issue**: Server errors on API calls

**Solution**:
- Check Vercel function logs
- Verify all environment variables are set
- Ensure Prisma client is generated

---

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update NEXTAUTH_URL to your custom domain

---

## Monitoring

### Vercel Dashboard Provides:
- Real-time logs
- Performance metrics
- Error tracking
- Deployment history

### Access Logs:
```bash
vercel logs your-app-name
```

---

## Updating Your Deployment

```bash
# Make changes locally
git add .
git commit -m "Update description"
git push

# Vercel auto-deploys on push
```

---

## Environment-Specific Configurations

### Development
```bash
npm run dev
# Uses .env.local
```

### Production
```bash
npm run build
npm run start
# Uses Vercel environment variables
```

---

## Performance Optimization

### Already Configured:
- ✅ Server-side rendering
- ✅ Image optimization
- ✅ Code splitting
- ✅ Caching headers

### Recommended:
- Enable Vercel Analytics
- Set up error tracking (Sentry)
- Configure CDN caching

---

## Security Checklist

Before going live:
- [ ] Change default admin credentials
- [ ] Use strong NEXTAUTH_SECRET
- [ ] Enable HTTPS only
- [ ] Validate all environment variables
- [ ] Test registration link expiration
- [ ] Review API rate limiting needs

---

## Scaling Considerations

### Neon Database:
- Free tier: Good for testing
- Pro tier: Recommended for 100+ players
- Consider connection pooling for high traffic

### Vercel:
- Free tier: Good for tournaments up to 1000 matches/month
- Pro tier: Unlimited builds and bandwidth

---

## Backup Strategy

### Database Backups:
```bash
# Export data
npx prisma db pull

# Neon automatic backups:
# - Free tier: 7 days retention
# - Pro tier: 30 days retention
```

---

## Cost Estimate

### Free Tier Setup:
- **Vercel**: Free (100GB bandwidth, unlimited builds)
- **Neon**: Free (3GB storage, 0.5GB compute)
- **Total**: $0/month

### Production Setup:
- **Vercel Pro**: $20/month
- **Neon Pro**: $19/month  
- **Total**: ~$39/month

---

## Success! 🎉

Your tournament system is now live and ready for real tournaments!

**Next Steps:**
1. Share registration links with players
2. Monitor Vercel dashboard for any issues
3. Collect feedback from first tournament
4. Iterate and improve

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Neon database status
3. Verify all environment variables
4. Check the documentation files

---

**Deployed!** 🚀 Start running tournaments immediately!
