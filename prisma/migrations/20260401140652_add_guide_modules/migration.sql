-- CreateTable
CREATE TABLE "guide_modules" (
    "id" VARCHAR(50) NOT NULL,
    "guide_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "template" VARCHAR(50),
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "guide_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_module_contents" (
    "id" VARCHAR(50) NOT NULL,
    "module_id" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "content" JSON,
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP,

    CONSTRAINT "guide_module_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_table_of_contents" (
    "id" VARCHAR(50) NOT NULL,
    "guide_id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "level" SMALLINT NOT NULL DEFAULT 1,
    "target_id" VARCHAR(50),
    "target_type" VARCHAR(50),
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guide_table_of_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guide_modules_guide_id_idx" ON "guide_modules"("guide_id");

-- CreateIndex
CREATE INDEX "guide_modules_guide_id_sort_idx" ON "guide_modules"("guide_id", "sort");

-- CreateIndex
CREATE INDEX "guide_module_contents_module_id_idx" ON "guide_module_contents"("module_id");

-- CreateIndex
CREATE INDEX "guide_module_contents_module_id_sort_idx" ON "guide_module_contents"("module_id", "sort");

-- CreateIndex
CREATE INDEX "guide_table_of_contents_guide_id_idx" ON "guide_table_of_contents"("guide_id");

-- CreateIndex
CREATE INDEX "guide_table_of_contents_guide_id_sort_idx" ON "guide_table_of_contents"("guide_id", "sort");

-- AddForeignKey
ALTER TABLE "guide_modules" ADD CONSTRAINT "guide_modules_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_module_contents" ADD CONSTRAINT "guide_module_contents_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "guide_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guide_table_of_contents" ADD CONSTRAINT "guide_table_of_contents_guide_id_fkey" FOREIGN KEY ("guide_id") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
