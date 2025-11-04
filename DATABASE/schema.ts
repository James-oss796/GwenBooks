import {
  varchar,
  uuid,
  serial,
  integer,
  unique,
  text,
  pgTable,
  date,
  pgEnum,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const STATUS_ENUM = pgEnum("status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  
]);
export const ROLE_ENUM = pgEnum("role", ["USER", "ADMIN"]);
export const BORROW_STATUS_ENUM = pgEnum("borrow_status", [
  "BORROWED",
  "RETURNED",
]);

export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  status: STATUS_ENUM("status").default("PENDING"),
  role: ROLE_ENUM("role").default("USER"),
  lastActivityDate: date("last_activity_date").defaultNow(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).defaultNow(),
}
);

export const books = pgTable("books", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull(),
  genre: text("genre").notNull(),
  rating: integer("rating").notNull(),
  coverUrl: text("cover_url").notNull(),
  coverColor: varchar("cover_color", { length: 7 }).notNull(),
  description: text("description").notNull(),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(0),
  videoUrl: text("video_url").notNull(),
  summary: varchar("summary").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const borrowRecords = pgTable("borrow_records", {
  id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  bookId: uuid("book_id")
    .references(() => books.id)
    .notNull(),
  borrowDate: timestamp("borrow_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: BORROW_STATUS_ENUM("status").default("BORROWED").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// /DATABASE/schema.ts (add)
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookId: text("book_id").notNull(),
  title: text("title"),
  author: text("author"),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reading_progress = pgTable("reading_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookId: text("book_id").notNull(),
  pageIndex: integer("page_index").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userBookUnique: unique().on(table.userId, table.bookId),
}));


export const uploaded_books = pgTable("uploaded_books", {
  id: serial("id").primaryKey(),
  uploaderId: uuid("uploader_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).default("Unknown"),
  description: text("description"),
  genre: varchar("genre", { length: 100 }),
  language: varchar("language", { length: 50 }).default("English"),
  fileUrl: text("file_url").notNull(),
  coverUrl: text("cover_url"),
  fileType: varchar("file_type", { length: 20 }).default("pdf"),
  likesCount: text("likes_count").default("0"),
  viewsCount: text("views_count").default("0"),
  isPublic: boolean("is_public").default(true),
  status: varchar("status", { length: 20 }).default("PENDING"), // ✅ Added
  adminNote: text("admin_note"), // ✅ Added
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



export const pending_uploads = pgTable("pending_uploads", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  author: text("author"),
  description: text("description"),
  genre: text("genre"),
  language: text("language"),
  fileUrl: text("file_url").notNull(),
  status: text("status").default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // who receives
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  url: text("url"), // link to admin/book page or external
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
