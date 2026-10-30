# 🌐 SmartSphere — AI-Powered Intelligent Workspace

[![Live Demo](https://img.shields.io/badge/Live%20Demo-SmartSphere-blue?style=for-the-badge&logo=vercel)](https://ialksng.me/work/projects/smartsphere/app)
[![Developer](https://img.shields.io/badge/Developer-ialksng.me-emerald?style=for-the-badge&logo=google-chrome)](https://ialksng.me)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Groq%20AI-orange?style=for-the-badge)](https://ialksng.me/work/projects/smartsphere/app)

> **SmartSphere** is a next-generation MERN workspace platform that combines personal document management, Google Drive cloud synchronization, and ultra-fast, context-aware AI intelligence powered by Groq (Llama-3.3-70B).

---

## 🔗 Links

- 🚀 **Live Application:** [https://ialksng.me/work/projects/smartsphere/app](https://ialksng.me/work/projects/smartsphere/app)
- 👨‍💻 **Developer Portfolio:** [https://ialksng.me](https://ialksng.me) (Alok Singh)
- 📡 **Render Backend API:** `https://smartsphere-drat.onrender.com`
- 💻 **Vercel Client App:** `https://smartsphere-pearl.vercel.app`

---

## ✨ Key Features

### 1. 🤖 Context-Aware & Document-Aware AI Assistant
- **Global Workspace Scanning:** The AI Assistant scans across **all documents** in your workspace to answer holistic cross-document questions, cite source documents, and surface insights.
- **Active Document Focus:** Open or attach any PDF, DOCX, MD, or TXT file to give the AI primary focus on that specific document while keeping workspace awareness active.
- **Rich Markdown Formatting:** AI responses render with crisp Markdown typography, bold highlights, formatted tables, code containers, and bullet lists.
- **Visual File Attachment Cards:** Attached documents appear as visual file cards with format logos (`PDF`, `DOC`, `TXT`) and active context status badges.

### 2. ⚡ Real-Time Search Bar AI Synthesis
- As you type in the global search bar on the Dashboard, SmartSphere filters your documents and generates a live **AI Workspace Synthesis** banner right inside the dropdown.
- Jump directly into full chat with a single click via **"Open in AI Assistant"**.

### 3. 📝 Automatic AI Summarization
- Documents uploaded locally, created manually in DocHub, or imported from Google Drive are automatically parsed and summarized into executive summaries and key bullet points using Groq AI.

### 4. 💾 Local Workspace Storage & Cloud Expansion
- **100 MB Local Storage Quota:** Built-in personal workspace storage with live quota tracking and upload guards.
- **Google Drive Integration (Up to 15 GB):** Authenticate with Google Drive to browse remote directories, import files with instant AI summarization, or sync local documents back to Google Drive.

### 5. 🔐 Authentication & Security
- **Dual Authentication Modes:** Native Email/Password with JWT and Google One-Click Sign-In.
- **Secure Password Reset:** Branded HTML reset emails sent via Gmail SMTP with SHA-256 expiring tokens.

---

## 🛠️ Tech Stack

### **Frontend (Client)**
- **Framework:** React 18 with Vite
- **Routing:** React Router v7 (with nested subpath support for `https://ialksng.me/work/projects/smartsphere/app`)
- **Styling:** Tailwind CSS with modern Glassmorphism dark theme
- **Rich Text Editor:** TipTap Editor
- **Icons:** Lucide React
- **Markdown Renderer:** React-Markdown

### **Backend (Server)**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Database:** MongoDB Atlas via Mongoose
- **Authentication:** JSON Web Tokens (JWT) & BcryptJS
- **File Parsing:** Multer & pdf-parse
- **Email Service:** Nodemailer (Gmail SMTP TLS)

### **APIs & Cloud Services**
- **Groq Cloud API:** Ultra-fast LPU inference using `llama-3.3-70b-versatile`
- **Google OAuth 2.0:** Secure identity verification and token management
- **Google Drive API (v3):** Cloud directory navigation, file imports, and quota synchronization
- **Deployment & Proxy:** Vercel (Frontend), Render (Backend API), Cloudflare Pages Functions (Custom Domain Reverse Proxy)

---

## 📦 Project Structure

```
smartsphere/
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── components/         # ChatInterface, Sidebar, NavItem, Modals
│   │   ├── layouts/            # MainLayout (Dashboard frame & sidebar)
│   │   ├── pages/              # Auth, Dashboard, DocHub, DocEditor, MyStorage, CloudHub, BuddyBot
│   │   └── services/           # apiClient (Axios instance with JWT interceptor)
│   ├── copy-assets.js          # Subpath asset mirror script for portfolio integration
│   ├── vercel.json             # Vercel rewrite configuration
│   └── package.json
├── server/                     # Express.js REST API
│   ├── config/                 # MongoDB database connection with auto-reconnect
│   ├── middleware/             # JWT auth protection and Multer memory upload
│   ├── models/                 # User, Document, Folder, ChatMessage schemas
│   ├── routes/                 # authRoutes, docRoutes, folderRoutes, cloudRoutes, aiRoutes, statsRoutes
│   ├── services/               # groqService.js, googleDriveService.js
│   ├── render.yaml             # Render deployment blueprint
│   └── server.js
├── vercel.json                 # Monorepo root Vercel configuration
├── server.js                   # Universal root server entry point
├── package.json                # Monorepo root scripts
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or free MongoDB Atlas URI)
- [Groq API Key](https://console.groq.com/keys) (Free)
- Google Cloud Console Project (For Google Login and Drive sync)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/ialksng/smartsphere.git
cd smartsphere
```

---

### Step 2: Configure Environment Variables

#### **Server Environment:**
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database (Local or Atlas)
MONGO_URI=mongodb://127.0.0.1:27017/smartsphere
JWT_SECRET=your_super_secret_jwt_key_here

# Groq Cloud AI
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Google OAuth & Drive
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/cloud/google/callback
GOOGLE_AUTH_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Nodemailer SMTP (Password Reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=SmartSphere <no-reply@ialksng.me>
EMAIL_REPLY_TO=no-reply@ialksng.me
```

#### **Client Environment:**
Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### Step 3: Install Dependencies
From the repository root:
```bash
# Install dependencies for both client and server
npm run install:all
```

---

### Step 4: Run the Application

#### **Run Backend Server:**
```bash
npm run server
# Runs Express on http://localhost:5000
```

#### **Run Frontend Client (In a new terminal):**
```bash
npm run client
# Runs Vite on http://localhost:5173
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 🌐 Production Deployment Architecture

SmartSphere is architected for seamless multi-cloud hosting:

```
                          ┌────────────────────────┐
                          │    Browser Client      │
                          └───────────┬────────────┘
                                      │
                         https://ialksng.me/work/projects/smartsphere/app
                                      │
                         ┌────────────▼────────────┐
                         │ Cloudflare Edge Worker  │
                         └──────┬────────────┬─────┘
                                │            │
               Static / SPA Routes           API Calls (/api/*)
                                │            │
                                ▼            ▼
                    ┌──────────────────┐  ┌──────────────────────┐
                    │   Vercel Edge    │  │     Render Server    │
                    │ (React 18 Client)│  │ (Node.js/Express API)│
                    └──────────────────┘  └──────────┬───────────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       ▼                           ▼
                            ┌─────────────────────┐     ┌─────────────────────┐
                            │    MongoDB Atlas    │     │   Groq AI / Google  │
                            └─────────────────────┘     └─────────────────────┘
```

- **Frontend:** Hosted on **Vercel** (`smartsphere-pearl.vercel.app`) with custom subpath asset mirroring (`copy-assets.js`).
- **Backend API:** Hosted on **Render** (`smartsphere-drat.onrender.com`) running Express and Mongoose with health monitoring (`/api/health`).
- **Reverse Proxy:** Integrated into the **ialksng-core** portfolio using Cloudflare Pages functions to provide a seamless URL structure at `https://ialksng.me/work/projects/smartsphere/app`.

---

## 👨‍💻 Developer & Author

**Alok Singh**  
- Portfolio: [https://ialksng.me](https://ialksng.me)
- GitHub: [@ialksng](https://github.com/ialksng)
- Email: `ialksng@gmail.com`

---

## 📄 License
This project is licensed under the MIT License.
