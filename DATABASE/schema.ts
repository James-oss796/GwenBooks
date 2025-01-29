
import { uuid, varchar, integer, date, text, timestamp, boolean, pgTable, pgEnum } from "drizzle-orm/pg-core";

export const STATUS_ENUM = pgEnum("status", ['PENDING', 'APPROVED', 'REJECTED']);
export const ROLE_ENUM = pgEnum("role", ['USER', 'ADMIN', 'SUPER_ADMIN']);
export const BORROW_ENUM = pgEnum("borrow_status", ['BORROWED', 'RETURNED']);

export const users = pgTable("users", {
  id: uuid('id').notNull().primaryKey().defaultRandom().unique(),
  fullName: varchar("full_name", {length: 255}).notNull(),
  email: text("email").notNull().unique(),
  universityId: text("university_id").unique(),
  password: text("password").notNull(),
  // universityCard: text("university_card").notNull(),
  status: STATUS_ENUM('status').default('PENDING'),
  role: ROLE_ENUM('role').default('USER'),
  lastActivityDate: date('last_activity_date').defaultNow(),
  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).defaultNow(),

});
