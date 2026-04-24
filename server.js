/**
 * Aurx AI — Server (unified)
 * ──────────────────────────
 * Rutas HTML limpias:
 *   GET /          → public/index.html
 *   GET /login     → public/login.html
 *   GET /chat-ai   → public/chat-ai.html
 *
 * Rutas API:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/ai/chat         (requiere token)
 *   GET  /api/ai/models       (requiere token)
 *   GET  /api/users/profile   (requiere token)
 *   GET  /api/users/control   (requiere token)
 *
 * Variables de entorno requeridas (.env):
 *   PORT, FIREBASE_SERVICE_ACCOUNT, FIREBASE_DB_URL, FIREBASE_API_KEY
 *   OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, GROK_API_KEY
 *
 * Uso:
 *   npm install
 *   npm start        (producción)
 *   npm run dev      (desarrollo con auto-reload)
 */

import 'dotenv/config';
import express  from 'express';
import cors     from 'cors';
import path     from 'path';
import { fileURLToPath } from 'url';

import apiRoutes    from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app    = express();
const PORT   = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');

/* ─────────────────────────────────────────────
   Global middleware
───────────────────────────────────────────── */
app.use(cors());
app.use(express.json());

/* ─────────────────────────────────────────────
   Static files  (css/, js/, assets/)
   index:false → prevent Express from auto-serving index.html on /
───────────────────────────────────────────── */
app.use(express.static(PUBLIC, { index: false }));

/* ─────────────────────────────────────────────
   Health-check
───────────────────────────────────────────── */
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/* ─────────────────────────────────────────────
   API routes  →  /api/...
───────────────────────────────────────────── */
app.use('/api', apiRoutes);

/* ─────────────────────────────────────────────
   HTML routes (clean URLs)
───────────────────────────────────────────── */
app.get('/',        (_req, res) => res.sendFile(path.join(PUBLIC, 'index.html')));
app.get('/login',   (_req, res) => res.sendFile(path.join(PUBLIC, 'login.html')));
app.get('/chat-ai', (_req, res) => res.sendFile(path.join(PUBLIC, 'chat-ai.html')));

/* ─────────────────────────────────────────────
   Global error handler
───────────────────────────────────────────── */
app.use(errorHandler);

/* ─────────────────────────────────────────────
   404 — anything else → home
───────────────────────────────────────────── */
app.use((_req, res) => res.redirect('/'));

/* ─────────────────────────────────────────────
   Start
───────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n  ✦ Aurx AI corriendo en → http://localhost:${PORT}\n`);
});
