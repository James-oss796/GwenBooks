ALTER TABLE "uploaded_books" ALTER COLUMN "likes_count" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "likes_count" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "views_count" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "views_count" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "uploaded_books" ALTER COLUMN "is_public" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "uploaded_books" DROP COLUMN "approved_at";