import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'flowstate.db');

let db: Database.Database;

export function getDb(): Database.Database {
    if (!db) {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initializeSchema(db);
    }
    return db;
}

function initializeSchema(db: Database.Database) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      settings TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      vision TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','completed','archived')),
      target_date TEXT,
      priority INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      goal_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'active' CHECK(status IN ('active','paused','completed','archived')),
      priority INTEGER DEFAULT 0,
      deadline TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT,
      goal_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','in_progress','completed','cancelled','deferred')),
      priority INTEGER DEFAULT 0,
      energy_level TEXT DEFAULT 'medium' CHECK(energy_level IN ('low','medium','high')),
      estimated_minutes INTEGER DEFAULT 30,
      actual_minutes INTEGER,
      due_date TEXT,
      scheduled_date TEXT,
      scheduled_slot TEXT CHECK(scheduled_slot IN ('morning','afternoon','evening', NULL)),
      recurrence TEXT,
      tags TEXT DEFAULT '[]',
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS work_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_minutes INTEGER,
      energy_before TEXT,
      energy_after TEXT,
      notes TEXT DEFAULT '',
      focus_rating INTEGER CHECK(focus_rating BETWEEN 1 AND 5),
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS daily_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_date TEXT NOT NULL,
      task_order TEXT DEFAULT '[]',
      notes TEXT DEFAULT '',
      reflection TEXT DEFAULT '',
      energy_pattern TEXT DEFAULT 'balanced',
      planned_minutes INTEGER DEFAULT 0,
      completed_minutes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, plan_date)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      messages TEXT DEFAULT '[]',
      context TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_goal ON projects(goal_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(user_id, due_date);
    CREATE INDEX IF NOT EXISTS idx_work_sessions_user ON work_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_work_sessions_task ON work_sessions(task_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_daily_plans_user ON daily_plans(user_id, plan_date);
  `);
}

export function closeDb() {
    if (db) {
        db.close();
    }
}
