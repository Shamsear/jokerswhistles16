# ✅ Quick Deployment Checklist

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Install Vercel CLI (Optional)

```powershell
npm install -g vercel
```

### Step 2: Login to Vercel

```powershell
vercel login
```

### Step 3: Deploy

```powershell
# Make sure you're in the project directory
cd "C:\Drive d\html\task19\jokers-whistle-tournament"

# Deploy to production
vercel --prod
```

### Step 4: Set Environment Variable

When prompted or after deployment:

```powershell
vercel env add DATABASE_URL
```

Paste your Neon database URL when asked.

### Step 5: Redeploy (if needed)

```powershell
vercel --prod
```

---

## 🌐 Alternative: Deploy via GitHub

### 1. Push to GitHub

```powershell
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Import your repository
3. Add environment variable: `DATABASE_URL`
4. Click Deploy

---

## 🔧 Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |

**Get your DATABASE_URL from:**
- Neon Dashboard → Connection String
- Use the **pooled connection** for better performance

---

## ✅ Pre-Flight Check

Run these before deploying:

```powershell
# Test build locally
npm run build

# Check for errors
npm run lint

# Test production mode
npm start
```

---

## 📊 After Deployment

Your app will be live at: `https://your-project.vercel.app`

Test these pages:
- ✅ Home: `/`
- ✅ Fixtures: `/fixtures`
- ✅ Leaderboard: `/leaderboard`
- ✅ Admin: `/admin/login`
- ✅ API: `/api/tournaments`

---

## 🆘 Common Issues

**Build fails with Prisma error:**
```powershell
# Solution: Ensure postinstall script exists in package.json
"postinstall": "prisma generate"
```

**Database connection error:**
- Check DATABASE_URL is set in Vercel
- Ensure Neon allows connections from 0.0.0.0/0
- Use pooled connection string

**404 errors:**
- Wait 1-2 minutes for deployment to complete
- Clear cache and refresh
- Check deployment logs in Vercel dashboard

---

## 🎉 Success!

Once deployed, your tournament app is live and ready to use!

**Share your URL** with your tournament participants! 🏆
