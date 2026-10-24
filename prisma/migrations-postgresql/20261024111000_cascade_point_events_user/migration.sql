ALTER TABLE "PointEvent" DROP CONSTRAINT "PointEvent_userId_fkey";

ALTER TABLE "PointEvent"
  ADD CONSTRAINT "PointEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
