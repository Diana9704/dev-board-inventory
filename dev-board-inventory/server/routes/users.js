const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

router.get('/', verifyToken, requireAdmin, (req, res) => {
  const { search } = req.query;
  let sql = "SELECT id, username, name, role, status, created_at FROM users WHERE role != 'admin' OR id != ?";
  const params = ['admin1'];
  if (search) { sql += ' AND (username LIKE ? OR name LIKE ?)'; const kw = `%${search}%`; params.push(kw, kw); }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/owners', verifyToken, (req, res) => {
  res.json(db.prepare("SELECT id, username, name FROM users WHERE role = 'owner' AND status = 'active' ORDER BY name").all());
});

router.post('/', verifyToken, requireAdmin, (req, res) => {
  const { name, username } = req.body;
  if (!name || !username) return res.status(400).json({ message: '请输入姓名和账号' });
  if (!/^[a-z0-9]+$/.test(username)) return res.status(400).json({ message: '账号只能包含小写字母和数字' });
  if (db.prepare('SELECT * FROM users WHERE username = ?').get(username)) return res.status(400).json({ message: '账号已存在' });

  const hash = bcrypt.hashSync('123456', 10);
  const id = generateId();
  db.prepare(`INSERT INTO users (id, username, name, password, role, status, created_at, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, username, name, hash, 'owner', 'active', new Date().toISOString(), 1);
  db.prepare(`INSERT INTO logs (id, user_id, username, name, action, detail, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(generateId(), req.user.id, req.user.username, req.user.name || req.user.username, '创建账号', `创建负责人账号 ${username} (${name})`, new Date().toISOString());
  res.json({ id, message: '创建成功' });
});

router.post('/:id/reset-password', verifyToken, requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  db.prepare('UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?').run(bcrypt.hashSync('123456', 10), req.params.id);
  db.prepare(`INSERT INTO logs (id, user_id, username, name, action, detail, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(generateId(), req.user.id, req.user.username, req.user.name || req.user.username, '重置密码', `重置用户 ${user.username} 的密码`, new Date().toISOString());
  res.json({ message: '密码已重置为 123456' });
});

router.post('/:id/toggle-status', verifyToken, requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  const newStatus = user.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, req.params.id);
  const action = newStatus === 'active' ? '启用账号' : '禁用账号';
  db.prepare(`INSERT INTO logs (id, user_id, username, name, action, detail, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(generateId(), req.user.id, req.user.username, req.user.name || req.user.username, action, `${action} ${user.username}`, new Date().toISOString());
  res.json({ message: `账号已${newStatus === 'active' ? '启用' : '禁用'}` });
});

router.post('/:id/promote', verifyToken, requireAdmin, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', req.params.id);
  db.prepare(`INSERT INTO logs (id, user_id, username, name, action, detail, time) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(generateId(), req.user.id, req.user.username, req.user.name || req.user.username, '权限变更', `将 ${user.username} 升级为超级管理员`, new Date().toISOString());
  res.json({ message: '升级成功' });
});

module.exports = router;
