-- CreateTable
-- IF NOT EXISTS: production already gained this table via a build-time schema
-- push, so this migration records it without failing on that database.
CREATE TABLE IF NOT EXISTS "rate_limit_counters" (
    "rate_key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_time" BIGINT NOT NULL,
    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("rate_key")
);
