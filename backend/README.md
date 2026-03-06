# Grievance Backend

Server is a minimal Express + Mongoose backend for the grievance portal.

## Setup

1. From `backend/` install dependencies:

```
cd backend
npm install
```

2. Configure environment variables by creating a `.env` file. Copy `.env.example` and update with your values:

```
cp .env.example .env
```

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

- **POST** `/api/complaints` — create complaint (sends acknowledgment email)
- **GET** `/api/complaints/:id` — get complaint
- **GET** `/api/complaints` — list complaints
- **PATCH** `/api/complaints/:id` — update complaint status (sends status update email)

## Email Features

The server automatically sends emails to complaint givers:
- **Acknowledgment Email**: Sent when a new complaint is created
- **Status Update Email**: Sent when complaint status is updated (pending, in-progress, resolved, etc.)
