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
const { spawnSync } = require("child_process");

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
      rl.question("", (answer) => resolve(answer || defaultVal));
    }
  });
}

// ── Multiline JSON/Path reader ─────────────────────────────────────────────────
function askAdminSdk() {
  return new Promise((resolve) => {
    print(`  ${c.cyan}?${c.reset} Drag & drop your downloaded Firebase JSON file here,`);
    print(`    OR paste the entire JSON text starting with '{',`);
    print(`    OR type 'manual' to enter fields one by one.`);
    process.stdout.write(`  > `);

    let buffer = "";
    let timeoutId = null;

    const onLine = (line) => {
      line = line.trim();

      // Check if user wants manual entry
      if (line.toLowerCase() === "manual") {
        rl.removeListener("line", onLine);
        return resolve({ method: "manual" });
      }

      // Check if user pasted a file path (handling quotes from drag/drop)
      const cleanPath = line.replace(/^['"]|['"]$/g, "");
      if (fs.existsSync(cleanPath) && fs.statSync(cleanPath).isFile()) {
        try {
          const content = fs.readFileSync(cleanPath, "utf8");
          const parsed = JSON.parse(content);
          rl.removeListener("line", onLine);
          return resolve({ method: "parsed", data: parsed });
        } catch (e) {
          warn(`Could not read or parse JSON from file: ${e.message}`);
          process.stdout.write(`  > `);
          return;
        }
      }

      // Otherwise, accumulate lines assuming it's a JSON paste
      buffer += line + "\n";
      
      try {
        const parsed = JSON.parse(buffer);
        // Valid JSON found! Wait 100ms to consume any remaining trailing empty lines from paste
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            rl.removeListener("line", onLine);
            resolve({ method: "parsed", data: parsed });
          }, 100);
        }
      } catch (e) {
        // Not valid JSON yet, wait for more lines
      }
    };

    rl.on("line", onLine);
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

// ── Multiline JS Config reader ────────────────────────────────────────────────
function askClientConfig() {
  return new Promise((resolve) => {
    print(`  ${c.cyan}?${c.reset} Paste the entire 'const firebaseConfig = { ... }' block here,`);
    print(`    OR type 'manual' to enter fields one by one.`);
    process.stdout.write(`  > `);

    let buffer = "";
    let timeoutId = null;

    const onLine = (line) => {
      line = line.trim();

      if (line.toLowerCase() === "manual") {
        rl.removeListener("line", onLine);
        return resolve({ method: "manual" });
      }

      buffer += line + "\n";
      
      if (buffer.includes("}")) {
        const apiKey = buffer.match(/apiKey:\s*['"]([^'"]+)['"]/);
        const authDomain = buffer.match(/authDomain:\s*['"]([^'"]+)['"]/);
        const projectId = buffer.match(/projectId:\s*['"]([^'"]+)['"]/);
        const storageBucket = buffer.match(/storageBucket:\s*['"]([^'"]+)['"]/);
        const messagingSenderId = buffer.match(/messagingSenderId:\s*['"]([^'"]+)['"]/);
        const appId = buffer.match(/appId:\s*['"]([^'"]+)['"]/);

        if (apiKey && authDomain && projectId) {
          // Values found! Wait 100ms to consume any remaining trailing lines (like getAnalytics) from paste
          if (!timeoutId) {
            timeoutId = setTimeout(() => {
              rl.removeListener("line", onLine);
              resolve({
                method: "parsed",
                data: {
                  apiKey: apiKey[1],
                  authDomain: authDomain[1],
                  projectId: projectId[1],
                  storageBucket: storageBucket ? storageBucket[1] : "",
                  messagingSenderId: messagingSenderId ? messagingSenderId[1] : "",
                  appId: appId ? appId[1] : ""
                }
              });
            }, 100);
          }
        }
      }
    };

    rl.on("line", onLine);
  });
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

  print("  1) drive.[your-domain]    (e.g. drive.subhan.tech)");
  print("  2) storage.[your-domain]  (e.g. storage.subhan.tech)");
  print("  3) Custom URL / IP        (e.g. http://localhost)");
  print("");
  const domainType = await ask("Choose domain type (1/2/3)", "1");
  
  let baseUrl = "";

  if (domainType === "1" || domainType === "2") {
    let rootDomain = "";
    while (!rootDomain || rootDomain.trim().length < 3 || !rootDomain.includes(".")) {
      rootDomain = await ask("Enter your root domain (e.g. subhan.tech)");
      if (!rootDomain || rootDomain.trim().length < 3 || !rootDomain.includes(".")) {
        warn("Please enter a valid domain (e.g. subhan.tech)");
      }
    }
    const prefix = domainType === "1" ? "drive" : "storage";
    baseUrl = `https://${prefix}.${rootDomain.trim().toLowerCase()}`;
  } else {
    const customDomain = await ask("Enter your custom URL or IP", `http://${localIp}`);
    
    // Normalize: strip trailing slash and ensure protocol
    baseUrl = customDomain.replace(/\/$/, "");
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      // Auto-detect if it's a local IP/localhost vs a real domain
      baseUrl = baseUrl.includes("localhost") || baseUrl.match(/^[0-9.]+$/)
        ? `http://${baseUrl}`
        : `https://${baseUrl}`;
    }
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
  
  const isWindows = process.platform === "win32";
  const defaultLocal = path.join(__dirname, "uploads");

  print(`  1) Docker (recommended) -> /data/uploads`);
  print(`  2) Local Folder         -> ${defaultLocal}`);
  print(`  3) Custom Path`);
  print("");

  const storageChoice = await ask("Choose storage method (1/2/3)", "1");
  
  let uploadPath = "/data/uploads";
  if (storageChoice === "2") {
    uploadPath = defaultLocal;
  } else if (storageChoice === "3") {
    const customDefault = isWindows ? "C:\\lootops\\uploads" : "/var/www/lootops/uploads";
    uploadPath = await ask("Enter custom upload directory path", customDefault);
  }

  // Auto-create directory for local setups
  if (storageChoice !== "1") {
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        info(`  ${c.green}✓${c.reset} Automatically created directory: ${uploadPath}`);
      } catch (e) {
        warn(`Could not automatically create ${uploadPath}. You may need to create it manually or check permissions.`);
      }
    } else {
      info(`  ${c.green}✓${c.reset} Using existing directory: ${uploadPath}`);
    }
  } else {
    info(`  ${c.green}✓${c.reset} Docker volume path selected: ${uploadPath}`);
  }

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

  const adminSdkChoice = await askAdminSdk();

  let fbProjectId = "";
  let fbClientEmail = "";
  let fbPrivateKey = "";

  if (adminSdkChoice.method === "parsed") {
    fbProjectId = adminSdkChoice.data.project_id || "";
    fbClientEmail = adminSdkChoice.data.client_email || "";
    fbPrivateKey = adminSdkChoice.data.private_key || "";
    
    if (fbProjectId && fbPrivateKey) {
      info(`  ${c.green}✓${c.reset} Successfully extracted credentials for: ${fbProjectId}`);
    } else {
      warn("  JSON parsed, but missing project_id or private_key. You may need to enter manually.");
    }
  }

  if (adminSdkChoice.method === "manual" || !fbProjectId || !fbPrivateKey) {
    print("");
    fbProjectId    = await ask("Firebase Project ID         (e.g. my-project-12345)");
    fbClientEmail  = await ask("Firebase Client Email       (e.g. firebase-adminsdk-xxx@...)");
    print("");
    info("  Important: To paste a multiline private key manually without breaking,");
    info("  replace line breaks with \\n OR paste the JSON file instead.");
    fbPrivateKey = await ask("Firebase Private Key", "", false);
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 4 — Firebase Client SDK (Frontend)
  // ════════════════════════════════════════════════════════════════════
  section("STEP 4 — Firebase Client SDK (Next.js Frontend)");
  print(`  ${c.yellow}How to get these values:${c.reset}`);
  info("  1. Firebase Console → ⚙️ Project Settings → General");
  info("  2. Scroll to 'Your apps' → click your web app (or create one)");
  info("  3. Copy the config values shown in the firebaseConfig object");
  print("");

  const clientChoice = await askClientConfig();
  
  let fbApiKey = "", fbAuthDomain = "", fbPublicProjectId = "", fbStorageBucket = "", fbMessagingSenderId = "", fbAppId = "";

  if (clientChoice.method === "parsed") {
    fbApiKey = clientChoice.data.apiKey;
    fbAuthDomain = clientChoice.data.authDomain;
    fbPublicProjectId = clientChoice.data.projectId;
    fbStorageBucket = clientChoice.data.storageBucket;
    fbMessagingSenderId = clientChoice.data.messagingSenderId;
    fbAppId = clientChoice.data.appId;
    info(`  ${c.green}✓${c.reset} Successfully extracted client config for: ${fbPublicProjectId}`);
  } else {
    print("");
    fbApiKey            = await ask("NEXT_PUBLIC_FIREBASE_API_KEY           ");
    fbAuthDomain        = await ask("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN       ");
    fbPublicProjectId   = fbProjectId || await ask("NEXT_PUBLIC_FIREBASE_PROJECT_ID       ", fbProjectId);
    fbStorageBucket     = await ask("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET   ");
    fbMessagingSenderId = await ask("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
    fbAppId             = await ask("NEXT_PUBLIC_FIREBASE_APP_ID            ");
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP 5 — SMTP / Email (Optional)
  // ════════════════════════════════════════════════════════════════════
  section("STEP 5 — Email Notifications (Optional)");
  info("Receive alerts when files are uploaded, deleted, or someone logs in.");
  info("Skip this step if you don't want email notifications.");
  print("");

  print("  1) Skip (No email notifications)");
  print("  2) Gmail (Requires App Password)");
  print("  3) Outlook / Office 365");
  print("  4) Yahoo Mail (Requires App Password)");
  print("  5) Custom SMTP");
  print("");
  const providerChoice = await ask("Choose email provider (1-5)", "1");

  let smtpHost = "", smtpPort = "587", smtpSecure = "false";
  let smtpUser = "", smtpPass = "", smtpFrom = "", adminEmail = "";
  let smtpEnabled = providerChoice !== "1" ? "true" : "false";

  if (smtpEnabled === "true") {
    if (providerChoice === "2") {
      smtpHost = "smtp.gmail.com";
      smtpPort = "587";
      info("  Note: You MUST use an App Password, not your real Gmail password.");
      info("  (Google Account → Security → 2-Step Verification → App Passwords)");
    } else if (providerChoice === "3") {
      smtpHost = "smtp-mail.outlook.com";
      smtpPort = "587";
    } else if (providerChoice === "4") {
      smtpHost = "smtp.mail.yahoo.com";
      smtpPort = "587";
      info("  Note: You MUST use an App Password, not your real Yahoo password.");
    } else if (providerChoice === "5") {
      smtpHost = await ask("SMTP Host   ", "smtp.example.com");
      smtpPort = await ask("SMTP Port   ", "587");
    }

    if (providerChoice === "5") {
      smtpSecure = await ask("SMTP Secure (true for port 465)", smtpPort === "465" ? "true" : "false");
    } else {
      smtpSecure = "false"; // 587 uses STARTTLS, which implies secure: false in Nodemailer
    }

    print("");
    smtpUser    = await ask("SMTP Email Address");
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
NEXTJS_PORT=${nextPort}
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
SMTP_PASS="${smtpPass}"
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
  print(`${c.bold}  ✅ Setup is entirely complete!${c.reset}`);
  print("");
  print(`  ${c.dim}Your API key (save this somewhere safe):${c.reset}`);
  print(`  ${c.yellow}${apiKey}${c.reset}`);
  print("");

  if (baseUrl.startsWith("http://") && !baseUrl.includes("localhost")) {
    warn("You're using HTTP on a non-localhost domain.");
    info("  For production, we strongly recommend setting up HTTPS.");
    print("");
  }

  try {
    const hostname = new URL(baseUrl).hostname;
    const isIP = /^[0-9.]+$/.test(hostname);
    if (!isIP && hostname !== "localhost") {
      print(`  ${c.bold}🌐 Domain Configuration${c.reset}`);
      
      let dnsResolved = false;
      try {
        const dns = require('dns');
        const addresses = await dns.promises.resolve4(hostname);
        print(`  ${c.green}✓${c.reset} Domain resolves to: ${addresses.join(', ')}`);
        dnsResolved = true;
      } catch (e) {
        print(`  ${c.yellow}⚠${c.reset} Domain does NOT resolve yet.`);
      }

      if (!dnsResolved) {
        print(`  To connect your domain, add this record in your DNS provider (Cloudflare, Namecheap, etc):`);
        print(`  • Type:  ${c.cyan}A${c.reset}`);
        print(`  • Name:  ${c.cyan}${hostname}${c.reset} (or @ if root domain)`);
        print(`  • Value: ${c.cyan}${localIp}${c.reset} (Replace with your server's public IP)`);
      }
      print("");

      print(`  ${c.bold}🔒 SSL & Nginx Setup (Highly Recommended)${c.reset}`);
      print(`  1. Install Nginx and Certbot:`);
      print(`     ${c.dim}sudo apt install nginx certbot python3-certbot-nginx${c.reset}`);
      print(`  2. Create an Nginx config:`);
      print(`     ${c.dim}sudo nano /etc/nginx/sites-available/${hostname}${c.reset}`);
      print(`     Paste the following inside:`);
      print(`       ${c.cyan}server {${c.reset}`);
      print(`           ${c.cyan}listen 80;${c.reset}`);
      print(`           ${c.cyan}server_name ${hostname};${c.reset}`);
      print(`           ${c.cyan}location / {${c.reset}`);
      print(`               ${c.cyan}proxy_pass http://localhost:${nextPort};${c.reset}`);
      print(`               ${c.cyan}proxy_http_version 1.1;${c.reset}`);
      print(`               ${c.cyan}proxy_set_header Upgrade $http_upgrade;${c.reset}`);
      print(`               ${c.cyan}proxy_set_header Connection 'upgrade';${c.reset}`);
      print(`               ${c.cyan}proxy_set_header Host $host;${c.reset}`);
      print(`               ${c.cyan}proxy_cache_bypass $http_upgrade;${c.reset}`);
      print(`           ${c.cyan}}${c.reset}`);
      print(`       ${c.cyan}}${c.reset}`);
      print(`  3. Enable the site and get a free SSL certificate:`);
      print(`     ${c.dim}sudo ln -s /etc/nginx/sites-available/${hostname} /etc/nginx/sites-enabled/${c.reset}`);
      print(`     ${c.dim}sudo certbot --nginx -d ${hostname}${c.reset}`);
      print("");
    }
  } catch (e) {}

  let isCustomDomain = false;
  let hostname = "";
  try {
    hostname = new URL(baseUrl).hostname;
    const isIP = /^[0-9.]+$/.test(hostname);
    if (!isIP && hostname !== "localhost") {
      isCustomDomain = true;
    }
  } catch(e) {}

  print(`  ${c.cyan}What would you like to do now?${c.reset}`);
  print(`  1) Start server locally (Development)`);
  print(`  2) Start server via Docker (Production)`);
  print(`  3) Stop Docker container`);
  print(`  4) View Docker logs`);
  print(`  5) Enable auto-start on boot (systemd)`);
  if (isCustomDomain) {
    print(`  6) Auto-Configure Nginx & SSL (Requires sudo)`);
    print(`  7) Exit`);
  } else {
    print(`  6) Exit`);
  }
  print("");

  const maxOpt = isCustomDomain ? "7" : "6";
  const startChoice = await ask(`Choose option (1-${maxOpt})`, "2");
  rl.close();

  if (startChoice === "1") {
    console.log(`\n  📦 Installing NPM dependencies...`);
    spawnSync(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ["install"], { stdio: "inherit" });
    console.log(`\n  🚀 Starting development server...`);
    spawnSync(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ["run", "dev"], { stdio: "inherit" });
  } else if (startChoice === "2") {
    console.log(`\n  🐳 Starting Docker container...`);
    spawnSync("docker", ["compose", "--env-file", ".env.local", "up", "-d"], { stdio: "inherit" });
    console.log(`\n  ✅ Docker started! (Container is set to auto-restart on system reboot)`);
    console.log(`  Dashboard: ${baseUrl}`);
    console.log(`  Logs:      docker compose --env-file .env.local logs -f`);
  } else if (startChoice === "3") {
    console.log(`\n  🛑 Stopping Docker container...`);
    spawnSync("docker", ["compose", "down"], { stdio: "inherit" });
    console.log(`\n  ✅ Docker stopped.`);
  } else if (startChoice === "4") {
    console.log(`\n  📄 Viewing Docker logs (Press Ctrl+C to exit)...`);
    spawnSync("docker", ["compose", "--env-file", ".env.local", "logs", "-f"], { stdio: "inherit" });
  } else if (startChoice === "5") {
    // Auto-start on boot via systemd
    console.log(`\n  ⚙️  Setting up systemd service for auto-start on boot...`);
    const workDir = process.cwd();
    const serviceContent = `[Unit]
Description=Local-Cloud Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${workDir}
ExecStart=/usr/bin/docker compose --env-file ${workDir}/.env.local up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
`;
    const svcPath = path.join(os.tmpdir(), "local-cloud.service");
    fs.writeFileSync(svcPath, serviceContent);
    spawnSync("sudo", ["mv", svcPath, "/etc/systemd/system/local-cloud.service"], { stdio: "inherit" });
    spawnSync("sudo", ["systemctl", "daemon-reload"], { stdio: "inherit" });
    spawnSync("sudo", ["systemctl", "enable", "local-cloud.service"], { stdio: "inherit" });
    spawnSync("sudo", ["systemctl", "start", "local-cloud.service"], { stdio: "inherit" });
    console.log(`\n  ✅ Auto-start enabled! Your server will now start automatically on every system reboot.`);
    console.log(`  Manage with: sudo systemctl status local-cloud`);
  } else if (startChoice === "6" && isCustomDomain) {
    console.log(`\n  ⚙️  Automatically configuring Nginx & SSL...`);
    console.log(`  [1/5] Installing nginx and certbot...`);
    spawnSync("sudo", ["apt", "update"], { stdio: "inherit" });
    spawnSync("sudo", ["apt", "install", "-y", "nginx", "certbot", "python3-certbot-nginx"], { stdio: "inherit" });

    console.log(`\n  [2/5] Clearing port 80 conflicts...`);
    const port80check = spawnSync("sudo", ["ss", "-tlnp"], { encoding: "utf8" });
    const port80out = (port80check.stdout || "") + (port80check.stderr || "");
    if (port80out.includes("apache2")) {
      console.log(`  → Apache2 detected on port 80. Stopping and disabling apache2...`);
      spawnSync("sudo", ["systemctl", "stop", "apache2"], { stdio: "inherit" });
      spawnSync("sudo", ["systemctl", "disable", "apache2"], { stdio: "inherit" });
    } else if (port80out.includes(":80") && port80out.includes("nginx")) {
      console.log(`  → Old Nginx process detected. Stopping it...`);
      spawnSync("sudo", ["systemctl", "stop", "nginx"], { stdio: "inherit" });
    } else if (port80out.includes(":80")) {
      console.log(`  → Unknown process on port 80. Force-killing it...`);
      spawnSync("sudo", ["fuser", "-k", "80/tcp"], { stdio: "inherit" });
    } else {
      console.log(`  → Port 80 is free. Continuing...`);
    }

    console.log(`\n  [3/5] Generating Nginx configuration for ${hostname}...`);
    const nginxConfig = `server {
    listen 80;
    server_name ${hostname};
    location / {
        proxy_pass http://localhost:${nextPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
    const tmpPath = path.join(os.tmpdir(), `nginx-${hostname}`);
    fs.writeFileSync(tmpPath, nginxConfig);
    spawnSync("sudo", ["mv", tmpPath, `/etc/nginx/sites-available/${hostname}`], { stdio: "inherit" });
    spawnSync("sudo", ["rm", "-f", "/etc/nginx/sites-enabled/default"], { stdio: "inherit" });

    console.log(`\n  [4/5] Starting Nginx and enabling site...`);
    spawnSync("sudo", ["ln", "-sf", `/etc/nginx/sites-available/${hostname}`, `/etc/nginx/sites-enabled/`], { stdio: "inherit" });
    spawnSync("sudo", ["nginx", "-t"], { stdio: "inherit" });
    spawnSync("sudo", ["systemctl", "start", "nginx"], { stdio: "inherit" });
    spawnSync("sudo", ["systemctl", "enable", "nginx"], { stdio: "inherit" });

    console.log(`\n  [5/5] Requesting SSL Certificate from Let's Encrypt...`);
    spawnSync("sudo", ["certbot", "--nginx", "-d", hostname, "--non-interactive", "--agree-tos", "--register-unsafely-without-email"], { stdio: "inherit" });

    console.log(`\n  ✅ Nginx and SSL setup complete!`);
    console.log(`  Visit your site at: https://${hostname}`);
    console.log(`\n  To start the actual server now, run:`);
    console.log(`  docker compose --env-file .env.local up -d`);
  } else {
    console.log("\n  Bye!");
  }
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err.message);
  process.exit(1);
});
