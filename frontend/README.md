# Frontend - AI Grievance Portal

A modern React + TypeScript frontend for the grievance redressal system with AI-powered priority prediction and chatbot support.

## 🎨 Architecture

### Views

- **Home** – Landing page with features overview
- **Lodge Complaint** – Form to submit new grievances with audio/file upload
- **Track Complaint** – Search and monitor complaint status
- **Admin Login** – Restricted access to admin dashboard
- **Admin Dashboard** – Manage and update complaints

### Services

- **`api.ts`** – Centralized backend API calls (complaints CRUD)
- **`config.ts`** – Environment variable management (API URL, Gemini key)
- **`geminiService.ts`** – Google Gemini AI for priority prediction & chatbot
- **`storageService.ts`** – localStorage for offline data

### Components

- **`Navbar.tsx`** – Navigation header
- **`Chatbot.tsx`** – AI assistant widget

## 🔧 Development

### Setup

```bash
npm install
```

### Environment Variables

Create `frontend/.env.local`:
```env
VITE_API_URL=http://localhost:4000
VITE_GEMINI_API_KEY=your_api_key_here
```

Get your Gemini API key from: https://aistudio.google.com/app/apikeys

### Run Locally

```bash
npm run dev
```

Starts on http://localhost:3000

### Build for Production

```bash
npm run build
```

Outputs to `dist/`.

## 🚀 Deployment to Vercel

### Option 1: GitHub Integration (Recommended)

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Set root directory: `frontend`
5. Add environment variables:
   - `VITE_API_URL` = Your backend URL
   - `VITE_GEMINI_API_KEY` = Your Gemini key
6. Deploy

Future pushes will auto-deploy.

### Option 2: CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 📱 Environment Variables

| Variable | Value | Example |
|----------|-------|----------|
| `VITE_API_URL` | Backend URL | `https://api.vercel.app` |
| `VITE_GEMINI_API_KEY` | Gemini API key | Get from aistudio.google.com |

## 🤖 AI Features

### Priority Prediction
Gemini AI analyzes complaint content and assigns High/Low priority.
Fallback to keyword matching if API unavailable.

### Chatbot
AI assistant helps users:
- Lodge complaints
- Track status (with GRV-... ID)
- Answer FAQs

## 🔗 API Integration

Backend at `VITE_API_URL`:
- `POST /api/complaints` – Create
- `GET /api/complaints/:id` – Fetch
- `GET /api/complaints` – List (admin)

## 🐛 Troubleshooting

### Blank Screen?
- Check browser console (F12)
- Verify `VITE_API_URL` environment variable
- Ensure importmap is removed from index.html (should be in build only)

### AI Not Working?
- Verify `VITE_GEMINI_API_KEY` is set
- Check browser console for errors
- Fallback to keyword-based prediction works offline

## 📦 Tech Stack

- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS
- React Router
- Lucide Icons
- Google GenAI SDK

See `package.json` for full details.
