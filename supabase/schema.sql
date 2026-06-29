-- ============================================
-- 开发板库存管理系统 - 数据库表结构
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('admin', 'owner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '用户唯一标识';
COMMENT ON COLUMN users.username IS '登录账号（小写字母+数字）';
COMMENT ON COLUMN users.name IS '用户姓名';
COMMENT ON COLUMN users.password IS '密码（bcrypt哈希）';
COMMENT ON COLUMN users.role IS '角色：admin=超级管理员，owner=板块负责人';
COMMENT ON COLUMN users.status IS '状态：active=启用，inactive=禁用';
COMMENT ON COLUMN users.must_change_password IS '是否需要修改初始密码';

-- 2. 开发板库存表
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

COMMENT ON TABLE boards IS '开发板库存表';
COMMENT ON COLUMN boards.id IS '开发板唯一标识';
COMMENT ON COLUMN boards.model IS '开发板型号名称';
COMMENT ON COLUMN boards.stock IS '当前库存数量';
COMMENT ON COLUMN boards.owner_id IS '负责人ID，关联users表';
COMMENT ON COLUMN boards.updated_by IS '最后修改人姓名';

-- 3. 操作日志表
CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username TEXT,
  name TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE logs IS '操作日志表';
COMMENT ON COLUMN logs.id IS '日志唯一标识';
COMMENT ON COLUMN logs.user_id IS '操作用户ID';
COMMENT ON COLUMN logs.action IS '操作类型（如：新增型号、编辑库存、删除型号等）';
COMMENT ON COLUMN logs.detail IS '操作详情描述';
COMMENT ON COLUMN logs.time IS '操作时间';

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_boards_owner_id ON boards(owner_id);
CREATE INDEX IF NOT EXISTS idx_boards_model ON boards(model);
CREATE INDEX IF NOT EXISTS idx_boards_updated_at ON boards(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_time ON logs(time DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 5. 启用行级安全策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- 6. 完成提示
DO $$
BEGIN
  RAISE NOTICE '数据库表结构创建完成！';
  RAISE NOTICE '已创建表：users, boards, logs';
  RAISE NOTICE '已创建索引：7个';
  RAISE NOTICE '请继续执行 seed.sql 插入默认管理员账号';
END $$;
