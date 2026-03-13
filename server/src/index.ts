import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import authRoutes from './routes/authRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initializeSchema, closePool } from './db/database.js';
import { generalLimiter } from './middleware/rateLimiter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(cookieParser());
app.use(generalLimiter);
app.use(express.json({ limit: '1mb' }));

// Initialize database
await initializeSchema();

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', apiRoutes);

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    closePool();
    process.exit(0);
});
process.on('SIGINT', () => {
    closePool();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`FlowState server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    if (!process.env.GEMINI_API_KEY) {
        console.log('Note: GEMINI_API_KEY not set. AI chat will use fallback planning engine.');
    }
});

export default app;
