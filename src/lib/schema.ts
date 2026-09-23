import { sql } from "drizzle-orm";
import { int, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
export const messages = sqliteTable("messages", {
  id: int().primaryKey({ autoIncrement: true }),
  body: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Message = typeof messages.$inferSelect;

// The class picker's tables (DESIGN.md "Data"). `course` and `activity` hold
// the seeded demo catalogue; `pick` holds one plan's choices.
export const courses = sqliteTable("course", {
  code: text().primaryKey(),
  title: text().notNull(),
});

export const activities = sqliteTable(
  "activity",
  {
    id: int().primaryKey({ autoIncrement: true }),
    courseCode: text("course_code")
      .notNull()
      .references(() => courses.code),
    type: text().notNull(),
    group: text().notNull(),
    day: int().notNull(),
    startMin: int("start_min").notNull(),
    endMin: int("end_min").notNull(),
  },
  (table) => [
    // lets seeding use onConflictDoNothing() instead of checking by hand —
    // running the seed twice must not duplicate rows
    uniqueIndex("activity_course_type_group_unique").on(table.courseCode, table.type, table.group),
  ],
);

export const picks = sqliteTable(
  "pick",
  {
    planId: text("plan_id").notNull(),
    activityId: int("activity_id")
      .notNull()
      .references(() => activities.id),
    // denormalised from `activity`: DESIGN.md's table only lists
    // (plan_id, activity_id), but its invariant is "one pick per (plan_id,
    // course_code, type)" — course_code/type are activity's, not pick's, so
    // enforcing that as a real unique constraint (not just app code) needs
    // them copied onto the pick row too.
    courseCode: text("course_code").notNull(),
    type: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.planId, table.activityId] }),
    uniqueIndex("pick_plan_course_type_unique").on(table.planId, table.courseCode, table.type),
  ],
);

export type Course = typeof courses.$inferSelect;
export type ActivityRow = typeof activities.$inferSelect;
export type PickRow = typeof picks.$inferSelect;
