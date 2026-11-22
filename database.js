const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'taskora.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')) DEFAULT 'MEDIUM',
    status TEXT CHECK(status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE')) DEFAULT 'TODO',
    category TEXT DEFAULT 'General',
    due_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
`);

// Seed default demo account and sample tasks if empty
function seedInitialData() {
  const checkUserStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existingUser = checkUserStmt.get('demo@taskora.com');

  if (!existingUser) {
    const demoUserId = 'usr_demo_c2_001';
    const passwordHash = bcrypt.hashSync('Taskora123!', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name)
      VALUES (?, ?, ?, ?)
    `);
    insertUser.run(demoUserId, 'demo@taskora.com', passwordHash, 'Alex Vance (C2 Lead)');

    const insertTask = db.prepare(`
      INSERT INTO tasks (id, user_id, title, description, priority, status, category, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
    const in3DaysStr = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0];
    const in5DaysStr = new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0];

    const sampleTasks = [
      {
        id: 'tsk_001',
        title: 'Review C2 Infrastructure Telemetry & Status Logs',
        description: 'Verify node cluster latency, CPU thresholds, and alert routing for Tier-1 services.',
        priority: 'URGENT',
        status: 'IN_PROGRESS',
        category: 'Operations',
        due_date: todayStr
      },
      {
        id: 'tsk_002',
        title: 'Finalize Sprint 42 Priority Matrix',
        description: 'Align cross-functional operational milestones and assign key deliverables for the week.',
        priority: 'HIGH',
        status: 'TODO',
        category: 'Planning',
        due_date: tomorrowStr
      },
      {
        id: 'tsk_003',
        title: 'Conduct Automated Security & Audit Check',
        description: 'Audit service token rotations and inspect firewall ingress configurations.',
        priority: 'MEDIUM',
        status: 'IN_REVIEW',
        category: 'Security',
        due_date: in3DaysStr
      },
      {
        id: 'tsk_004',
        title: 'Update Golden Hour Deployment Checklist',
        description: 'Document standard operating procedures for the new zero-downtime rollback pipeline.',
        priority: 'LOW',
        status: 'DONE',
        category: 'Documentation',
        due_date: in5DaysStr
      },
      {
        id: 'tsk_005',
        title: 'Calibrate C2 Sensor Synchronization Buffers',
        description: 'Ensure low-overhead queue drain rates under peak evening traffic.',
        priority: 'HIGH',
        status: 'TODO',
        category: 'Engineering',
        due_date: in3DaysStr
      }
    ];

    for (const task of sampleTasks) {
      insertTask.run(
        task.id,
        demoUserId,
        task.title,
        task.description,
        task.priority,
        task.status,
        task.category,
        task.due_date
      );
    }
    console.log('Seeded demo user (demo@taskora.com) and initial C2 tasks successfully.');
  }
}

seedInitialData();

module.exports = db;
