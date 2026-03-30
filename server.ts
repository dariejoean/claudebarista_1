import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import cookieSession from 'cookie-session';
import { google } from 'googleapis';
import type { Auth } from 'googleapis';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// --- Startup validation: fail fast if required secrets are missing ---
if (!process.env.SESSION_SECRET) {
  console.error("[Server] FATAL: SESSION_SECRET este lipsa din fisierul .env. Oprire server.");
  process.exit(1);
}

const app = express();
const PORT = 3000;
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:3000';

// cookie-session stocheaza tokens IN cookie (semnat cu SESSION_SECRET)
// Nu are nevoie de server-side store — functioneaza perfect pe Vercel serverless
declare module 'cookie-session' {
  interface CookieSessionObject {
    tokens?: Auth.Credentials;
  }
}

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────
// Body limit separat — mic pentru rute normale, mai mare doar pentru AI (imagini)
app.use((req, res, next) => {
  if (req.path === '/api/ai/generate') {
    express.json({ limit: '15mb' })(req, res, next);
  } else {
    express.json({ limit: '512kb' })(req, res, next);
  }
});

// FIX VERCEL: cookie-session in loc de express-session
// - Stateless: tokenii OAuth sunt stocati in cookie semnat (nu in memorie server)
// - Functioneaza pe orice platforma serverless (Vercel, AWS Lambda, etc.)
app.use(cookieSession({
  name: 'pb_session',
  secret: process.env.SESSION_SECRET,
  maxAge: 24 * 60 * 60 * 1000, // 24h
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  httpOnly: true
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

// ── RATE LIMITING ───────────────────────────────────────────────────────────
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe cereri AI. Incearca din nou peste un minut.' }
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe cereri. Incearca din nou mai tarziu.' }
});

app.use('/api/', generalLimiter);

// ── MODELE PERMISE ──────────────────────────────────────────────────────────
const ALLOWED_MODELS = [
  'gemini-3-flash-preview',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro'
];

// ── ENDPOINTS ───────────────────────────────────────────────────────────────

app.get('/api/ping', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Proxy — cheia API ramane pe server, nu ajunge la client
// Endpoint-ul /api/config (legacy) a fost eliminat — expunea cheia API public
app.post('/api/ai/generate', aiRateLimiter, async (req, res) => {
  try {
    const { model, contents, config } = req.body;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Campul "contents" este obligatoriu si trebuie sa fie un array.' });
    }
    if (model && !ALLOWED_MODELS.includes(model)) {
      return res.status(400).json({ error: 'Modelul "' + model + '" nu este permis.' });
    }
    if (config && JSON.stringify(config).length > 2000) {
      return res.status(400).json({ error: 'Configuratia este prea mare.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Cheia API Gemini nu este configurata pe server." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || "gemini-2.0-flash",
      contents,
      config
    });
    res.json(response);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Eroare la procesarea cererii AI pe server.";
    res.status(500).json({ error: message });
  }
});

// ── OAUTH ENDPOINTS ─────────────────────────────────────────────────────────

app.get('/api/auth/tokens', (req, res) => {
  const tokens = req.session?.tokens;
  if (!tokens) return res.status(401).json({ error: 'No tokens found' });
  res.json(tokens);
});

app.post('/api/sync', async (req, res) => {
  const tokens = req.session?.tokens;
  if (!tokens) return res.status(401).json({ error: 'No tokens found' });

  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const fileMetadata = { name: 'PharmaBaristaDB.json', mimeType: 'application/json' };
    const media = { mimeType: 'application/json', body: JSON.stringify(req.body) };

    const resList = await drive.files.list({
      q: "name = 'PharmaBaristaDB.json' and trashed = false",
      fields: 'files(id)'
    });

    if (resList.data.files && resList.data.files.length > 0) {
      await drive.files.update({ fileId: resList.data.files[0].id!, media });
    } else {
      await drive.files.create({ requestBody: fileMetadata, media });
    }
    res.json({ success: true });
  } catch (error: unknown) {
    console.error('Error syncing to Drive:', error);
    res.status(500).json({ error: 'Error syncing to Drive' });
  }
});

app.get('/api/auth/url', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file'
    ],
    prompt: 'consent'
  });
  res.json({ url: authUrl });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    // Stocare in cookie-session (semnat, httpOnly, nu in memorie server)
    req.session!.tokens = tokens;

    const safeOrigin = JSON.stringify(APP_ORIGIN);
    res.send('<html><body><script>var o=' + safeOrigin + ';if(window.opener){window.opener.postMessage({type:"OAUTH_AUTH_SUCCESS"},o);window.close();}else{window.location.href="/";}' + '<\/script><p>Autentificare reusita.</p></body></html>');
  } catch (error: unknown) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Error exchanging code for tokens');
  }
});

// ── STATIC FILES & SPA ──────────────────────────────────────────────────────

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log('[Server] Started on http://0.0.0.0:' + PORT);
    console.log('[Server] Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('[Server] APP_ORIGIN: ' + APP_ORIGIN);
  });
}

startServer().catch(err => {
  console.error("[Server] Critical failure:", err);
  process.exit(1);
});

export default app;
