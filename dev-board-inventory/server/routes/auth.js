const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken, verifyToken } = require('../middleware/auth');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: '请输入账号和密码' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(401).json({ message: '账号不存在' });
  if (user.status !== 'active') return res.status(401).json({ message: '账号已被禁用' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ message: '密码错误' });

  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role, status: user.status, mustChangePassword: user.must_change_password === 1 }
  });
});

router.get('/me', verifyToken, (req, res) => {
  const user = db.prepare('SELECT id, username, name, role, status, must_change_password FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: '用户不存在' });
  res.json({ id: user.id, username: user.username, name: user.name, role: user.role, status: user.status, mustChangePassword: user.must_change_password === 1 });
});

router.post('/change-password', verifyToken, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ message: '请提供原密码和至少6位的新密码' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !bcrypt.compareSync(oldPassword, user.password)) return res.status(401).json({ message: '原密码错误' });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(hash, req.user.id);
  res.json({ message: '密码修改成功' });
});

module.exports = router;
