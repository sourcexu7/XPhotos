-- ============================================
-- XPhotos 性能优化索引脚本
-- ============================================
-- 说明：schema.prisma 中已定义了大部分索引
-- 此脚本仅补充可能遗漏的索引
-- ============================================

-- 添加 shoot_at 字段索引（用于按拍摄时间排序）
CREATE INDEX IF NOT EXISTS idx_images_shoot_at ON images(shoot_at);

-- 添加访问日志的时间索引（已有但确保存在）
CREATE INDEX IF NOT EXISTS idx_visit_log_created_at ON visit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_visit_log_path ON visit_log(path);
CREATE INDEX IF NOT EXISTS idx_visit_log_page_type ON visit_log("pageType");

-- ============================================
-- 验证索引创建成功
-- ============================================
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename = 'images' 
    OR tablename = 'images_albums_relation' 
    OR tablename = 'albums' 
    OR tablename = 'visit_log')
ORDER BY tablename, indexname;

-- ============================================
-- 性能分析建议
-- ============================================
-- 查看表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
