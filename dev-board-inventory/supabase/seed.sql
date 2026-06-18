-- ============================================
-- 开发板库存管理系统 - 初始数据
-- 在 Supabase SQL Editor 中执行此脚本
-- （需先执行 schema.sql）
-- ============================================

-- 插入默认超级管理员账号
-- 密码均为 admin123 的 bcrypt 哈希值
-- 生成方式：在 Node.js 中执行 require('bcryptjs').hashSync('admin123', 10)
INSERT INTO users (id, username, name, password, role, status, must_change_password)
VALUES 
  (
    'admin1', 
    'admin1', 
    '管理员1', 
    '$2a$10$aDAZljhNuLLcO0Gzc2t/OOYdG1mEfxF6/NqwoQXTshXUeM4Q8RDIC', 
    'admin', 
    'active', 
    FALSE
  ),
  (
    'admin2', 
    'admin2', 
    '管理员2', 
    '$2a$10$aDAZljhNuLLcO0Gzc2t/OOYdG1mEfxF6/NqwoQXTshXUeM4Q8RDIC', 
    'admin', 
    'active', 
    FALSE
  )
ON CONFLICT (username) DO NOTHING;

-- 验证插入结果
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';
  RAISE NOTICE '初始数据插入完成！';
  RAISE NOTICE '管理员账号数量：% ', admin_count;
  RAISE NOTICE '默认账号1：admin1 / admin123';
  RAISE NOTICE '默认账号2：admin2 / admin123';
  RAISE NOTICE '========================================';
  RAISE NOTICE '登录后请立即修改默认密码！';
END $$;
