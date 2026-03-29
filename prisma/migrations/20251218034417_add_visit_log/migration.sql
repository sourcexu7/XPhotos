-- CreateTable
CREATE TABLE "visit_log" (
    "id" VARCHAR(50) NOT NULL,
    "path" TEXT NOT NULL,
    "pageType" VARCHAR(50) NOT NULL,
    "ip" VARCHAR(100),
    "userAgent" TEXT,
    "referrer" TEXT,
    "source" VARCHAR(50),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_log_created_at_idx" ON "visit_log"("created_at");

-- CreateIndex
CREATE INDEX "visit_log_path_idx" ON "visit_log"("path");
