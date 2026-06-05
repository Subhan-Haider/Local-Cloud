/**
 * Firebase Admin SDK initialization for server-side token verification.
 */
const admin = require("firebase-admin");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env.local") });

if (!admin.apps.length) {
  // Use environment variables for the service account credentials
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

module.exports = admin;
