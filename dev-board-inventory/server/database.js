const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'inventory.db')
  : path.join(__dirname, 'inventory.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      name TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      time TEXT NOT NULL
    )
  `);

  const admin1 = db.prepare('SELECT * FROM users WHERE username = ?').get('admin1');
  if (!admin1) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`INSERT INTO users (id, username, name, password, role, status, created_at, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('admin1', 'admin1', '管理员1', hash, 'admin', 'active', new Date().toISOString(), 0);
    db.prepare(`INSERT INTO users (id, username, name, password, role, status, created_at, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('admin2', 'admin2', '管理员2', hash, 'admin', 'active', new Date().toISOString(), 0);
  }
}

initDatabase();
module.exports = db;
