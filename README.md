# ☁️ LootOps Cloud

> A robust, **open-source**, self-hosted file storage and management platform.  
> Upload files, manage folders, share links, monitor your server in real-time, run Python scripts — all from a beautiful dashboard.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ready-blue?logo=docker)](docker-compose.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?logo=node.js)](package.json)

---

## ✨ Features

| Category | Features |
|---|---|
| 🔐 **Auth & Security** | Firebase Auth, 2FA (TOTP + Email OTP), Allowlist, Rate Limiting, Helmet.js |
| 📁 **File Management** | Upload up to 500 MB, Folders, Trash, Pin, Tags, Notes, Expiry, MD5 Hash |
| 🖼️ **Media Processing** | Auto WebP conversion (Sharp), Video compression (FFmpeg), Thumbnails |
| 🔗 **Sharing** | Password-protected share links with expiry |
| 📊 **Analytics** | Upload/download stats, daily charts, event log |
| 🪝 **Webhooks** | POST events to any URL on file upload/download/delete |
| 📧 **Email Alerts** | Upload & login notifications via SMTP |
| 🐍 **Python Studio** | In-browser Python IDE with live execution |
| 🖥️ **Live Telemetry** | Real-time CPU & RAM charts via SSE |
| 🌐 **Public Portal** | Public Explore page for public files |

---

## 🚀 Quick Start — Docker (Recommended)

The fastest way to get running. **Requires:** [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/).

### Step 1 — Clone the repository

```bash
git clone https://github.com/Subhan-Haider/Local-Cloud.git
cd Local-Cloud
```

### Step 2 — Configure your environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the required values (see [Configuration](#%EF%B8%8F-configuration) below).

### Step 3 — Start the application

```bash
docker compose up -d
```

That's it! The app will be available at:
- **Dashboard:** `http://localhost:3000`
- **API:** `http://localhost:5000`

To view logs:
```bash
docker compose logs -f
```

To stop:
```bash
docker compose down
```

---

## 🛠️ Manual Setup (Without Docker)

### Prerequisites

- **Node.js** v20 or higher
- **FFmpeg** installed and on `PATH`
- A **Firebase project** with Authentication + Firestore enabled

### Install & Run

```bash
# 1. Clone
git clone https://github.com/Subhan-Haider/Local-Cloud.git
cd Local-Cloud

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# 4. Start in development mode
npm run dev
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env.local` and fill in the values. Here are the most important ones:

| Variable | Required | Description |
|---|---|---|
| `API_KEY` | ✅ | Secret key for programmatic API access. Generate with `openssl rand -hex 32` |
| `SERVER_BASE_URL` | ✅ | Public URL of the Express API (e.g. `https://api.yourdomain.com`) |
| `FIREBASE_PROJECT_ID` | ✅ | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Firebase Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ | Firebase Admin SDK private key (from service account JSON) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase web app API key |
| `UPLOAD_PATH` | ✅ | Directory to store uploaded files (Docker: `/data/uploads`) |
| `SMTP_ENABLED` | ❌ | Set to `true` to enable email notifications |

### Setting Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project
2. Enable **Email/Password Authentication** (Authentication → Sign-in method)
3. Enable **Firestore Database**
4. Go to **Project Settings → Service Accounts** → Generate new private key
5. Copy the values from the downloaded JSON into your `.env.local`
6. Go to **Project Settings → General → Your apps** → Add a Web app → Copy config into `.env.local`

### First Login

On first run, the **Allowed Emails** list is empty — this means **any Firebase-authenticated user can log in**. After your first login, go to **Settings → Security → Allowed Emails** to lock it down to only your email address.

---

## 🐳 Docker Setup Details

The `docker-compose.yml` sets up:
- **App container** running both Next.js (port 3000) and Express (port 5000)
- **Persistent volume** (`lootops_data`) for all uploaded files and the database

### Production with Nginx (Recommended)

For a production deployment with a reverse proxy:

```nginx
# /etc/nginx/sites-available/lootops
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Dashboard (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API (Express) — if you want to expose API on a separate subdomain,
    # create a second server block pointing to port 5000
}
```

```bash
# Get SSL cert with Certbot
sudo certbot --nginx -d yourdomain.com
```

### PM2 (Alternative to Docker)

```bash
npm run build

# Start Express API
pm2 start server.js --name "lootops-api"

# Start Next.js
pm2 start "npm run start" --name "lootops-ui"

pm2 save
pm2 startup
```

---

## 📁 Project Structure

```
Local-Cloud/
├── server.js              # Express API backend (all routes)
├── firebase-admin.js      # Firebase Admin SDK init
├── next.config.ts         # Next.js config (proxy rewrites, Docker standalone)
├── docker-compose.yml     # Docker Compose setup
├── Dockerfile             # Multi-stage Docker build
├── .env.example           # Environment variable template
│
└── src/
    ├── app/               # Next.js App Router pages
    │   ├── page.tsx       # Dashboard
    │   ├── files/         # File browser
    │   ├── folders/       # Folder management
    │   ├── uploads/       # Upload page
    │   ├── python-studio/ # Python IDE
    │   ├── settings/      # Settings & security
    │   └── (public)/      # Public share pages (no auth)
    │
    └── components/        # React components
        ├── auth/          # Login, 2FA, AuthGate
        ├── dashboard/     # Stats, charts, telemetry
        ├── files/         # FileCard, FilePreviewModal
        ├── folders/       # FolderCard, FolderView
        ├── layout/        # Sidebar, navigation
        ├── python-studio/ # Code editor, preview
        ├── settings/      # Settings panels
        └── upload/        # Upload dropzone, progress
```

---

## 🔒 Security Model

1. **Firebase Auth** — All sessions backed by Google Firebase
2. **Allowlist** — Optional email allowlist (empty = open mode, any Firebase user can log in)
3. **2FA** — TOTP (Authenticator app) or Email OTP
4. **Rate Limiting** — 100 requests / 15 min per IP
5. **Helmet.js** — Secure HTTP headers
6. **Path Traversal Guard** — File paths validated against uploads root

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TailwindCSS 4 |
| **Backend** | Express.js 5, Node.js 20+ |
| **Auth** | Firebase Auth + Admin SDK |
| **Database** | Firestore (MFA/security) + flat-file `db.json` (metadata) |
| **Storage** | Local filesystem |
| **Images** | Sharp |
| **Video** | Fluent-FFmpeg |
| **Email** | Nodemailer |
| **2FA** | Speakeasy (TOTP) |

---

## 📄 License

MIT — free for personal and commercial use. See [LICENSE](LICENSE).

---

<p align="center">Built with ❤️ by <a href="https://github.com/Subhan-Haider">Subhan Haider</a></p>
