-- CreateTable
CREATE TABLE "OccurrenceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OccurrenceBook" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "occurrenceDate" TEXT NOT NULL,
    "occurrenceTime" TEXT,
    "attachments" JSONB NOT NULL DEFAULT [],
    "notes" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "categoryId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "linkedItemId" TEXT,
    "linkedClaimId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OccurrenceBook_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "OccurrenceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OccurrenceBook_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OccurrenceBook_linkedItemId_fkey" FOREIGN KEY ("linkedItemId") REFERENCES "Item" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OccurrenceBook_linkedClaimId_fkey" FOREIGN KEY ("linkedClaimId") REFERENCES "Claim" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OccurrenceCategory_name_key" ON "OccurrenceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OccurrenceBook_entryNumber_key" ON "OccurrenceBook"("entryNumber");

-- CreateIndex
CREATE INDEX "OccurrenceBook_categoryId_idx" ON "OccurrenceBook"("categoryId");

-- CreateIndex
CREATE INDEX "OccurrenceBook_severity_idx" ON "OccurrenceBook"("severity");

-- CreateIndex
CREATE INDEX "OccurrenceBook_status_idx" ON "OccurrenceBook"("status");

-- CreateIndex
CREATE INDEX "OccurrenceBook_reportedById_idx" ON "OccurrenceBook"("reportedById");

-- CreateIndex
CREATE INDEX "OccurrenceBook_linkedItemId_idx" ON "OccurrenceBook"("linkedItemId");

-- CreateIndex
CREATE INDEX "OccurrenceBook_linkedClaimId_idx" ON "OccurrenceBook"("linkedClaimId");
