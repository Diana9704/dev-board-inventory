# 开发板库存管理系统 - Vercel + Supabase 版

基于 Vue3 + Vite + Vercel Serverless Functions + Supabase PostgreSQL 的全栈 Web 应用。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue3 + Vite + Element Plus + Pinia |
| 后端 | Vercel Serverless Functions |
| 数据库 | Supabase PostgreSQL |
| 认证 | JWT |

## 项目结构

```
dev-board-inventory/
├── api/                          # Vercel Serverless Functions
│   ├── _utils/
│   │   ├── supabase.js           # Supabase 客户端
│   │   ├── auth.js               # JWT 工具
│   │   └── helpers.js            # 辅助函数
│   ├── auth/
│   │   ├── login.js              # 登录
│   │   ├── me.js                 # 获取当前用户
│   │   └── change-password.js    # 修改密码
│   ├── boards/
│   │   ├── index.js              # 获取库存列表
│   │   ├── stats.js              # 统计数据
│   │   ├── create.js             # 新增型号
│   │   ├── update.js             # 编辑库存
│   │   ├── delete.js             # 删除型号
│   │   └── export.js             # 导出 Excel
│   ├── users/
│   │   ├── index.js              # 用户列表
│   │   ├── owners.js             # 负责人列表
│   │   ├── create.js             # 新增负责人
│   │   ├── reset-password.js     # 重置密码
│   │   ├── toggle-status.js      # 切换状态
│   │   └── promote.js            # 升级权限
│   ├── logs/
│   │   └── index.js              # 操作日志
│   ├── import/
│   │   └── index.js              # 批量导入
│   └── health.js                 # 健康检查
├── src/                          # 前端 Vue3 源码
│   ├── main.js                   # 入口
│   ├── App.vue                   # 根组件
│   ├── router/
│   │   └── index.js              # Vue Router
│   ├── stores/
│   │   └── user.js               # Pinia 用户状态
│   ├── api/
│   │   └── index.js              # Axios 封装
│   └── views/
│       ├── Login.vue             # 登录页
│       ├── Layout.vue            # 侧边栏布局
│       ├── Dashboard.vue         # 数据概览
│       ├── Inventory.vue         # 库存管理
│       ├── Import.vue            # 批量导入
│       ├── Accounts.vue          # 账号管理
│       ├── Profile.vue           # 个人中心
│       └── Logs.vue              # 操作日志
├── package.json                  # 项目依赖
├── vite.config.js                # Vite 配置
├── index.html                    # 入口 HTML
├── vercel.json                   # Vercel 部署配置
└── .env.example                  # 环境变量模板
```

## 部署步骤

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 创建新项目，记录以下信息：
   - Project URL (`SUPABASE_URL`)
   - Anon Key (`SUPABASE_ANON_KEY`)
   - Service Role Key (`SUPABASE_SERVICE_KEY`)

### 2. 创建数据库表

在 Supabase SQL Editor 中执行：

```sql
-- 用户表
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE
);

-- 开发板表
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  owner_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- 操作日志表
CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  name TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 插入默认管理员
INSERT INTO users (id, username, name, password, role, status, must_change_password)
VALUES 
  ('admin1', 'admin1', '管理员1', '$2a$10$YourHashedPassword', 'admin', 'active', FALSE),
  ('admin2', 'admin2', '管理员2', '$2a$10$YourHashedPassword', 'admin', 'active', FALSE);
```

> 注意：密码需要使用 bcrypt 哈希。可以使用在线 bcrypt 生成器生成 `admin123` 的哈希值。

### 3. 部署到 Vercel

1. 将代码推送到 GitHub
2. 访问 [vercel.com](https://vercel.com) 导入项目
3. 在 Environment Variables 中设置：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`（至少32位随机字符串）
4. 点击 Deploy

### 4. 本地开发

```bash
# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env
# 编辑 .env 填入你的 Supabase 配置

# 启动开发服务器
npm run dev
```

前端地址：http://localhost:5173

## 默认账号

- 管理员1：`admin1` / `admin123`
- 管理员2：`admin2` / `admin123`

## 功能特性

- 访客模式（只读访问，无需登录）
- 双角色权限：超级管理员 / 板块负责人
- 库存 CRUD 管理
- Excel 批量导入 / 导出
- 操作日志记录
- 响应式设计
