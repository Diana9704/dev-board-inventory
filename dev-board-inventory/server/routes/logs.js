const express = require('express');
const db = require('../database');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', verifyToken, (req, res) => {
  const { search, page = 1, pageSize = 10 } = req.query;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  let sql = 'SELECT * FROM logs WHERE 1=1';
  const params = [];
  if (user.role === 'owner') { sql += ' AND user_id = ?'; params.push(req.user.id); }
  if (search) { sql += ' AND (action LIKE ? OR detail LIKE ?)'; const kw = `%${search}%`; params.push(kw, kw); }
  sql += ' ORDER BY time DESC';

  const allLogs = db.prepare(sql).all(...params);
  const total = allLogs.length;
  const start = (parseInt(page) - 1) * parseInt(pageSize);
  const pageData = allLogs.slice(start, start + parseInt(pageSize));
  res.json({ data: pageData, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

module.exports = router;
