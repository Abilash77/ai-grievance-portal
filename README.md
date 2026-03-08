# Grievance Redressal Portal

## 👥 Team

**Team Name:** Dominator  
**Team Lead:** Abilash Aruva

**AI for Rural Innovation & Sustainable Systems**

---
## 🚀 AI-Grievance-Redressal Portal

GrievAI – Redressal Portal is a modern, full-stack grievance management system designed to streamline the process of submitting, tracking, and resolving grievances.  
The platform provides a clean user experience for complainants and a controlled admin interface for grievance officers.

This project focuses on scalability, clarity, and real-world applicability, making it suitable for college systems, organizations, and civic portals.

---
## 🌐 Live Demo

🔗 **Live Application:**  
https://ai-grievance-portal.vercel.app/

---
## 🌟 Key Features

### 🧑‍💼 Public Portal

- Simple grievance submission form  
- Category-based complaint filing  
- Real-time grievance status tracking  
- Responsive UI for desktop and mobile  
- Secure storage of grievance data  

---

### 🔐 Admin Dashboard

- Restricted admin login  
- View all submitted grievances  
- Update grievance status:
  - Pending  
  - In Progress  
  - Resolved  
- Centralized grievance management  
- Clean and minimal admin interface  

---

### 🗄️ Backend Capabilities

- RESTful API architecture  
- MongoDB integration with Mongoose  
- Environment-based configuration  
- Structured data models  
- Error handling and validation  

---

## 🛠 Tech Stack

### Frontend
- React.js  
- TypeScript  
- Tailwind CSS  
- React Router  

### Backend
- Node.js  
- Express.js  
- MongoDB  
- Mongoose  
- dotenv  

---

## Run Locally

### Prerequisites
Node.js

1. Install dependencies for both frontend and backend:
   ```bash
   cd frontend
   npm install
   cd ../backend
   npm install
   cd ..
   ```

2. **Setup Environment Variables:**

   Backend (`backend/.env`):
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your MongoDB URI, email credentials, etc.

   Frontend (`frontend/.env.local`):
   ```bash
   VITE_API_URL=http://localhost:4000
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on `http://localhost:4000`

4. **Start the Frontend (new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:3000` (or next available port)

---

## 🌍 Deployment to Vercel

This is a monorepo with separate `frontend` and `backend` folders. Both can be deployed to Vercel.

### Backend Deployment (Node.js API)

1. **Create a new Vercel project for the backend:**
   ```bash
   cd backend
   vercel login
   vercel link       # Create new project
   vercel env add MONGODB_URI <your_mongodb_uri>
   vercel env add EMAIL_USER <your_gmail>
   vercel env add EMAIL_PASSWORD <your_app_password>
   vercel --prod
   ```

   **Note the deployment URL** (e.g., `https://ai-grievance-backend.vercel.app`)

2. **Or link from dashboard:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repo
   - Select `backend` as the root directory
   - Add environment variables (see above)
   - Deploy

### Frontend Deployment (React/Vite)

1. **Update frontend to use backend URL:**
   ```bash
   cd frontend
   cat > .env.production.local << EOF
   VITE_API_URL=https://your-backend-url.vercel.app
   VITE_GEMINI_API_KEY=your_gemini_api_key
   EOF
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

   Or from dashboard:
   - Import repo → select `frontend` as root directory
   - Add environment variables (same as above)
   - Deploy

### Environment Variables Reference

**Backend (`backend/.env` and Vercel):**
| Variable | Value | Example |
|----------|-------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `EMAIL_USER` | Gmail address with 2FA | `grievance@gmail.com` |
| `EMAIL_PASSWORD` | 16-char App Password | Get from [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |
| `PORT` | (optional) Server port | `4000` |

**Frontend (`frontend/.env.local` or Vercel):**
| Variable | Value | Example |
|----------|-------|----------|
| `VITE_API_URL` | Backend URL | `http://localhost:4000` (dev) or `https://api.vercel.app` (prod) |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Get from [aistudio.google.com/app/apikeys](https://aistudio.google.com/app/apikeys) |

---

## 📁 Project Structure

```
ai-grievance-portal/
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page-level components
│   │   ├── services/         # API calls & business logic
│   │   └── types.ts          # TypeScript type definitions
│   ├── vite.config.ts        # Vite configuration
│   ├── .env.example          # Environment template
│   └── package.json
├── backend/
│   ├── api/                  # Vercel serverless entry point
│   ├── routes/               # API endpoint definitions
│   ├── models/               # Mongoose schemas
│   ├── services/             # Business logic (email, etc.)
│   ├── .env.example          # Environment template
│   ├── index.js              # Express app
│   ├── vercel.json           # Vercel configuration
│   └── package.json
├── .gitignore                # Global git ignore
├── README.md                 # This file
└── vercel.json               # Root Vercel config
```

---

## 🔒 Security Notes

- **Never commit .env files** – Only commit `.env.example`
- **Gemini API Key:** Currently exposed in frontend (dev only). For production, proxy through backend.
- **Email Credentials:** Use App-specific passwords, not your main Gmail password.
- **MongoDB:** Use connection string with restricted user, not admin credentials.
- **CORS:** Backend limits requests to whitelisted domains. Update in production.

---

## 📞 Support

For issues or questions:
1. Check the [backend README](./backend/README.md) for API details
2. Check the [frontend README](./frontend/README.md) for component docs
3. Review error logs in browser console (frontend) or server logs (backend)

