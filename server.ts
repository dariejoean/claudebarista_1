import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
// Body limit: mic pentru rute normale, mai mare doar pentru AI (imagini)
app.use((req, res, next) => {
  if (req.path === '/api/ai/generate') {
    express.json({ limit: '15mb' })(req, res, next);
  } else {
    express.json({ limit: '512kb' })(req, res, next);
  }
});

// ── RATE LIMITING ─────────────────────────────────────────────────────────────
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

// ── MODELE PERMISE ────────────────────────────────────────────────────────────
const ALLOWED_MODELS = [
  'gemini-2.5-flash-preview-04-17',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.0-pro'
];

// ── ENDPOINTS ─────────────────────────────────────────────────────────────────
app.get('/api/ping', (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Proxy — cheia API ramane pe server, nu ajunge la client
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
      return res.status(503).json({ error: "Cheia API Gemini nu este configurata pe server." });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: model || "gemini-2.0-flash",
      contents,
      config
    });
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare la procesarea cererii AI pe server.";
    res.status(500).json({ error: message });
  }
});

// ── STATIC FILES & SPA ────────────────────────────────────────────────────────
// IMPORTANT: In productie (Vercel), inregistram rutele static SINCRON la incarcarea modulului.
// Aceasta previne race conditions in mediul serverless.
const distPath = path.join(process.cwd(), 'dist');

if (process.env.NODE_ENV === 'production') {
  // Serveste fisierele Vite built (dist/) sincron
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        res.status(500).json({ error: 'Eroare la servirea aplicatiei. Verifica ca build-ul Vite a rulat.' });
      }
    });
  });
} else {
  // Mod dezvoltare: Vite dev server cu HMR
  (async () => {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log('[Server] ClaudeBarista 1.0 (dev) pe http://0.0.0.0:' + PORT);
      console.log('[Server] Environment: development');
    });
  })().catch(err => {
    console.error("[Server] Dev startup failure:", err);
    process.exit(1);
  });
}

// In productie pe Vercel, app.listen() nu e necesar — Vercel foloseste export default app.
// Pentru productie standalone (ex: VPS), deblocheaza urmatoarea linie:
// if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
//   app.listen(PORT, "0.0.0.0", () => console.log('[Server] ClaudeBarista 1.0 pe port ' + PORT));
// }

export default app;
