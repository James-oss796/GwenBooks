CREATE TABLE "uploaded_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"uploader_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"author" varchar(255) DEFAULT 'Unknown',
	"description" text,
	"genre" varchar(100),
	"language" varchar(50) DEFAULT 'English',
	"file_url" text NOT NULL,
	"cover_url" text,
	"file_type" varchar(20) DEFAULT 'pdf',
	"likes_count" text DEFAULT '0',
	"views_count" text DEFAULT '0',
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "uploaded_books" ADD CONSTRAINT "uploaded_books_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;