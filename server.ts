import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import session from 'express-session';
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

// Extend express-session to include typed tokens
declare module 'express-session' {
  interface SessionData {
    tokens?: Auth.Credentials;
  }
}

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────
// FIX: Body limit separat — mic pentru rute normale, mai mare doar pentru AI
app.use((req, res, next) => {
  if (req.path === '/api/ai/generate') {
    express.json({ limit: '15mb' })(req, res, next);
  } else {
    express.json({ limit: '512kb' })(req, res, next);
  }
});

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, // FIX: nu crea sesiuni goale pentru bots
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24h
  }
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

// ── RATE LIMITING ───────────────────────────────────────────────────────────
// FIX: Rate limiting dedicat pentru endpoint-ul AI (anti-abuz cheie API)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 15,             // max 15 cereri/minut per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe cereri AI. Incearca din nou peste un minut.' }
});

// Rate limiting general (anti-DoS)
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

// Health check endpoint
app.get('/api/ping', (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Proxy Endpoint — cheia API ramane pe server, nu ajunge la client
// FIX: endpoint-ul /api/config (legacy) a fost eliminat — expunea cheia API public
app.post('/api/ai/generate', aiRateLimiter, async (req, res) => {
  try {
    const { model, contents, config } = req.body;

    // FIX: Validare input
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
      console.error("[Server AI Proxy] Error: GEMINI_API_KEY lipseste din environment.");
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
    console.error("[Server AI Proxy] Execution Error:", error);
    const message = error instanceof Error ? error.message : "Eroare la procesarea cererii AI pe server.";
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  // OAuth endpoints
  app.get('/api/auth/tokens', (req, res) => {
    const tokens = req.session.tokens;
    if (!tokens) {
      return res.status(401).send('No tokens found');
    }
    res.json(tokens);
  });

  app.post('/api/sync', async (req, res) => {
    const tokens = req.session.tokens;
    if (!tokens) {
      return res.status(401).send('No tokens found');
    }

    const data = req.body;
    oauth2Client.setCredentials(tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    try {
      const fileMetadata = { name: 'PharmaBaristaDB.json', mimeType: 'application/json' };
      const media = { mimeType: 'application/json', body: JSON.stringify(data) };

      const resList = await drive.files.list({
        q: "name = 'PharmaBaristaDB.json' and trashed = false",
        fields: 'files(id)',
      });

      if (resList.data.files && resList.data.files.length > 0) {
        const fileId = resList.data.files[0].id;
        await drive.files.update({ fileId: fileId!, media: media });
      } else {
        await drive.files.create({ requestBody: fileMetadata, media: media });
      }

      res.json({ success: true });
    } catch (error: unknown) {
      console.error('Error syncing to Drive:', error);
      res.status(500).send('Error syncing to Drive');
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
    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      req.session.tokens = tokens;

      // FIX: postMessage cu originea specificata — nu mai este '*'
      const safeOrigin = JSON.stringify(APP_ORIGIN);
      res.send('<html><body><script>var o=' + safeOrigin + ';if(window.opener){window.opener.postMessage({type:"OAUTH_AUTH_SUCCESS"},o);window.close();}else{window.location.href="/";}' + '<\/script><p>Autentificare reusita. Aceasta fereastra se va inchide automat.</p></body></html>');
    } catch (error: unknown) {
      console.error('Error exchanging code for tokens:', error);
      res.status(500).send('Error exchanging code for tokens');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log('[Server] Production mode. Serving static files from: ' + distPath);
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log('[Server] Started successfully on http://0.0.0.0:' + PORT);
    console.log('[Server] Environment: ' + (process.env.NODE_ENV || 'development'));
    console.log('[Server] APP_ORIGIN: ' + APP_ORIGIN);
  });
}

startServer().catch(err => {
  console.error("[Server] Critical failure during startup:", err);
  process.exit(1);
});

export default app;
