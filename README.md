# 🗄️ Storage Server v4

> A robust, self-hosted file storage and management platform built with **Next.js 16**, **Express.js**, and **Firebase**. Supports secure file uploads, media processing, folder management, an in-browser **Python Studio**, two-factor authentication, analytics, webhooks, and more — all from a beautiful, modern dashboard.

---

## ✨ Features

### 🔐 Authentication & Security
- **Firebase Authentication** — Email/password sign-in backed by Google Firebase
- **Allowlist-based Access** — Only pre-approved email addresses can log in (configurable via `db.json`)
- **Two-Factor Authentication (2FA)**
  - Authenticator App (TOTP via `speakeasy`)
  - Email OTP (6-digit code with 10-minute expiry via `nodemailer`)
  - QR Code generation for easy authenticator app setup
- **MFA Session Tokens** — HMAC-signed cookies with 24-hour expiry enforce 2FA on every API call
- **Rate Limiting** — 100 requests per 15 minutes to prevent abuse
- **Helmet.js** — Security HTTP headers on all responses
- **CORS** — Configurable origin allowlist (hardcoded + environment + dynamic via `db.json`)
- **Path Traversal Protection** — All file paths are validated against the uploads root

### 🐍 Python Studio (New in v4)
- **In-Browser Code Editor** — Write, run, and experiment with Python scripts directly from your dashboard
- **Live Execution Environment** — See real-time console output and visual results
- **Data Integration** — Process and analyze files stored in your server
- **Modern IDE Experience** — Syntax highlighting, auto-completion, and a sleek interface

### 📁 File Management
- Upload files up to **500 MB** per file
- Organize files into **named folders** (auto-created on upload)
- **Trash / Soft Delete** — Files move to `_trash/` before permanent deletion
- **Pin files** for quick access
- **File expiry** — Set an automatic expiration date on any file
- **Public / Private visibility toggle** per file
- **Tags & Notes** — Attach metadata to files for organization
- **MD5 Hash** — Integrity verification for every uploaded file
- **Bulk folder download** — Download entire folders as a `.zip` archive

### 🖼️ Media Processing
- **Image Optimization** (via `sharp`)
  - Auto-converted to **WebP** format (max 1920×1080, quality 80)
  - Thumbnail generation (300×300 cover crop, quality 70)
- **Video Compression** (via `fluent-ffmpeg` + FFmpeg binary)
  - Re-encoded to H.264/AAC with CRF 28 for significant size reduction
  - Video thumbnail generation from the first frame
- **Audio Support** — MP3, WAV, OGG, FLAC, AAC, M4A
- **Live HTML Preview** — Serve and preview `.html` files in an iframe

### 📂 Folder System
- Create, rename, and delete folders
- Nested file browsing by folder
- Folder-level statistics (file count, total size)
- Move files between folders

### 🔗 File Sharing
- Generate **shareable links** for individual files
- Set **expiration dates** on share links
- Optional **password protection** on shared links
- Public share page accessible without login

### 📊 Analytics & Logs
- Total upload and download byte counters
- **Daily stats** — per-day upload and download volumes
- Event log (last 500 events): uploads, downloads, deletes, shares, logins
- Dashboard with storage usage overview

### 🪝 Webhooks
- Configure a webhook URL to receive `POST` payloads on file events:
  - `FILE_UPLOADED`
  - `FILE_DOWNLOADED`
  - `FILE_DELETED`
  - `FOLDER_ZIPPED`
- Payload includes event name, timestamp, and file details

### 📧 Email Notifications
- Upload notification emails sent to configured admin addresses
- Styled HTML email templates
- Fully optional — disabled if SMTP is not configured

### ⚡ Performance
- **In-memory file cache** — File list is pre-scanned and cached on startup, rebuilt on every write
- Async directory scanning to avoid blocking the event loop
- Efficient stream-based file serving with `res.sendFile`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TailwindCSS 4 |
| **Backend** | Express.js 5, Node.js 20+ |
| **Authentication** | Firebase Auth, Firebase Admin SDK |
| **Database** | Firestore (security/MFA), flat-file `db.json` (metadata) |
| **File Storage** | Local filesystem (`/var/www/storage/uploads`) |
| **Image Processing** | Sharp |
| **Video Processing** | Fluent-FFmpeg + FFmpeg binary |
| **Archive** | Archiver (zip) |
| **Email** | Nodemailer (SMTP) |
| **2FA** | Speakeasy (TOTP), QRCode |
| **Security** | Helmet, express-rate-limit, cookie-parser |
| **HTTP Client** | Axios |
| **Icons** | Lucide React |
| **Styling Utilities** | clsx, tailwind-merge |

---

## 📁 Project Structure

```
storage-server-v4/
├── server.js                  # Custom Express backend (all API routes)
├── firebase-admin.js          # Firebase Admin SDK initialization
├── next.config.ts             # Next.js configuration
├── firestore.rules            # Firestore security rules
├── storage.rules              # Firebase Storage security rules
├── .env.local                 # Environment variables (not committed)
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # Root/dashboard page
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   ├── files/             # File browser page
│   │   ├── folders/           # Folder management page
│   │   ├── uploads/           # Upload page
│   │   ├── python-studio/     # Python IDE page
│   │   ├── settings/          # Settings & security page
│   │   └── (public)/          # Public share pages (no auth)
│   │
│   ├── components/
│   │   ├── auth/              # AuthGate, login, 2FA components
│   │   ├── dashboard/         # Analytics widgets, stats cards
│   │   ├── files/             # FileCard, FilePreviewModal, file list
│   │   ├── folders/           # Folder tree, folder cards
│   │   ├── layout/            # Sidebar, header, navigation
│   │   ├── python-studio/     # Python code editor and live preview panes
│   │   ├── settings/          # Settings panels
│   │   ├── ui/                # Reusable UI primitives
│   │   └── upload/            # Upload dropzone, progress
│   │
│   └── lib/
│       ├── api.ts             # Typed API client (wraps fetch to Express)
│       └── (utilities)        # Shared helpers
```

---

## 🔌 API Reference

All authenticated endpoints require a Firebase ID token in the `Authorization: Bearer <token>` header (or `?token=` query param). Endpoints marked 🔒 also require a valid MFA cookie if 2FA is enabled.

### File Serving

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/file-serve/:folder/:name` | Public / Token for private | Stream a file inline |
| `GET` | `/file-download/:folder/:name` | Public / Token for private | Force-download a file |
| `GET` | `/thumbnails/:filename` | Public | Serve a generated thumbnail |

### File Operations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/files` | 🔒 | List all files (from cache) |
| `POST` | `/api/upload` | 🔒 | Upload one or more files |
| `DELETE` | `/api/files/:folder/:name` | 🔒 | Move file to trash |
| `DELETE` | `/api/files/:folder/:name/permanent` | 🔒 | Permanently delete a file |
| `PATCH` | `/api/files/:folder/:name/meta` | 🔒 | Update file metadata (tags, note, pinned, expiry) |
| `PATCH` | `/api/files/:folder/:name/visibility` | 🔒 | Toggle public/private |
| `POST` | `/api/files/:folder/:name/move` | 🔒 | Move file to another folder |

### Folder Operations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/folders` | 🔒 | List all folders |
| `POST` | `/api/folders` | 🔒 | Create a folder |
| `DELETE` | `/api/folders/:name` | 🔒 | Delete a folder |
| `GET` | `/api/folders/:name/download` | 🔒 | Download folder as ZIP |

### Trash

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/trash` | 🔒 | List trashed files |
| `POST` | `/api/trash/:name/restore` | 🔒 | Restore a file from trash |
| `DELETE` | `/api/trash/:name` | 🔒 | Permanently delete from trash |

### Sharing

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/share` | 🔒 | Create a share link |
| `GET` | `/api/share/:token` | Public | Resolve a share link |
| `DELETE` | `/api/share/:token` | 🔒 | Revoke a share link |

### Analytics & Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics` | 🔒 | Get upload/download stats |
| `GET` | `/api/logs` | 🔒 | Get recent event log |

### Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/settings` | 🔒 | Get server settings |
| `PUT` | `/api/settings` | 🔒 | Update server settings |
| `GET` | `/api/settings/origins` | 🔒 | Get allowed CORS origins |
| `POST` | `/api/settings/origins` | 🔒 | Add a CORS origin |
| `DELETE` | `/api/settings/origins/:origin` | 🔒 | Remove a CORS origin |
| `GET` | `/api/webhook` | 🔒 | Get webhook URL |
| `PUT` | `/api/webhook` | 🔒 | Set webhook URL |

### Two-Factor Authentication (2FA)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/2fa/generate` | 🔒 | Generate TOTP secret + QR code |
| `POST` | `/api/auth/2fa/send-email` | Firebase token | Send email OTP |
| `POST` | `/api/auth/2fa/verify-setup` | 🔒 | Verify token and enable 2FA |
| `POST` | `/api/auth/2fa/disable` | 🔒 | Disable 2FA |
| `POST` | `/api/auth/2fa/verify` | Firebase token | Verify MFA code and issue session cookie |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20 or higher
- **FFmpeg** installed and on `PATH` (for video features)
- A **Firebase project** with Authentication and Firestore enabled
- An SMTP email account (optional, for email OTP and notifications)

### 1. Clone the Repository

```bash
git clone https://github.com/Subhan-Haider/Storage-server-v4.git
cd Storage-server-v4
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# ── Server ────────────────────────────────────────
PORT=5000
API_KEY=your_secret_api_key_here

# ── Firebase Admin SDK ────────────────────────────
FIREBASE_PROJECT_ID=your_firebase_project_id
# Place your Firebase service account JSON at the project root
# or configure GOOGLE_APPLICATION_CREDENTIALS

# ── Firebase Client (for Next.js frontend) ────────
NEXT_PUBLIC_FIREBASE_API_KEY=your_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# ── CORS ──────────────────────────────────────────
ALLOWED_ORIGINS=https://your-domain.com,https://another-domain.com

# ── SMTP / Email (Optional) ───────────────────────
SMTP_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=user@example.com
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@example.com
ADMIN_EMAIL=admin@example.com
```

### 4. Configure Upload Path

By default, files are stored at `/var/www/storage/uploads`. You can change `UPLOAD_PATH` at the top of `server.js` to any directory on your system.

### 5. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Enable **Email/Password Authentication**
3. Enable **Firestore Database**
4. Download your **Service Account JSON** and configure `firebase-admin.js`
5. Deploy the security rules: `firestore.rules` and `storage.rules`

### 6. Run the Application

**Development:**
```bash
npm run dev
```
The Next.js app will run on [http://localhost:3000](http://localhost:3000).
The Express server runs on [http://localhost:5000](http://localhost:5000).

**Production:**
```bash
npm run build
npm run start
```

---

## 📦 Supported File Types

| Category | Extensions |
|----------|-----------|
| **Images** | `.jpg` `.jpeg` `.png` `.gif` `.webp` `.svg` `.ico` `.bmp` `.tiff` |
| **Video** | `.mp4` `.webm` `.mov` `.avi` `.mkv` |
| **Audio** | `.mp3` `.wav` `.ogg` `.flac` `.aac` `.m4a` |
| **Documents** | `.pdf` `.txt` `.md` |
| **Code** | `.html` `.css` `.js` `.ts` `.jsx` `.tsx` `.py` `.json` `.xml` `.csv` `.yaml` `.yml` `.sh` `.php` `.rb` `.java` `.c` `.cpp` `.go` `.rs` `.sql` `.graphql` `.toml` `.ini` `.cfg` `.log` |
| **Archives** | `.zip` `.tar` `.gz` `.rar` `.7z` |

> Maximum file size: **500 MB** per file.

---

## 🗃️ Local Database (`db.json`)

A flat JSON file stored at `<UPLOAD_PATH>/db.json` acts as the metadata database:

```json
{
  "files": {
    "root/filename.webp": {
      "isPublic": true,
      "downloads": 42,
      "pinned": false,
      "tags": ["photo", "2024"],
      "note": "Holiday photos",
      "expiresAt": null,
      "hash": "md5-hash-here"
    }
  },
  "folders": {},
  "trash": {},
  "shares": {
    "<token>": { "folder": "root", "name": "file.pdf", "expiresAt": "...", "password": null }
  },
  "logs": [],
  "mfaCodes": {},
  "analytics": {
    "totalUploads": 1024000,
    "totalDownloads": 512000,
    "dailyStats": {
      "2024-01-15": { "uploads": 1024, "downloads": 512 }
    }
  },
  "settings": {
    "allowedEmails": ["admin@example.com"],
    "allowedOrigins": ["https://myapp.com"],
    "notificationEmails": ["admin@example.com"],
    "notificationsEnabled": true
  },
  "webhookUrl": "https://hooks.example.com/my-webhook"
}
```

---

## 🔒 Security Model

1. **Firebase ID Token Verification** — Every API request verifies the token against Firebase Auth
2. **Email Allowlist** — Even valid Firebase users are rejected unless their email is allowlisted
3. **MFA Enforcement** — If 2FA is enabled, every API call checks for a valid HMAC-signed MFA cookie
4. **Rate Limiting** — 100 requests / 15 minutes per IP
5. **Helmet.js Headers** — XSS protection, HSTS, X-Frame-Options, etc.
6. **CORS Allowlist** — Only whitelisted origins can make API requests
7. **Path Traversal Guard** — File paths are resolved and checked against the uploads root before serving

---

## 📜 NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build the production Next.js bundle |
| `npm run start` | Start the production Next.js server |
| `npm run lint` | Run ESLint across the codebase |

---

## 🌐 Deployment

This project is designed to be self-hosted on a Linux VPS. A recommended setup:

- **Reverse Proxy**: Nginx pointing to ports 3000 (Next.js) and 5000 (Express)
- **Process Manager**: PM2 for keeping both servers alive
- **SSL**: Let's Encrypt via Certbot
- **Storage Path**: `/var/www/storage/uploads` (customizable)

```bash
# Start with PM2
pm2 start server.js --name "storage-api"
pm2 start "npm run start" --name "storage-ui"
pm2 save
```

---

## 🔮 Future Roadmap & Ideas

Here are some potential features planned or brainstormed for future updates to Blizflow Storage Server:

- **🤖 AI & Smart Features:** Auto-tagging for images (e.g. "beach", "document"), OCR to extract and search text inside PDFs and images.
- **📱 Media & Streaming:** A built-in media player for video/audio streaming and a photo gallery view with slideshows.
- **🔐 Advanced Security:** End-to-End Encryption (E2EE) for client-side file encryption, and Role-Based Access Control (RBAC) for granular sharing permissions (Viewer, Editor).
- **☁️ Collaboration:** Public "Drop Zones" for receiving files from guests, and the ability to leave comments or annotations on shared files.
- **🛠️ Power-User Tools:** File versioning to restore overwritten files, and automated offsite backups to AWS S3 or Backblaze B2.
- **🌐 Mobile App:** A companion iOS/Android app with an auto-camera-upload feature.

---

## 📄 License

This project is private and not licensed for public use.

---

<p align="center">Built with ❤️ by <a href="https://github.com/Subhan-Haider">Subhan Haider</a></p>
