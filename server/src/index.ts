import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { getDb, closeDb } from './db/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Initialize database
getDb();

// API routes
app.use('/api', apiRoutes);

// Serve static frontend in production
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    closeDb();
    process.exit(0);
});
process.on('SIGINT', () => {
    closeDb();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`FlowState server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    if (!process.env.OPENAI_API_KEY) {
        console.log('Note: OPENAI_API_KEY not set. AI chat will use built-in planning engine.');
    }
});

export default app;
