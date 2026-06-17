# 开发板库存管理系统

基于 Node.js + Express + PostgreSQL (Supabase) 的全栈 Web 应用。

## 项目结构

```
dev-board-inventory/
├── server/                 # 后端 Express 项目
│   ├── package.json
│   ├── .env.example
│   ├── server.js
│   ├── database.js
│   ├── middleware/
│   │   └── auth.js
│   └── routes/
│       ├── auth.js
│       ├── boards.js
│       ├── import.js
│       ├── logs.js
│       └── users.js
└── public/                 # 前端静态文件
    └── index.html
```

## 功能特性

- 双角色权限：超级管理员 / 板块负责人
- 访客模式（只读访问，无需登录）
- 库存 CRUD 管理
- Excel 批量导入 / 导出
- 操作日志记录
- 响应式设计

## 本地开发

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
DATABASE_URL=postgresql://postgres:你的密码@db.xxxxx.supabase.co:5432/postgres
JWT_SECRET=my-secret-key-2026
PORT=3000
```

### 3. 启动后端

```bash
node server.js
```

访问地址：http://localhost:3000

## 部署到 Vercel + Supabase

### 1. 准备 Supabase 数据库

1. 注册 Supabase 并创建项目
2. 在 Settings → Database 获取连接字符串
3. 替换密码后保存为 `DATABASE_URL`

### 2. 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量：
   - `DATABASE_URL`：Supabase 连接地址
   - `JWT_SECRET`：自定义密钥
4. 点击 Deploy

## 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin1 | admin123 | 超级管理员 |
| admin2 | admin123 | 超级管理员 |

## API 接口

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/change-password | 修改密码 |

### 库存
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/boards | 获取列表 |
| GET | /api/boards/stats | 统计数据 |
| POST | /api/boards | 新增型号 |
| PUT | /api/boards/:id | 编辑库存 |
| DELETE | /api/boards/:id | 删除型号 |
| GET | /api/boards/export | 导出 Excel |

### 账号管理（管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 用户列表 |
| POST | /api/users | 新增负责人 |
| POST | /api/users/:id/reset-password | 重置密码 |
| POST | /api/users/:id/toggle-status | 启用/禁用 |
| POST | /api/users/:id/promote | 升级为管理员 |

### 批量导入（管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/import | 上传 Excel 导入 |

### 操作日志
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/logs | 日志列表 |
