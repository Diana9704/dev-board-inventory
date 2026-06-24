# 开发板库存管理系统 - Vercel + Supabase 版

基于 Vue3 + Vite + Vercel Serverless Functions + Supabase PostgreSQL 的全栈 Web 应用。

**目标域名**：`dev-board-inventory.top`

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue3 + Vite + Element Plus + Pinia |
| 后端 | Vercel Serverless Functions |
| 数据库 | Supabase PostgreSQL |
| 认证 | JWT |

## 项目结构（28个文件）

```
dev-board-inventory/
├── api/                          # Vercel Serverless Functions（后端API）
│   ├── _utils/
│   │   ├── supabase.js           # Supabase 客户端
│   │   ├── auth.js               # JWT 工具
│   │   └── helpers.js            # 辅助函数
│   ├── auth/
│   │   ├── login.js              # 登录
│   │   ├── me.js                 # 获取当前用户
│   │   └── change-password.js    # 修改密码
│   ├── boards/
│   │   ├── index.js              # 库存列表
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
├── supabase/
│   ├── schema.sql                # 数据库建表脚本
│   └── seed.sql                  # 默认管理员数据
├── package.json                  # 项目依赖
├── vite.config.js                # Vite 配置
├── index.html                    # 入口 HTML
├── vercel.json                   # Vercel 部署配置
└── .env.example                  # 环境变量模板
```

## 部署步骤

### 第一步：创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)，用 GitHub 账号登录
2. 点击 **New Project**，选择组织，输入项目名称
3. 设置数据库密码，选择地区（建议 `East US` 或 `Southeast Asia`）
4. 等待项目创建完成

### 第二步：获取 Supabase 连接信息

进入项目后，点击左侧 **Project Settings** → **API**，记录以下三个值：

| 变量名 | 位置 |
|--------|------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_KEY` | service_role secret |

### 第三步：创建数据库表

1. 在 Supabase 左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 将 `supabase/schema.sql` 的内容全部粘贴进去，点击 **Run**
4. 新建一个查询，将 `supabase/seed.sql` 的内容粘贴进去，点击 **Run**

### 第四步：推送代码到 GitHub

```bash
# 1. 解压下载的 zip 文件
cd dev-board-inventory

# 2. 初始化 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 3. 在 GitHub 上创建一个新仓库（不要初始化 README）
# 4. 关联并推送
git remote add origin https://github.com/你的用户名/你的仓库名.git
git branch -M main
git push -u origin main
```

### 第五步：部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)，用 GitHub 登录
2. 点击 **Add New Project**
3. 找到并导入你刚才推送的 GitHub 仓库
4. 在配置页面：
   - **Framework Preset**: 选择 `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. 点击 **Environment Variables**，添加以下 4 个变量：

| 变量名 | 值 |
|--------|-----|
| `SUPABASE_URL` | 从 Supabase 复制的 Project URL |
| `SUPABASE_SERVICE_KEY` | 从 Supabase 复制的 service_role key |
| `JWT_SECRET` | 自己生成一个强密码（如 `DevBoard2024!@#$%^&*`） |

6. 点击 **Deploy**，等待部署完成

### 第六步：绑定自定义域名

1. 在 Vercel 项目控制台，点击 **Settings** → **Domains**
2. 输入你的域名：`dev-board-inventory.top`
3. 按照 Vercel 提示，在你的域名服务商（如阿里云、腾讯云）处添加 DNS 记录：
   - 类型：`CNAME`
   - 主机记录：`@` 或 `www`
   - 记录值：`cname.vercel-dns.com`
4. 等待 DNS 生效（通常几分钟到几小时）

### 第七步：验证部署

1. 打开 `https://dev-board-inventory.top`
2. 点击 **访客模式**，测试只读功能
3. 用 `admin1` / `admin123` 登录，测试完整功能

## 本地开发

```bash
cd dev-board-inventory

# 安装依赖
npm install

# 创建本地环境变量
cp .env.example .env
# 编辑 .env 填入你的 Supabase 配置

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

## 默认账号

| 账号 | 密码 | 角色 |
|------|------|------|
| admin1 | admin123 | 超级管理员 |
| admin2 | admin123 | 超级管理员 |

## 功能特性

- 访客模式（只读访问，无需登录）
- 双角色权限：超级管理员 / 板块负责人
- 库存 CRUD 管理
- Excel 批量导入 / 导出
- 操作日志记录
- 响应式设计

## 常见问题

| 问题 | 解决方法 |
|------|----------|
| 登录提示"账号不存在" | 检查 seed.sql 是否执行成功 |
| API 返回 500 错误 | 检查 Vercel 环境变量是否设置正确 |
| 前端页面空白 | 按 F12 打开控制台查看报错 |
| 域名无法访问 | 检查 DNS 记录是否正确配置 |
