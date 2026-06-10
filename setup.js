#!/usr/bin/env node
/**
 * LootOps Cloud — Interactive First-Time Setup Wizard
 * Run: node setup.js
 *
 * This script walks you through all required configuration,
 * auto-generates secrets, and writes your .env.local file.
 */

const readline = require("readline");
const crypto   = require("crypto");
const fs       = require("fs");
const path     = require("path");
const os       = require("os");
const net      = require("net");

// ── ANSI colors ───────────────────────────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  blue:   "\x1b[34m",
  magenta:"\x1b[35m",
  white:  "\x1b[37m",
  bgBlue: "\x1b[44m",
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultVal = "", secret = false) {
  return new Promise((resolve) => {
    const hint = defaultVal ? ` ${c.dim}[${defaultVal}]${c.reset}` : "";
    const marker = secret ? ` ${c.dim}(hidden)${c.reset}` : "";
    process.stdout.write(`  ${c.cyan}?${c.reset} ${question}${hint}${marker}: `);

    if (secret) {
      // Disable echo for password-like fields
      if (process.stdin.isTTY) process.stdin.setRawMode(true);
      let val = "";
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      const onData = (ch) => {
        if (ch === "\n" || ch === "\r" || ch === "\u0004") {
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          process.stdout.write("\n");
          process.stdin.removeListener("data", onData);
          process.stdin.pause();
          resolve(val || defaultVal);
        } else if (ch === "\u0003") {
          process.stdout.write("\n");
          process.exit();
        } else if (ch === "\u007f") {
          val = val.slice(0, -1);
          process.stdout.write("\b \b");
        } else {
          val += ch;
          process.stdout.write("*");
        }
      };
      process.stdin.on("data", onData);
    } else {
      rl.question("", (answer) => {
        resolve(answer.trim() || defaultVal);
      });
    }
  });
}

function print(msg = "") { console.log(msg); }
function hr(char = "─", len = 60) { print(`${c.dim}${char.repeat(len)}${c.reset}`); }
function section(title) {
  print("");
  hr();
  print(`${c.bold}${c.blue}  ${title}${c.reset}`);
  hr();
}
function success(msg) { print(`\n  ${c.green}✓${c.reset} ${msg}`); }
function warn(msg)    { print(`  ${c.yellow}⚠${c.reset}  ${msg}`); }
function info(msg)    { print(`  ${c.dim}${msg}${c.reset}`); }
function bold(msg)    { return `${c.bold}${msg}${c.reset}`; }

// ── Detect local IP ────────────────────────────────────────────────────────────
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "localhost";
}

// ── Check for available ports ──────────────────────────────────────────────────
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.once("close", () => resolve(startPort));
      server.close();
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

// ── Main wizard ────────────────────────────────────────────────────────────────
async function main() {
  console.clear();

  print("");
  print(`${c.bold}${c.cyan}  ☁️  LootOps Cloud — Setup Wizard${c.reset}`);
  print(`${c.dim}  Self-hosted storage server configuration${c.reset}`);
  print("");
  info("This wizard will create your .env.local configuration file.");
  info("Press ENTER to accept a default value shown in [brackets].");
  info("You can re-run this script at any time to update your config.");

  const envPath = path.join(__dirname, ".env.local");
  if (fs.existsSync(envPath)) {
    print("");
    warn(".env.local already exists.");
    const overwrite = await ask("Overwrite existing configuration? (yes/no)", "no");
    if (!overwrite.toLowerCase().startsWith("y")) {
      print("");
      warn("Setup cancelled. Your existing .env.local was not changed.");
      rl.close();
      process.exit(0);
    }
  }

  const localIp   = getLocalIp();
  const apiKey    = crypto.randomBytes(32).toString("hex");
  const jwtSecret = crypto.randomBytes(32).toString("hex");

  // ════════════════════════════════════════════════════════════════════
  // STEP 1 — Server & Domain
  // ════════════════════════════════════════════════════════════════════
  section("STEP 1 — Server & Domain");
  info("This is where your server will be publicly accessible.");
  info("Examples:");
  info("  • Local only:       http://localhost");
  info("  • LAN access:       http://" + localIp);
  info("  • Custom domain:    https://cloud.yourdomain.com");
  info("  • Subdomain:        https://storage.yourdomain.com");
  print("");

  const domain = await ask("Your server domain or IP", `http://${localIp}`);

  // Normalize: strip trailing slash and ensure protocol
  let baseUrl = domain.replace(/\/$/, "");
  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    // Auto-detect if it's a local IP/localhost vs a real domain
    baseUrl = baseUrl.includes("localhost") || baseUrl.match(/^[0-9.]+$/)
      ? `http://${baseUrl}`
      : `https://${baseUrl}`;
  }

  // Ports
  print("");
  info("Checking for available ports...");
  
  const expressPort = await findAvailablePort(5000);
  if (expressPort !== 5000) {
    warn(`Port 5000 is in use. Automatically assigned port ${expressPort} for Express API.`);
  } else {
    info(`  ${c.green}✓${c.reset} Selected port ${expressPort} for Express API.`);
  }

  const nextPort = await findAvailablePort(3000);
  if (nextPort !== 3000) {
    warn(`Port 3000 is in use. Automatically assigned port ${nextPort} for Next.js UI.`);
  } else {
    info(`  ${c.green}✓${c.reset} Selected port ${nextPort} for Next.js UI.`);
  }

  // Full URLs
  const expressUrl = baseUrl.includes(":") && !baseUrl.startsWith("http")
    ? `http://${baseUrl}:${expressPort}`
    : baseUrl.endsWith(`:${expressPort}`) ? baseUrl : `${baseUrl}:${expressPort}`;

  print("");
  info(`Your dashboard will be at: ${c.cyan}${baseUrl}:${nextPort}${c.reset}`);
  info(`Your API will be at:       ${c.cyan}${expressUrl}${c.reset}`);

  // ════════════════════════════════════════════════════════════════════
  // STEP 2 — File Storage
  // ════════════════════════════════════════════════════════════════════
  section("STEP 2 — File Storage");
  info("Where uploaded files will be stored on disk.");
  info("Docker users: use /data/uploads (mapped to a Docker volume).");
  info("Manual/VPS users: use any directory you have write access to.");
  print("");

  const isWindows   = process.platform === "win32";
  const defaultPath = isWindows ? "C:\\lootops\\uploads" : "/var/www/lootops/uploads";
  const uploadPath  = await ask("Upload storage directory", defaultPath);

  // ════════════════════════════════════════════════════════════════════
  // STEP 3 — Firebase Admin SDK
  // ════════════════════════════════════════════════════════════════════
  section("STEP 3 — Firebase Admin SDK (Server-side Auth)");
  print(`  ${c.yellow}How to get these values:${c.reset}`);
  info("  1. Go to https://console.firebase.google.com");
  info("  2. Select your project → ⚙️ Project Settings");
  info("  3. Click 'Service accounts' tab");
  info("  4. Click 'Generate new private key' → open the downloaded JSON");
  info("  5. Copy the values below from that JSON file");
  print("");

  const fbProjectId    = await ask("Firebase Project ID         (e.g. my-project-12345)");
  const fbClientEmail  = await ask("Firebase Client Email       (e.g. firebase-adminsdk-xxx@...)");
  print("");
  info("  For the private key, paste the ENTIRE value from the JSON file");
  info("  including the BEGIN/END lines. Press ENTER twice when done.");
  print("");
  const fbPrivateKey = await ask("Firebase Private Key", "", false);

  // ════════════════════════════════════════════════════════════════════
  // STEP 4 — Firebase Client SDK (Frontend)
  // ════════════════════════════════════════════════════════════════════
  section("STEP 4 — Firebase Client SDK (Next.js Frontend)");
  print(`  ${c.yellow}How to get these values:${c.reset}`);
  info("  1. Firebase Console → ⚙️ Project Settings → General");
  info("  2. Scroll to 'Your apps' → click your web app (or create one)");
  info("  3. Copy the config values shown in the firebaseConfig object");
  print("");

  const fbApiKey            = await ask("NEXT_PUBLIC_FIREBASE_API_KEY           ");
  const fbAuthDomain        = await ask("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN       ");
  const fbPublicProjectId   = fbProjectId || await ask("NEXT_PUBLIC_FIREBASE_PROJECT_ID       ", fbProjectId);
  const fbStorageBucket     = await ask("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   ");
  const fbMessagingSenderId = await ask("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  const fbAppId             = await ask("NEXT_PUBLIC_FIREBASE_APP_ID            ");

  // ════════════════════════════════════════════════════════════════════
  // STEP 5 — SMTP / Email (Optional)
  // ════════════════════════════════════════════════════════════════════
  section("STEP 5 — Email Notifications (Optional)");
  info("Receive alerts when files are uploaded, deleted, or someone logs in.");
  info("Skip this step if you don't want email notifications.");
  print("");

  const smtpEnabled = await ask("Enable email notifications? (yes/no)", "no");
  let smtpHost = "", smtpPort = "587", smtpSecure = "false";
  let smtpUser = "", smtpPass = "", smtpFrom = "", adminEmail = "";

  if (smtpEnabled.toLowerCase().startsWith("y")) {
    print("");
    info("  Gmail users: use smtp.gmail.com with an App Password");
    info("  (Google Account → Security → 2FA → App Passwords)");
    print("");
    smtpHost    = await ask("SMTP Host   ", "smtp.gmail.com");
    smtpPort    = await ask("SMTP Port   ", "587");
    smtpSecure  = await ask("SMTP Secure (true for port 465)", "false");
    smtpUser    = await ask("SMTP Email  ");
    smtpPass    = await ask("SMTP Password / App Password", "", true);
    smtpFrom    = await ask("From address", smtpUser);
    adminEmail  = await ask("Admin notification email", smtpUser);
  }

  // ════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════
  section("SUMMARY");
  print(`  ${bold("Dashboard URL:")}  ${c.cyan}${baseUrl}:${nextPort}${c.reset}`);
  print(`  ${bold("API URL:")}        ${c.cyan}${expressUrl}${c.reset}`);
  print(`  ${bold("Storage path:")}   ${c.cyan}${uploadPath}${c.reset}`);
  print(`  ${bold("Firebase Project:")} ${c.cyan}${fbProjectId || "(not set)"}${c.reset}`);
  print(`  ${bold("Email alerts:")}   ${c.cyan}${smtpEnabled.toLowerCase().startsWith("y") ? "Enabled → " + adminEmail : "Disabled"}${c.reset}`);
  print(`  ${bold("API Key:")}        ${c.dim}auto-generated (${apiKey.slice(0, 8)}...)${c.reset}`);
  print(`  ${bold("JWT Secret:")}     ${c.dim}auto-generated${c.reset}`);
  print("");

  const confirm = await ask("Write .env.local with these settings? (yes/no)", "yes");
  if (!confirm.toLowerCase().startsWith("y")) {
    warn("Setup cancelled. Nothing was written.");
    rl.close();
    process.exit(0);
  }

  // ════════════════════════════════════════════════════════════════════
  // WRITE .env.local
  // ════════════════════════════════════════════════════════════════════
  const envContent = `# ════════════════════════════════════════════════════════════════════
# LootOps Cloud — Environment Configuration
# Generated by setup.js on ${new Date().toLocaleString()}
# DO NOT commit this file to version control.
# ════════════════════════════════════════════════════════════════════

# ── Server ──────────────────────────────────────────────────────────
PORT=${expressPort}
UPLOAD_PATH=${uploadPath}

# Public base URL of the Express API server
# Used by Next.js rewrites and for building file URLs in API responses
SERVER_BASE_URL=${expressUrl}

# Public URL of the Next.js frontend (used by the app to reach the API)
# If Next.js and Express are on the same origin, leave this empty.
NEXT_PUBLIC_API_URL=${expressUrl}

# Auto-generated secret API key for programmatic access.
# Keep this private — anyone with this key has full API access.
API_KEY=${apiKey}

# Auto-generated JWT secret for session signing.
JWT_SECRET=${jwtSecret}

# ── Firebase Admin SDK (Server-side) ────────────────────────────────
FIREBASE_PROJECT_ID=${fbProjectId}
FIREBASE_CLIENT_EMAIL=${fbClientEmail}
# Private key — keep the quotes and literal \\n characters
FIREBASE_PRIVATE_KEY="${fbPrivateKey.replace(/\n/g, "\\n")}"

# ── Firebase Client SDK (Next.js Frontend) ───────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=${fbApiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${fbAuthDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${fbPublicProjectId || fbProjectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${fbStorageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${fbMessagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${fbAppId}

# ── SMTP / Email Notifications ───────────────────────────────────────
SMTP_ENABLED=${smtpEnabled.toLowerCase().startsWith("y") ? "true" : "false"}
SMTP_HOST=${smtpHost}
SMTP_PORT=${smtpPort}
SMTP_SECURE=${smtpSecure}
SMTP_USER=${smtpUser}
SMTP_PASS=${smtpPass}
SMTP_FROM=${smtpFrom}
ADMIN_EMAIL=${adminEmail}
`;

  fs.writeFileSync(envPath, envContent, "utf8");

  // ════════════════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════════════════
  print("");
  hr("═");
  print(`${c.bold}${c.green}  ✅  Setup complete! .env.local has been written.${c.reset}`);
  hr("═");
  print("");
  print(`${c.bold}  Next steps:${c.reset}`);
  print("");
  print(`  ${c.cyan}1.${c.reset} ${bold("Create your upload directory:")} `);
  if (isWindows) {
    print(`     ${c.dim}mkdir "${uploadPath}"${c.reset}`);
  } else {
    print(`     ${c.dim}sudo mkdir -p ${uploadPath} && sudo chown $USER:$USER ${uploadPath}${c.reset}`);
  }
  print("");
  print(`  ${c.cyan}2.${c.reset} ${bold("Start the application:")}`);
  print(`     ${c.dim}npm install${c.reset}`);
  print(`     ${c.dim}npm run dev${c.reset}          ← development`);
  print(`     ${c.dim}npm run build && npm run start${c.reset}  ← production`);
  print("");
  print(`  ${c.cyan}3.${c.reset} ${bold("Or use Docker:")}`);
  print(`     ${c.dim}docker compose up -d${c.reset}`);
  print("");
  print(`  ${c.cyan}4.${c.reset} ${bold("First login:")}`);
  print(`     ${c.dim}Open ${baseUrl}:${nextPort} in your browser.${c.reset}`);
  print(`     ${c.dim}Sign in with your Firebase account.${c.reset}`);
  print(`     ${c.dim}Go to Settings → Security → Allowed Emails${c.reset}`);
  print(`     ${c.dim}Add your email to lock down access.${c.reset}`);
  print("");

  if (!fbProjectId || !fbClientEmail || !fbApiKey) {
    print("");
    warn("Some Firebase values were left blank.");
    info("  The server will start but authentication will not work until");
    info("  you fill in the Firebase values in .env.local and restart.");
    print("");
  }

  if (baseUrl.startsWith("http://") && !baseUrl.includes("localhost")) {
    print("");
    warn("You're using HTTP on a non-localhost domain.");
    info("  For production, we strongly recommend setting up HTTPS.");
    info("  Use Nginx + Certbot (Let's Encrypt) to get a free SSL cert:");
    info("  https://certbot.eff.org/");
    print("");
  }

  print(`  ${c.dim}Your API key (save this somewhere safe):${c.reset}`);
  print(`  ${c.yellow}${apiKey}${c.reset}`);
  print("");

  rl.close();
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
