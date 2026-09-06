-- Migration: Update progress table to separate checkpoint (resume position) from total watched seconds
-- Step 1: Rename watched_seconds to checkpoint_seconds
ALTER TABLE "progress" RENAME COLUMN "watched_seconds" TO "checkpoint_seconds";

-- Step 2: Add total_watched_seconds column with default 0
ALTER TABLE "progress" ADD COLUMN "total_watched_seconds" integer DEFAULT 0 NOT NULL;

-- Step 3: Populate total_watched_seconds from user_activity logs
-- This aggregates all activity for each user-video pair
UPDATE "progress" p
SET "total_watched_seconds" = COALESCE(
  (SELECT SUM(ua."watched_seconds") 
   FROM "user_activity" ua 
   WHERE ua."user_id" = p."user_id" AND ua."video_id" = p."video_id"),
  0
);
