-- Step 1: Add the user_id column (nullable first to allow existing data)
ALTER TABLE "videos" ADD COLUMN "user_id" uuid;

-- Step 2: Populate user_id from the courses table
UPDATE "videos" 
SET "user_id" = "courses"."user_id" 
FROM "courses" 
WHERE "videos"."course_id" = "courses"."id";

-- Step 3: Make user_id NOT NULL now that it's populated
ALTER TABLE "videos" ALTER COLUMN "user_id" SET NOT NULL;

--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_user_id_youtube_playlist_id_unique" UNIQUE("user_id","youtube_playlist_id");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_youtube_video_id_unique" UNIQUE("user_id","youtube_video_id");