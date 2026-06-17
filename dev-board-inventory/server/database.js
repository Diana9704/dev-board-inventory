// database.js - Supabase PostgreSQL 版本
const { Pool } = require('pg');

// 从环境变量读取数据库连接地址
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // Supabase 需要 SSL
  }
});

// 初始化数据库表
async function initDatabase() {
  const client = await pool.connect();
  try {
    // 创建用户表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(50) NOT NULL,
        role VARCHAR(20) DEFAULT 'manager',
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建开发板表
    await client.query(`
      CREATE TABLE IF NOT EXISTS boards (
        id SERIAL PRIMARY KEY,
        model VARCHAR(100) UNIQUE NOT NULL,
        stock INTEGER DEFAULT 0 CHECK (stock >= 0),
        manager_id INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建操作日志表
    await client.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(50),
        detail TEXT,
        ip VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建库存变更历史表
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_history (
        id SERIAL PRIMARY KEY,
        board_id INTEGER REFERENCES boards(id),
        old_stock INTEGER,
        new_stOCK INTEGER,
        operator_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 插入默认管理员（如果不存在）
    // 注意：密码是 "admin123" 的 bcrypt 哈希值
    await client.query(`
      INSERT INTO users (username, password, name, role)
      VALUES 
        ('admin1', '$2b$10$wQYv2GqH.l5qF1aN2ZqU.OWBzQz6JzL5zYzYzYzYzYzYzYzYzYz', '超级管理员1', 'admin'),
        ('admin2', '$2b$10$wQYv2GqH.l5qF1aN2ZqU.OWBzQz6JzL5zYzYzYzYzYzYzYzYzYz', '超级管理员2', 'admin')
      ON CONFLICT (username) DO NOTHING
    `);

    console.log('✅ 数据库初始化成功');
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err);
  } finally {
    client.release();
  }
}

// 导出 pool 和 initDatabase
module.exports = { pool, initDatabase };
