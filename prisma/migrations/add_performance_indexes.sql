-- 性能优化：添加数据库索引
-- 执行此迁移文件以创建性能优化索引

-- Images 表索引
CREATE INDEX IF NOT EXISTS "images_del_show_idx" ON "images"("del", "show");
CREATE INDEX IF NOT EXISTS "images_featured_idx" ON "images"("featured");
CREATE INDEX IF NOT EXISTS "images_created_at_idx" ON "images"("created_at");
CREATE INDEX IF NOT EXISTS "images_show_mainpage_idx" ON "images"("show", "show_on_mainpage");
CREATE INDEX IF NOT EXISTS "images_del_show_featured_idx" ON "images"("del", "show", "featured");

-- Images 表 JSONB 字段 GIN 索引（PostgreSQL 专用）
CREATE INDEX IF NOT EXISTS "images_labels_gin_idx" ON "images" USING GIN ("labels");

-- ImagesAlbumsRelation 表索引
CREATE INDEX IF NOT EXISTS "images_albums_relation_image_id_idx" ON "images_albums_relation"("imageId");
CREATE INDEX IF NOT EXISTS "images_albums_relation_album_value_idx" ON "images_albums_relation"("album_value");
CREATE INDEX IF NOT EXISTS "images_albums_relation_image_album_idx" ON "images_albums_relation"("imageId", "album_value");

-- ImagesTagsRelation 表索引
CREATE INDEX IF NOT EXISTS "images_tags_relation_image_id_idx" ON "images_tags_relation"("imageId");
CREATE INDEX IF NOT EXISTS "images_tags_relation_tag_id_idx" ON "images_tags_relation"("tagId");

-- Albums 表索引
CREATE INDEX IF NOT EXISTS "albums_del_show_idx" ON "albums"("del", "show");

-- 分析索引使用情况（可选）
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

