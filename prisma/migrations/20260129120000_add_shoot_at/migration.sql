-- Add shoot_at column for fast EXIF shoot time sorting
ALTER TABLE "images" ADD COLUMN IF NOT EXISTS "shoot_at" TIMESTAMP;

-- Backfill shoot_at from exif->>'data_time'
-- Supports both 'YYYY:MM:DD HH24:MI:SS' and 'YYYY-MM-DD HH24:MI:SS'
UPDATE "images"
SET "shoot_at" = COALESCE(
  TO_TIMESTAMP(NULLIF(("exif"->>'data_time'),''), 'YYYY:MM:DD HH24:MI:SS'),
  TO_TIMESTAMP(NULLIF(("exif"->>'data_time'),''), 'YYYY-MM-DD HH24:MI:SS')
)
WHERE "shoot_at" IS NULL
  AND "exif" IS NOT NULL
  AND ((("exif")::jsonb ? 'data_time'))
  AND NULLIF(("exif"->>'data_time'),'') IS NOT NULL;

-- Indexes (non-concurrently, ok for small tables)
CREATE INDEX IF NOT EXISTS "images_public_shoot_at_desc_idx"
  ON "images" ("shoot_at" DESC, "created_at" DESC)
  WHERE del = 0 AND show = 0;

CREATE INDEX IF NOT EXISTS "images_public_shoot_at_asc_idx"
  ON "images" ("shoot_at" ASC, "created_at" ASC)
  WHERE del = 0 AND show = 0;
