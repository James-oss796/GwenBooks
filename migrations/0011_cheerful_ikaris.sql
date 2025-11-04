CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"url" text,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "likes_count" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "likes_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "views_count" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "views_count" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "is_public" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "uploaded_books" ADD COLUMN "admin_note" text;--> statement-breakpoint
ALTER TABLE "uploaded_books" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;