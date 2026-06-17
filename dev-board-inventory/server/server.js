require('dotenv').config();
const { pool, initDatabase } = require('./database');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 初始化数据库
initDatabase();

// 静态文件（你的前端在 public 文件夹）
app.use(express.static(path.join(__dirname, './public')));

// ===== 路由（保持不变） =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/import', require('./routes/import'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/users', require('./routes/users'));
// ============================

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 所有其他请求返回 index.html（前端路由由 Vue 处理）
app.get('*', (req, res) => res.sendFile(path.join(__dirname, './public/index.html')));

app.listen(PORT, () => {
  console.log('✅ 开发板库存管理系统已启动');
  console.log(`✅ 服务地址：http://localhost:${PORT}`);
});