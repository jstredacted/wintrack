// One-time JWT generation script (no npm install needed — uses Node built-in crypto)
// Usage: SUPABASE_JWT_SECRET=<your-secret> node scripts/gen-jwt.mjs
// Get secret: Supabase Dashboard -> Project Settings -> API -> JWT Keys -> Legacy JWT Secret (HS256)
// Paste output into .env.local

import { createHmac } from "node:crypto";

const userId = crypto.randomUUID();
const secret = process.env.SUPABASE_JWT_SECRET;
if (!secret) { console.error("Set SUPABASE_JWT_SECRET env var first"); process.exit(1); }

const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
const payload = Buffer.from(JSON.stringify({
  sub: userId,
  role: "authenticated",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10, // 10 years
})).toString("base64url");
const sig = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");

console.log(`VITE_USER_ID=${userId}`);
console.log(`VITE_USER_JWT=${header}.${payload}.${sig}`);
// Paste this output into .env.local
