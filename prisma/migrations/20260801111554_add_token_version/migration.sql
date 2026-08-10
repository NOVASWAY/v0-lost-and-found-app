-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "itemsUploaded" INTEGER NOT NULL DEFAULT 0,
    "claimsSubmitted" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vaultPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "attendanceCount" INTEGER NOT NULL DEFAULT 0,
    "serviceCount" INTEGER NOT NULL DEFAULT 0,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("attendanceCount", "claimsSubmitted", "createdAt", "id", "itemsUploaded", "joinedAt", "name", "password", "rank", "role", "serviceCount", "updatedAt", "username", "vaultPoints") SELECT "attendanceCount", "claimsSubmitted", "createdAt", "id", "itemsUploaded", "joinedAt", "name", "password", "rank", "role", "serviceCount", "updatedAt", "username", "vaultPoints" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_vaultPoints_idx" ON "User"("vaultPoints");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
