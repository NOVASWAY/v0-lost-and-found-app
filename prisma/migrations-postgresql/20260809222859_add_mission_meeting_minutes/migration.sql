-- CreateTable
CREATE TABLE "Mission" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "instructions" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TEXT,
    "location" TEXT,
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "assignedTo" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingMinutes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" TEXT NOT NULL,
    "location" TEXT,
    "attendees" JSONB NOT NULL,
    "agenda" JSONB NOT NULL,
    "discussion" TEXT NOT NULL DEFAULT '',
    "actionItems" JSONB NOT NULL,
    "decisions" JSONB NOT NULL,
    "nextMeetingDate" TEXT,
    "recordedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingMinutes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Mission_assignedTo_idx" ON "Mission"("assignedTo");

-- CreateIndex
CREATE INDEX "Mission_status_idx" ON "Mission"("status");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
