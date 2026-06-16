const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

router.post('/', verifyToken, requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: '请上传文件' });
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (rows.length < 2) return res.status(400).json({ message: '文件数据为空' });

    let success = 0, failed = 0, errors = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[0] || !row[1] || !row[2]) { failed++; errors.push(`第 ${i + 1} 行：数据不完整`); continue; }
      const name = String(row[0]).trim();
      const username = String(row[1]).trim().toLowerCase();
      const model = String(row[2]).trim();
      const stock = parseInt(row[3]);
      if (!/^[a-z0-9]+$/.test(username)) { failed++; errors.push(`第 ${i + 1} 行：账号格式错误`); continue; }
      if (isNaN(stock) || stock < 0) { failed++; errors.push(`第 ${i + 1} 行：库存必须为非负整数`); continue; }

      let user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) {
        const hash = bcrypt.hashSync('123456', 10);
        const userId = generateId();
        db.prepare(`INSERT INTO users (id, username, name, password, role, status, created_at, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(userId, username, name, hash, 'owner', 'active', new Date().toISOString(), 1);
        user = { id: userId };
      }

      const existingBoard = db.prepare('SELECT * FROM boards WHERE LOWER(model) = LOWER(?) AND owner_id = ?').get(model, user.id);
      if (existingBoard) {
        db.prepare('UPDATE boards SET stock = ?, updated_at = ?, updated_by = ? WHERE id = ?').run(stock, new Date().toISOString(), '系统导入', existingBoard.id);
      } else {
        db.prepare(`INSERT INTO boards (id, model, stock, owner_id, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(generateId(), model, stock, user.id, new Date().toISOString(), new Date().toISOString(), '系统导入');
      }
      success++;
    }

    db.prepare(`INSERT INTO logs (id, user_id, username, name, action, detail, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(generateId(), req.user.id, req.user.username, req.user.name || req.user.username, '批量导入', `成功导入 ${success} 条，失败 ${failed} 条`, new Date().toISOString());
    res.json({ success, failed, errors: errors.slice(0, 20) });
  } catch (err) {
    res.status(400).json({ message: '文件解析失败', error: err.message });
  }
});

module.exports = router;
