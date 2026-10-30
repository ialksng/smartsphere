# SmartSphere Full Stack MERN Deployment & Setup Guide

SmartSphere is an AI-powered intelligence workspace built on the **MERN** stack (MongoDB, Express, React, Node.js).

---

## 🗂️ Clean Project Structure

```
smartsphere/
├── client/                     # Frontend Application (React + Vite + Tailwind)
│   ├── src/                    # Components, Layouts, Pages, Services
│   ├── index.html              # HTML entrypoint
│   ├── vite.config.js          # Vite config & dev API proxy
│   ├── vercel.json             # Vercel SPA rewrite routing
│   ├── .env.example            # Frontend environment template
│   └── package.json            # Client dependencies & build scripts
│
├── server/                     # Backend API (Node.js + Express + MongoDB)
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Document, Folder, ChatMessage schemas
│   ├── middleware/             # JWT protect middleware & Multer uploads
│   ├── routes/                 # Auth, DocHub, Folders, Cloud (Drive), AI, Stats
│   ├── services/               # xAI Grok API & Google Drive OAuth services
│   ├── render.yaml             # Render deployment configuration
│   ├── .env.example            # Server environment template
│   ├── server.js               # Express application entrypoint
│   └── package.json            # Server dependencies & scripts
│
├── package.json                # Root package.json with workspace helper scripts
├── .gitignore                  # Clean global ignore rules
└── DEPLOYMENT.md               # Deployment instructions
```

---

## 1. Backend Deployment on Render

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your repository: `ialksng/smartsphere`.
4. Configure the Web Service settings:
   - **Name:** `smartsphere-backend`
   - **Region:** Frankfurt / Oregon / Singapore (your choice)
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Under **Environment Variables**, configure:
   | Key | Value / Description |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (assigned by Render automatically) |
   | `MONGO_URI` | Your MongoDB Atlas Connection String (`mongodb+srv://...`) |
   | `JWT_SECRET` | A secure random secret string (e.g., `sphere_secret_key_987654`) |
   | `FRONTEND_URL` | Your Vercel frontend URL (e.g., `https://your-frontend.vercel.app`) |
   | `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID *(add when ready)* |
   | `GOOGLE_CLIENT_SECRET`| Your Google OAuth Client Secret *(add when ready)* |
   | `GOOGLE_REDIRECT_URI` | `https://<your-render-url>/api/cloud/google/callback` |
   | `GOOGLE_AUTH_REDIRECT_URI` | `https://<your-render-url>/api/auth/google/callback` |
   | `GROQ_API_KEY` | Your Groq Cloud API Key (from https://console.groq.com/keys) |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` |
   | `EMAIL_USER` | *(Optional)* SMTP / Gmail address for forgot-password emails |
   | `EMAIL_PASS` | *(Optional)* SMTP / Gmail App Password |

6. Click **Create Web Service**.

---

## 2. Frontend Deployment on Vercel

1. Log into your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New** $\rightarrow$ **Project**.
3. Import your repository: `ialksng/smartsphere`.
4. In Project Configuration:
   - **Root Directory:** Click **Edit** and select `client`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://<your-render-backend-url>/api` |
6. Click **Deploy**.

---

## 3. Running Locally

### Option A: From root with helper scripts
```bash
# Install dependencies in both client and server
npm run install:all

# Run the backend (in one terminal)
npm run server

# Run the frontend (in another terminal)
npm run client
```

### Option B: From individual folders
```bash
# Start Backend (runs on http://localhost:5000)
cd server
npm install
node server.js

# Start Frontend (runs on http://localhost:5173)
cd client
npm install
npm run dev
```
*(Vite is preconfigured to proxy all `/api` calls directly to `http://localhost:5000` in development).*
