import pg from 'pg';
import { randomUUID } from 'crypto';
import { DataType, newDb } from 'pg-mem';

const { Pool } = pg;

let pool: pg.Pool;
let usingInMemoryDb = false;

function createInMemoryPool(): pg.Pool {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({
        name: 'gen_random_uuid',
        returns: DataType.uuid,
        impure: true,
        implementation: () => randomUUID(),
    });
    const adapter = db.adapters.createPg();
    return new adapter.Pool() as unknown as pg.Pool;
}

export function getPool(): pg.Pool {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            usingInMemoryDb = true;
            console.warn('DATABASE_URL not set. Using in-memory database for local development.');
            pool = createInMemoryPool();
            return pool;
        }

        pool = new Pool({
            connectionString,
            ssl: connectionString.includes('neon.tech') || process.env.NODE_ENV === 'production'
                ? { rejectUnauthorized: false }
                : false,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        pool.on('error', (err) => {
            console.error('DB pool error:', err);
        });
    }
    return pool;
}

// Alias for older imports
export const getDb = getPool;

export async function initializeSchema(): Promise<void> {
    const p = getPool();
    if (!usingInMemoryDb) {
        await p.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    }

    await p.query(`
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL DEFAULT 'User',
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL DEFAULT '',
            email_verified BOOLEAN DEFAULT FALSE,
            plan TEXT DEFAULT 'free' CHECK(plan IN ('free','pro')),
            role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            vision TEXT DEFAULT '',
            status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','completed','archived')),
            target_date DATE,
            priority INTEGER DEFAULT 0,
            tags JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','completed','archived')),
            priority INTEGER DEFAULT 0,
            deadline DATE,
            tags JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
            goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled','deferred')),
            priority INTEGER DEFAULT 0,
            energy_level TEXT DEFAULT 'medium' CHECK(energy_level IN ('low','medium','high')),
            estimated_minutes INTEGER DEFAULT 30,
            actual_minutes INTEGER,
            due_date DATE,
            scheduled_date DATE,
            scheduled_slot TEXT CHECK(scheduled_slot IS NULL OR scheduled_slot IN ('morning','afternoon','evening')),
            recurrence TEXT,
            tags JSONB DEFAULT '[]',
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS work_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            ended_at TIMESTAMPTZ,
            duration_minutes INTEGER,
            energy_before TEXT,
            energy_after TEXT,
            notes TEXT DEFAULT '',
            focus_score INTEGER CHECK(focus_score BETWEEN 1 AND 5),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS daily_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            task_order JSONB DEFAULT '[]',
            planned_minutes INTEGER DEFAULT 0,
            notes TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, date)
        );

        CREATE TABLE IF NOT EXISTS activity_log (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS ai_conversations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            messages JSONB DEFAULT '[]',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
        CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_date);
        CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON work_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
    `);

    console.log('Database schema initialized');
}

export async function closePool(): Promise<void> {
    if (pool) {
        await pool.end();
    }
}
