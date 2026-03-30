import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import session from 'express-session';
import { google } from 'googleapis';
import type { Auth } from 'googleapis';

// Load environment variables
dotenv.config();

// --- Startup validation: fail fast if required secrets are missing ---
if (!process.env.SESSION_SECRET) {
    console.error("[Server] FATAL: SESSION_SECRET este lipsă din fișierul .env. Oprire server.");
    process.exit(1);
}

const app = express();
const PORT = 3000;

// Extend express-session to include typed tokens
declare module 'express-session' {
    interface SessionData {
        tokens?: Auth.Credentials;
    }
}

// Middleware to parse JSON bodies
app.use(express.json({ limit: '50mb' }));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'none' }
}));

const oauth2Client = new google.auth.OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    process.env.OAUTH_REDIRECT_URI
);

// Health check endpoint
app.get('/api/ping', (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Proxy Endpoint - This is the most secure way to handle the API key
app.post('/api/ai/generate', async (req, res) => {
    try {
        const { model, contents, config } = req.body;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[Server AI Proxy] Error: GEMINI_API_KEY lipsește din environment.");
            return res.status(500).json({ error: "Cheia API Gemini nu este configurată pe server. Te rugăm să o adaugi în .env ca GEMINI_API_KEY." });
        }

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: model || "gemini-3-flash-preview",
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

// Endpoint to provide the API key to the frontend (Legacy fallback)
app.get('/api/config', (req, res) => {
    const key = process.env.GEMINI_API_KEY ?? "";
    console.log(`[Server] API Key Request. Found: ${key ? 'YES (starts with ' + key.substring(0, 4) + '...)' : 'NO'}`);
    res.json({ geminiApiKey: key });
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
            const fileMetadata = {
                name: 'PharmaBaristaDB.json',
                mimeType: 'application/json'
            };

            const media = {
                mimeType: 'application/json',
                body: JSON.stringify(data)
            };

            const resList = await drive.files.list({
                q: "name = 'PharmaBaristaDB.json' and trashed = false",
                fields: 'files(id)',
            });

            if (resList.data.files && resList.data.files.length > 0) {
                const fileId = resList.data.files[0].id;
                await drive.files.update({
                    fileId: fileId!,
                    media: media,
                });
            } else {
                await drive.files.create({
                    requestBody: fileMetadata,
                    media: media,
                });
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
            scope: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
            prompt: 'consent'
        });
        console.log(`[OAuth] Auth URL: ${authUrl}`);
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
            res.send(`
                <html>
                    <body>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                                window.close();
                            } else {
                                window.location.href = '/';
                            }
                        </script>
                        <p>Autentificare reușită. Această fereastră se va închide automat.</p>
                    </body>
                </html>
            `);
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
        console.log(`[Server] Production mode. Serving static files from: ${distPath}`);
        app.use(express.static(distPath));

        // Express 5 wildcard fix: use *all instead of (.*) or *
        app.get('*all', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    // Always listen on the specified port in this environment
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`[Server] Started successfully on http://0.0.0.0:${PORT}`);
        console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

startServer().catch(err => {
    console.error("[Server] Critical failure during startup:", err);
    process.exit(1);
});

export default app;
