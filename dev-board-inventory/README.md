# 开发板库存管理系统

基于 Vue3 + Vite + Node.js + Express + SQLite 的全栈 Web 应用。

## 项目结构

```
dev-board-inventory/
├── client/                 # 前端 Vue3 项目
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── router/
│       │   └── index.js
│       ├── stores/
│       │   └── user.js
│       ├── api/
│       │   └── index.js
│       └── views/
│           ├── Login.vue
│           ├── Layout.vue
│           ├── Dashboard.vue
│           ├── Inventory.vue
│           ├── Import.vue
│           ├── Accounts.vue
│           ├── Profile.vue
│           └── Logs.vue
└── server/                 # 后端 Express 项目
    ├── package.json
    ├── .env.example
    ├── server.js
    ├── database.js
    ├── middleware/
    │   └── auth.js
    └── routes/
        ├── auth.js
        ├── boards.js
        ├── import.js
        ├── logs.js
        └── users.js
```

## 功能特性

- 访客模式（只读访问，无需登录）
- 双角色权限：超级管理员 / 板块负责人
- 库存 CRUD 管理
- Excel 批量导入 / 导出
- 操作日志记录
- 响应式设计

## 本地开发

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 设置 JWT_SECRET
```

### 3. 启动后端

```bash
npm start
# 或开发模式
npm run dev
```

### 4. 安装前端依赖

```bash
cd ../client
npm install
```

### 5. 启动前端

```bash
npm run dev
```

前端地址：http://localhost:5173
后端地址：http://localhost:3000

## 部署到 Render

### 1. 构建前端

```bash
cd client
npm install
npm run build
```

### 2. 部署后端

将整个项目推送到 GitHub，然后在 Render 创建 Web Service：

- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Root Directory**: `./`

### 3. 设置环境变量

```
JWT_SECRET=你的强密码密钥
NODE_ENV=production
```

## 默认账号

- 管理员1：`admin1` / `admin123`
- 管理员2：`admin2` / `admin123`

## API 文档

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/change-password | 修改密码 |

### 库存
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/boards | 获取列表（支持访客） |
| GET | /api/boards/stats | 统计数据（支持访客） |
| POST | /api/boards | 新增型号 |
| PUT | /api/boards/:id | 编辑库存 |
| DELETE | /api/boards/:id | 删除型号 |
| GET | /api/boards/export | 导出 Excel（支持访客） |

### 账号管理（管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 用户列表 |
| GET | /api/users/owners | 负责人下拉选项 |
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
