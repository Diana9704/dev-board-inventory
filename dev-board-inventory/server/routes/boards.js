const express = require('express');
const db = require('../database');
const { verifyToken } = require('../middleware/auth');
const XLSX = require('xlsx');
const router = express.Router();

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

function addLog(user, action, detail) {
  if (!user || user.role === 'guest') return;
  db.prepare(`INSERT INTO logs (id, user_id, username, name, action, detail, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(generateId(), user.id, user.username, user.name, action, detail, new Date().toISOString());
}

router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = `SELECT b.*, u.name as owner_name, u.username as owner_username FROM boards b LEFT JOIN users u ON b.owner_id = u.id`;
  const params = [];
  if (search) {
    sql += ` WHERE (b.model LIKE ? OR u.name LIKE ? OR u.username LIKE ?)`;
    const kw = `%${search}%`; params.push(kw, kw, kw);
  }
  sql += ` ORDER BY b.updated_at DESC`;
  res.json(db.prepare(sql).all(...params));
});

router.get('/stats', (req, res) => {
  const totalModels = db.prepare('SELECT COUNT(*) as count FROM boards').get().count;
  const totalStock = db.prepare('SELECT COALESCE(SUM(stock), 0) as total FROM boards').get().total;
  const totalOwners = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'owner'").get().count;
  const todayOps = db.prepare("SELECT COUNT(*) as count FROM logs WHERE date(time) = date('now')").get().count;
  res.json({ totalModels, totalStock, totalOwners, todayOps });
});

router.post('/', verifyToken, (req, res) => {
  const { model, stock, ownerId } = req.body;
  if (!model || stock === undefined) return res.status(400).json({ message: '请提供型号和库存' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  let finalOwnerId = user.role === 'owner' ? user.id : ownerId;
  if (!finalOwnerId) return res.status(400).json({ message: '请选择负责人' });

  const existing = db.prepare('SELECT * FROM boards WHERE LOWER(model) = LOWER(?) AND owner_id = ?').get(model, finalOwnerId);
  if (existing) return res.status(400).json({ message: '该负责人已拥有此型号' });

  const id = generateId();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO boards (id, model, stock, owner_id, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, model, stock, finalOwnerId, now, now, user.name);
  addLog(user, '新增型号', `新增开发板型号 ${model}，库存 ${stock}`);
  res.json({ id, message: '新增成功' });
});

router.put('/:id', verifyToken, (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || stock < 0) return res.status(400).json({ message: '库存必须为非负整数' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
  if (!board) return res.status(404).json({ message: '型号不存在' });
  if (user.role === 'owner' && board.owner_id !== user.id) return res.status(403).json({ message: '无权编辑此型号' });

  db.prepare('UPDATE boards SET stock = ?, updated_at = ?, updated_by = ? WHERE id = ?')
    .run(stock, new Date().toISOString(), user.name, req.params.id);
  addLog(user, '编辑库存', `将 ${board.model} 库存修改为 ${stock}`);
  res.json({ message: '更新成功' });
});

router.delete('/:id', verifyToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const board = db.prepare('SELECT * FROM boards WHERE id = ?').get(req.params.id);
  if (!board) return res.status(404).json({ message: '型号不存在' });
  if (user.role === 'owner' && board.owner_id !== user.id) return res.status(403).json({ message: '无权删除此型号' });

  db.prepare('DELETE FROM boards WHERE id = ?').run(req.params.id);
  addLog(user, '删除型号', `删除开发板型号 ${board.model}`);
  res.json({ message: '删除成功' });
});

router.get('/export', (req, res) => {
  const boards = db.prepare(`SELECT b.*, u.name as owner_name FROM boards b LEFT JOIN users u ON b.owner_id = u.id ORDER BY b.updated_at DESC`).all();
  const exportData = boards.map(b => ({
    '开发板型号': b.model, '负责人': b.owner_name || '-', '当前库存': b.stock,
    '最后修改时间': b.updated_at ? new Date(b.updated_at).toLocaleString('zh-CN') : '-', '操作人': b.updated_by || '-'
  }));
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '库存台账');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
      if (decoded.role === 'guest') {
        db.prepare(`INSERT INTO logs (id, user_id, username, name, action, detail, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(generateId(), 'guest', 'guest', '访客', '导出数据', '访客导出库存数据', new Date().toISOString());
      }
    } catch (e) {}
  }

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=库存台账_${new Date().toLocaleDateString('zh-CN')}.xlsx`);
  res.send(buf);
});

module.exports = router;
