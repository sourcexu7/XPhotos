-- AddAlbumImageSort
-- 为图片相册关联表添加 sort 字段，支持相册级别的独立图片排序

-- 1. 添加 sort 字段
ALTER TABLE "images_albums_relation" ADD COLUMN IF NOT EXISTS "sort" SMALLINT DEFAULT 0;

-- 2. 迁移现有数据：将图片的全局 sort 值同步到关联表
UPDATE "images_albums_relation" iar
SET "sort" = COALESCE(i.sort, 0)
FROM "images" i
WHERE iar."imageId" = i.id;

-- 3. 创建索引以优化相册内图片排序查询
CREATE INDEX IF NOT EXISTS "images_albums_relation_album_value_sort_idx" 
ON "images_albums_relation" ("album_value", "sort");

-- 4. 为每个相册内的图片重新计算排序值（按创建时间降序）
-- 这样确保同一相册内的图片有连续的排序值
DO $$
DECLARE
    album_record RECORD;
    img_record RECORD;
    sort_val INTEGER;
BEGIN
    FOR album_record IN SELECT DISTINCT album_value FROM images_albums_relation LOOP
        sort_val := 0;
        FOR img_record IN 
            SELECT iar."imageId"
            FROM images_albums_relation iar
            INNER JOIN images i ON iar."imageId" = i.id
            WHERE iar.album_value = album_record.album_value
            ORDER BY i.sort ASC, i.created_at DESC
        LOOP
            UPDATE images_albums_relation
            SET sort = sort_val
            WHERE "imageId" = img_record."imageId" 
            AND album_value = album_record.album_value;
            sort_val := sort_val + 1;
        END LOOP;
    END LOOP;
END $$;
