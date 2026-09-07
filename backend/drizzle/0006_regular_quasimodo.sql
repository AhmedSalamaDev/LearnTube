CREATE TABLE "user_courses" (
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_courses_user_id_course_id_pk" PRIMARY KEY("user_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_user_id_youtube_playlist_id_unique";--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "videos_user_id_youtube_video_id_unique";--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "videos_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_courses" ADD CONSTRAINT "user_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_youtube_playlist_id_unique" UNIQUE("youtube_playlist_id");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_youtube_video_id_unique" UNIQUE("youtube_video_id");