import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';
import errorHandler from './middlewares/error.middleware.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || true,   // Allow same-origin; set CORS_ORIGIN in .env for custom domains
  credentials: true,                          // Required for httpOnly cookies
}));
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
