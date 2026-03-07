# DEPLOYMENT CHECKLIST - AI Grievance Portal

✅ **All fixes applied. Follow this step-by-step guide to deploy.**

---

## Backend Deployment (API Server)

### Step 1: Deploy Backend to Vercel

```bash
cd backend
npm install
vercel login  # If not logged in
```

Choose to:
- Create a **new project**
- **Set root directory to `backend`**

**Add environment variables in Vercel dashboard:**
- `MONGODB_URI` = Your MongoDB connection string
- `EMAIL_USER` = Your Gmail address
- `EMAIL_PASSWORD` = 16-character App Password (from myaccount.google.com/apppasswords)

```bash
vercel --prod
```

**Save the backend URL** (e.g., `https://ai-grievance-backend.vercel.app`)

---

## Frontend Deployment

### Step 2: Configure Frontend with Backend URL

Create or update `frontend/.env.local`:
```env
VITE_API_URL=https://your-backend-url.vercel.app
VITE_GEMINI_API_KEY=your-gemini-api-key-from-aistudio.google.com
```

### Step 3: Build & Deploy Frontend

```bash
cd frontend
npm install
npm run build          # Verify build completes
vercel --prod          # Deploy
```

**Or use GitHub integration:**
1. Push to GitHub: `git push origin main`
2. Go to https://vercel.com/new
3. Import repo → select `frontend` as root directory
4. Add same environment variables
5. Deploy

---

## ✅ What's Been Fixed

| Issue | Solution |
|-------|----------|
| Blank screen on frontend | ✅ Removed importmap from index.html |
| Hardcoded URLs | ✅ Created config.ts, updated api.ts, LodgeComplaint.tsx |
| Missing env management | ✅ Created .env.example for both frontend & backend |
| Gemini API initialization fails | ✅ Added lazy init & fallback keyword matching |
| No deployment guides | ✅ Added comprehensive README & this checklist |
| Build errors on Vercel | ✅ Fixed vite.config.ts, added vercel.json files |

---

## 🔧 How to Test Locally First

```bash
# Terminal 1: Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB & email credentials
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
cat > .env.local << EOF
VITE_API_URL=http://localhost:4000
VITE_GEMINI_API_KEY=your_api_key
EOF
npm install
npm run dev
```

Visit `http://localhost:3000` and test:
1. Lodge a complaint
2. Verify email is received (if configured)
3. Track complaint by ID
4. Test chatbot (if Gemini key set)

---

## 📋 Environment Variables Summary

### Backend (backend/.env or Vercel settings)

```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/grievance-portal
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
PORT=4000
```

### Frontend (frontend/.env.local or Vercel settings)

```env
VITE_API_URL=https://your-backend-url.vercel.app
VITE_GEMINI_API_KEY=your-gemini-key-from-aistudio
```

---

## 🚨 Troubleshooting Deployment

### Backend shows "Cannot read properties of undefined (reading 'fsPath')"
- ✅ FIXED: Updated vercel.json and wrapped index.js listen call
- Ensure `backend/vercel.json` exists and points to `api/server.js`

### Frontend shows blank page
- ✅ FIXED: Removed importmap from index.html
- Check `VITE_API_URL` in environment variables
- Open browser DevTools (F12) → Console for errors

### "VITE_API_URL not set"
- Create `frontend/.env.local` with the variable
- Or add to Vercel Environment Variables

### Email not sending
- Verify `EMAIL_USER` & `EMAIL_PASSWORD` in backend env
- Check that Gmail 2FA is enabled and App Password is correct
- Verify backend receives POST requests from frontend

### Gemini AI features not working
- Get free API key from https://aistudio.google.com/app/apikeys
- Add `VITE_GEMINI_API_KEY` to frontend environment
- Check browser console for API errors
- Priority prediction has keyword-based fallback

---

## 📊 Current URLs

**Backend:** https://ai-grievance-portal-qors.vercel.app/  
**Frontend:** (Deploy yours and paste URL here)

---

## ✨ Next Steps

1. **Deploy Backend** (if not done)
2. **Configure Frontend** with backend URL
3. **Deploy Frontend**
4. **Test the live app** - try lodging a complaint
5. **Monitor Vercel logs** for any errors
6. **Set up monitoring** - add uptime checks

---

## 🆘 Need Help?

1. **Backend issues?** Check `backend/README.md`
2. **Frontend issues?** Check `frontend/README.md`
3. **Deployment issues?** Review the error in Vercel dashboard logs
4. **Code issues?** Run locally first (`npm run dev`) to debug

---

**Deployment Status:** ✅ READY FOR PRODUCTION
