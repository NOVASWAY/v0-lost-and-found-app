PRAGMA foreign_keys=OFF;

CREATE TABLE "new_PointEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_PointEvent" ("id", "action", "referenceId", "points", "userId", "createdAt")
SELECT "id", "action", "referenceId", "points", "userId", "createdAt" FROM "PointEvent";

DROP TABLE "PointEvent";
ALTER TABLE "new_PointEvent" RENAME TO "PointEvent";

CREATE UNIQUE INDEX "PointEvent_action_referenceId_userId_key" ON "PointEvent"("action", "referenceId", "userId");
CREATE INDEX "PointEvent_userId_idx" ON "PointEvent"("userId");
CREATE INDEX "PointEvent_action_idx" ON "PointEvent"("action");

PRAGMA foreign_keys=ON;
