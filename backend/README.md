# Grievance Backend

Server is a minimal Express + Mongoose backend for the grievance portal.

## Setup

1. From `backend/` install dependencies:

```
cd backend
npm install
```

2. Configure environment variables by creating a `.env` file. Copy `.env.example` and update with your values:

```bash
cp .env.example .env
``` 

(If you're on Windows, run `copy .env.example .env` instead.)

In production you will set these variables in your hosting provider's settings rather than a local file.

3. Update `.env` with your MongoDB URI, server port, and email credentials:

```env
MONGODB_URI=mongodb://localhost:27017/grievance-portal
PORT=4000
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Email Configuration:**
- For Gmail with 2FA enabled: Use an [App Password](https://myaccount.google.com/apppasswords)
- For other providers: Update the email service in `services/emailService.js`

4. Run in development:

```
npm run dev
```

## API

The server exposes a simple REST API under the `/api/complaints` path. When deployed as a standalone Node server use the `PORT` environment variable, or convert the routes to serverless functions when hosting on Vercel (see below).


- **POST** `/api/complaints` — create complaint (sends acknowledgment email)
- **GET** `/api/complaints/:id` — get complaint
- **GET** `/api/complaints` — list complaints
- **PATCH** `/api/complaints/:id` — update complaint status (sends status update email)

## Email Features

The server automatically sends emails to complaint givers:
- **Acknowledgment Email**: Sent when a new complaint is created
- **Status Update Email**: Sent when complaint status is updated (pending, in-progress, resolved, etc.)

## Deployment

This repository is a monorepo with a separate `frontend`/`backend` folder.
For production you can host the backend on any Node‑capable host (Heroku, Render, Azure, AWS, etc.).

### Option A – generic Node host
1. Push the `backend` folder to your service (e.g. `git push heroku main` from inside `backend`).
2. Set environment variables there (`MONGODB_URI`, `EMAIL_USER`, `EMAIL_PASSWORD`, `PORT`).
3. The server will start with `npm start` and listen on the provided port.

### Option B – Vercel (serverless)
Vercel does not run a persistent Express server – your code needs to be exported as a handler.

The repository already contains a small wrapper in `backend/api/server.js` which simply imports
`index.js` (the Express app) and exports it.  The companion `backend/vercel.json` configures
Vercel to build that file and route all `/api/*` requests into it:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/server.js" }
  ]
}
```

When you run `vercel --cwd backend` (or select the `backend` folder when creating the project
in the dashboard) the CLI will use that configuration.  Set the environment variables for the
backend via the project settings (`MONGODB_URI`, `EMAIL_USER`, `EMAIL_PASSWORD`).

If you prefer not to use Vercel, you can still host the backend on any Node server as noted above.

After deployment the backend URL (e.g. `https://grievance-backend.vercel.app`) can be used by
the frontend via the `VITE_API_URL` variable.

## CORS (Cross-Origin Resource Sharing)

The backend restricts API requests to specific frontend origins for security.

### Local Development

By default, requests from `http://localhost:3000` and `http://localhost:3001` are allowed.
No configuration needed.

### Production (Vercel)

When you deploy to Vercel:

1. **Add environment variable to backend project:**
   - Go to **Settings → Environment Variables**
   - Add `ALLOWED_ORIGINS`
   - Value should be your frontend URL(s), comma-separated:
     ```
     https://your-frontend-domain.vercel.app,https://www.yourdomain.com
     ```

2. **Fix in frontend** – Make sure frontend `.env` has:
   ```env
   VITE_API_URL=https://your-backend-url.vercel.app
   ```

### Troubleshooting CORS Errors

If you see `Error: CORS not allowed for this origin`:

1. **Check the error message** – it shows what origin was rejected
2. **Ensure frontend URL is in `ALLOWED_ORIGINS`**
   - ✅ Correct: `https://app.vercel.app,https://www.example.com`
   - ❌ Wrong: `localhost:3000` (must include full `http://localhost:3000` with protocol)
3. **Redeploy backend** after changing `ALLOWED_ORIGINS`
4. **Check browser DevTools** Network tab
   - Look for `Access-Control-Allow-Origin` response header

### PORT Environment Variable

**Do we need `PORT` in Vercel?**

- ✅ **Local development:** Yes, set `PORT=4000` in `.env`
- ❌ **Vercel:** No, Vercel automatically provides `PORT` via environment
  - Don't add `PORT` to Vercel Environment Variables
  - The code reads `process.env.PORT` which Vercel sets automatically

