-- CreateIndex
CREATE INDEX "albums_del_show_idx" ON "albums"("del", "show");

-- CreateIndex
CREATE INDEX "albums_album_value_idx" ON "albums"("album_value");

-- CreateIndex
CREATE INDEX "images_del_show_idx" ON "images"("del", "show");

-- CreateIndex
CREATE INDEX "images_featured_idx" ON "images"("featured");

-- CreateIndex
CREATE INDEX "images_created_at_idx" ON "images"("created_at");

-- CreateIndex
CREATE INDEX "images_show_show_on_mainpage_idx" ON "images"("show", "show_on_mainpage");

-- CreateIndex
CREATE INDEX "images_del_show_featured_idx" ON "images"("del", "show", "featured");

-- CreateIndex
CREATE INDEX "images_albums_relation_imageId_idx" ON "images_albums_relation"("imageId");

-- CreateIndex
CREATE INDEX "images_albums_relation_album_value_idx" ON "images_albums_relation"("album_value");

-- CreateIndex
CREATE INDEX "images_albums_relation_imageId_album_value_idx" ON "images_albums_relation"("imageId", "album_value");

-- CreateIndex
CREATE INDEX "images_tags_relation_imageId_idx" ON "images_tags_relation"("imageId");

-- CreateIndex
CREATE INDEX "images_tags_relation_tagId_idx" ON "images_tags_relation"("tagId");
