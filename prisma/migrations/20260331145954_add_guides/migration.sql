-- CreateTable
CREATE TABLE "guides" (
    "id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "days" SMALLINT NOT NULL,
    "start_date" TIMESTAMP,
    "end_date" TIMESTAMP,
    "cover_image" TEXT,
    "content" JSON,
    "show" SMALLINT NOT NULL DEFAULT 1,
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,
    "del" SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT "guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_components" (
    "id" VARCHAR(50) NOT NULL,
    "guide_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "content" JSON,
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "guide_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_albums_relation" (
    "id" VARCHAR(50) NOT NULL,
    "guide_id" VARCHAR(50) NOT NULL,
    "album_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_albums_relation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guides_del_show_idx" ON "guides"("del", "show");

-- CreateIndex
CREATE INDEX "guides_country_city_idx" ON "guides"("country", "city");

-- CreateIndex
CREATE INDEX "guides_days_idx" ON "guides"("days");

-- CreateIndex
CREATE INDEX "guide_components_guide_id_idx" ON "guide_components"("guide_id");

-- CreateIndex
CREATE INDEX "guide_albums_relation_guide_id_idx" ON "guide_albums_relation"("guide_id");

-- CreateIndex
CREATE INDEX "guide_albums_relation_album_id_idx" ON "guide_albums_relation"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "guide_albums_relation_guide_id_album_id_key" ON "guide_albums_relation"("guide_id", "album_id");

-- AddForeignKey
ALTER TABLE "guide_components" ADD CONSTRAINT "guide_components_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_albums_relation" ADD CONSTRAINT "guide_albums_relation_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_albums_relation" ADD CONSTRAINT "guide_albums_relation_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
