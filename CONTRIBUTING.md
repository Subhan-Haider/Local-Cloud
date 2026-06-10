# Contributing to LootOps Cloud

Thank you for your interest in contributing! This is an open-source self-hosted storage platform and we welcome issues, bug reports, feature requests, and pull requests.

---

## 📋 Before You Start

- Check [existing issues](../../issues) to see if your bug or feature is already being tracked.
- For large changes, **open an issue first** to discuss the approach before writing code.
- Keep pull requests focused — one feature or fix per PR.

---

## 🐛 Reporting Bugs

Open an issue and include:
- What you did / what you expected / what actually happened
- Your OS, Node.js version, and whether you're using Docker
- Relevant logs from the terminal or browser console
- Your `.env.local` values (with secrets redacted)

---

## 🚀 Development Setup

### Prerequisites

- Node.js v20+
- FFmpeg on your PATH (`ffmpeg -version` should work)
- A Firebase project (see [README.md](README.md#-setting-up-firebase))

### Install & Run

```bash
git clone https://github.com/Subhan-Haider/Local-Cloud.git
cd Local-Cloud
npm install
npm run setup     # interactive config wizard
npm run dev       # starts Next.js on :3000 and watches for changes
```

In a second terminal, start the Express API:

```bash
node server.js
```

> In production, both are started together via `start.sh` or Docker.

### Project Layout

| File/Dir | What it is |
|---|---|
| `server.js` | The entire Express API backend (~3700 lines) |
| `firebase-admin.js` | Firebase Admin SDK initialisation |
| `setup.js` | Interactive first-time setup wizard |
| `start.sh` | Docker startup script (launches both processes) |
| `src/app/` | Next.js App Router pages |
| `src/components/` | React components |
| `src/lib/api.ts` | Typed client for all Express API calls |

---

## 🔀 Pull Request Guidelines

1. **Fork** the repository and create a branch from `main`.
2. Branch naming: `fix/short-description` or `feat/short-description`.
3. Write clear commit messages. Use the [conventional commits](https://www.conventionalcommits.org/) style:
   - `feat: add bulk delete endpoint`
   - `fix: resolve path traversal in file serve`
   - `docs: update Docker setup in README`
   - `chore: upgrade sharp to v0.34`
4. Test your changes locally before submitting.
5. Update the README or `.env.example` if your change adds new config variables.
6. PRs that break the Docker build or the dev server will not be merged.

---

## 🏗️ Architecture Notes

### Backend (`server.js`)

- Pure Express.js 5 — no ORM, no framework on top.
- All file metadata lives in a flat-file JSON database (`db.json`) inside the uploads directory.
- Authentication has two layers:
  1. Firebase ID token (verified server-side via Admin SDK)
  2. Optional MFA session cookie (HMAC-signed)
- An in-memory file cache (`fileCache`) is rebuilt after every write operation.

### Frontend (`src/`)

- Next.js 16 App Router with React 19 and TailwindCSS 4.
- All API calls go through `src/lib/api.ts` (typed axios wrapper).
- `next.config.ts` proxies `/api/*`, `/file-serve/*`, etc. to Express so the browser only ever talks to one origin (cookie-safe).
- Built with `output: "standalone"` for Docker deployment.

### Auth Flow

```
Browser → Firebase login → Firebase ID Token
       → POST /api/auth/2fa/verify (if 2FA enabled) → MFA cookie
       → All API calls: Authorization: Bearer <token> + mfa_token cookie
```

---

## 🔒 Security

If you discover a security vulnerability, please **do not open a public issue**.  
Email the maintainer privately: see the GitHub profile for contact details.

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
