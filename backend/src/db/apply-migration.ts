import { sql } from "drizzle-orm";
import { db } from "./index.ts";

async function applyMigration() {
  try {
    console.log(
      "Step 1: Removing duplicate courses (keeping the oldest by created_at)..."
    );
    await db.execute(sql`
      DELETE FROM "courses" 
      WHERE "id" IN (
        SELECT c1."id"
        FROM "courses" c1
        WHERE EXISTS (
          SELECT 1 FROM "courses" c2
          WHERE c2."user_id" = c1."user_id" 
          AND c2."youtube_playlist_id" = c1."youtube_playlist_id"
          AND c2."youtube_playlist_id" IS NOT NULL
          AND c2."created_at" < c1."created_at"
        )
      )
    `);

    console.log("Step 2: Adding user_id column to videos (nullable)...");
    await db.execute(sql`
      ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "user_id" uuid
    `);

    console.log("Step 3: Populating user_id from courses...");
    await db.execute(sql`
      UPDATE "videos" 
      SET "user_id" = "courses"."user_id" 
      FROM "courses" 
      WHERE "videos"."course_id" = "courses"."id"
      AND "videos"."user_id" IS NULL
    `);

    console.log("Step 4: Making user_id NOT NULL...");
    await db.execute(sql`
      ALTER TABLE "videos" ALTER COLUMN "user_id" SET NOT NULL
    `);

    console.log("Step 5: Adding foreign key constraint...");
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "videos" 
        ADD CONSTRAINT "videos_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
        ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("Step 6: Adding composite unique constraint on courses...");
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "courses" 
        ADD CONSTRAINT "courses_user_id_youtube_playlist_id_unique" 
        UNIQUE("user_id","youtube_playlist_id");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("Step 7: Adding composite unique constraint on videos...");
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "videos" 
        ADD CONSTRAINT "videos_user_id_youtube_video_id_unique" 
        UNIQUE("user_id","youtube_video_id");
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("Migration applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
