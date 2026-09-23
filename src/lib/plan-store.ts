import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { type BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { clashes } from "./clash";
import { activities, courses, picks } from "./schema";

// A class-picker plan: what one plan id has picked, and the catalogue it
// picks from. Unlike src/lib/db.ts (one singleton tied to DATABASE_PATH),
// this module is a factory — production opens it once against the shared
// volume file, and each test opens it against its own throwaway file.
export interface Activity {
  id: number;
  courseCode: string;
  type: string;
  group: string;
  day: number;
  startMin: number;
  endMin: number;
}

export interface ActivitySeed {
  courseCode: string;
  courseTitle: string;
  type: string;
  group: string;
  day: number;
  startMin: number;
  endMin: number;
}

// DESIGN.md's demo catalogue. Days are 1-5 (Mon-Fri); times are minutes
// after midnight.
export const SEED_CATALOGUE: ActivitySeed[] = [
  { courseCode: "COMP4020", courseTitle: "Agentic Coding Studio", type: "LEC", group: "01", day: 1, startMin: 660, endMin: 780 },
  { courseCode: "COMP4020", courseTitle: "Agentic Coding Studio", type: "CRIT", group: "01", day: 3, startMin: 930, endMin: 1020 },
  { courseCode: "COMP4020", courseTitle: "Agentic Coding Studio", type: "CRIT", group: "02", day: 4, startMin: 840, endMin: 930 },
  { courseCode: "COMP4020", courseTitle: "Agentic Coding Studio", type: "CRIT", group: "03", day: 5, startMin: 600, endMin: 690 },
  { courseCode: "COMP2100", courseTitle: "Software Design Methodologies", type: "LEC", group: "01", day: 2, startMin: 540, endMin: 660 },
  { courseCode: "COMP2100", courseTitle: "Software Design Methodologies", type: "TUT", group: "01", day: 3, startMin: 960, endMin: 1080 },
  { courseCode: "COMP2100", courseTitle: "Software Design Methodologies", type: "TUT", group: "02", day: 4, startMin: 900, endMin: 1020 },
  { courseCode: "COMP2100", courseTitle: "Software Design Methodologies", type: "TUT", group: "03", day: 1, startMin: 780, endMin: 900 },
  { courseCode: "MATH1005", courseTitle: "Discrete Mathematical Models", type: "LEC", group: "01", day: 1, startMin: 720, endMin: 780 },
  { courseCode: "MATH1005", courseTitle: "Discrete Mathematical Models", type: "TUT", group: "01", day: 5, startMin: 600, endMin: 660 },
  { courseCode: "MATH1005", courseTitle: "Discrete Mathematical Models", type: "TUT", group: "02", day: 2, startMin: 660, endMin: 720 },
];

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];

function formatTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Exported so /plan can render the exact same "clashes with ..." wording
// ClashError throws — DESIGN.md: "the page's label and the server's
// refusal come from the same function."
export function describeActivity(a: Activity): string {
  return `${a.courseCode} ${a.type} ${a.group} (${DAY_NAMES[a.day]} ${formatTime(a.startMin)}–${formatTime(a.endMin)})`;
}

// DESIGN.md's exact wording: "clashes with <COURSE> <TYPE> <GROUP>
// (<Day> <start>-<end>)".
export class ClashError extends Error {
  readonly clashesWith: Activity;

  constructor(clashesWith: Activity) {
    super(`clashes with ${describeActivity(clashesWith)}`);
    this.name = "ClashError";
    this.clashesWith = clashesWith;
  }
}

// DESIGN.md: "Picking an activity id that does not exist is refused with
// HTTP 404. Nothing is written."
export class NotFoundError extends Error {
  constructor(activityId: number) {
    super(`no such activity: ${activityId}`);
    this.name = "NotFoundError";
  }
}

export type OptionStatus = "picked" | "fits" | { clashesWith: Activity };

// DESIGN.md: "The page's 'fits' / 'clashes with ...' label and the server's
// refusal come from the same function. They cannot disagree." `picks` is
// the plan's current picks; the pick for the same course+type as `activity`
// is ignored, since picking a different group of the same type swaps
// rather than clashes.
export function optionStatus(picks: Activity[], activity: Activity): OptionStatus {
  if (picks.some((p) => p.id === activity.id)) return "picked";
  const clash = picks.find(
    (p) => !(p.courseCode === activity.courseCode && p.type === activity.type) && clashes(activity, p),
  );
  return clash ? { clashesWith: clash } : "fits";
}

export interface CourseInfo {
  code: string;
  title: string;
}

export interface PlanStore {
  findActivity(courseCode: string, type: string, group: string): Activity;
  listCourses(): CourseInfo[];
  listActivities(): Activity[];
  listPicks(planId: string): Activity[];
  pick(planId: string, activityId: number): Activity;
  removePick(planId: string, activityId: number): void;
  close(): void;
}

function seedIfEmpty(db: BetterSQLite3Database, catalogue: ActivitySeed[]): void {
  const already = db.select({ id: activities.id }).from(activities).limit(1).all();
  if (already.length > 0) return;

  db.transaction((tx) => {
    const titleByCode = new Map<string, string>();
    for (const seed of catalogue) titleByCode.set(seed.courseCode, seed.courseTitle);
    for (const [code, title] of titleByCode) {
      tx.insert(courses).values({ code, title }).onConflictDoNothing().run();
    }
    for (const seed of catalogue) {
      tx.insert(activities)
        .values({
          courseCode: seed.courseCode,
          type: seed.type,
          group: seed.group,
          day: seed.day,
          startMin: seed.startMin,
          endMin: seed.endMin,
        })
        .onConflictDoNothing()
        .run();
    }
  });
}

// Opens (creating if needed) a SQLite file at `path`, runs migrations, and
// seeds `catalogue` if the activity table is empty. Reopening the same path
// is safe: migrations no-op once applied, and seeding is skipped once the
// table has rows.
export function openPlanStore(path: string, catalogue: ActivitySeed[] = SEED_CATALOGUE): PlanStore {
  mkdirSync(dirname(path), { recursive: true });
  const client = new Database(path);
  client.pragma("journal_mode = WAL");
  const db = drizzle(client);
  migrate(db, { migrationsFolder: "./drizzle" });
  seedIfEmpty(db, catalogue);

  return {
    findActivity(courseCode, type, group) {
      const row = db
        .select()
        .from(activities)
        .where(and(eq(activities.courseCode, courseCode), eq(activities.type, type), eq(activities.group, group)))
        .get();
      if (!row) throw new Error(`no such activity: ${courseCode} ${type} ${group}`);
      return row;
    },
    // (kept as a plain Error above: that lookup is by course/type/group, for
    // tests and seeding, not DESIGN.md's "picking an activity id" 404 rule)

    listCourses() {
      return db.select({ code: courses.code, title: courses.title }).from(courses).all();
    },

    // Ordered by id, i.e. seed/insertion order — DESIGN.md's course list
    // order, for /plan to group by course and then by activity type.
    listActivities() {
      return db
        .select({
          id: activities.id,
          courseCode: activities.courseCode,
          type: activities.type,
          group: activities.group,
          day: activities.day,
          startMin: activities.startMin,
          endMin: activities.endMin,
        })
        .from(activities)
        .orderBy(activities.id)
        .all();
    },

    listPicks(planId) {
      return db
        .select({
          id: activities.id,
          courseCode: activities.courseCode,
          type: activities.type,
          group: activities.group,
          day: activities.day,
          startMin: activities.startMin,
          endMin: activities.endMin,
        })
        .from(picks)
        .innerJoin(activities, eq(picks.activityId, activities.id))
        .where(eq(picks.planId, planId))
        .orderBy(activities.id)
        .all();
    },

    // One transaction: load the plan's current picks (as full Activity rows,
    // the same shape optionStatus takes), run them through optionStatus —
    // the same function the page's label comes from — and only write on
    // "fits"/"picked". A clash throws and rolls back — nothing is written.
    pick(planId, activityId) {
      return db.transaction((tx) => {
        const target = tx.select().from(activities).where(eq(activities.id, activityId)).get();
        if (!target) throw new NotFoundError(activityId);

        const currentPicks = tx
          .select({
            id: activities.id,
            courseCode: activities.courseCode,
            type: activities.type,
            group: activities.group,
            day: activities.day,
            startMin: activities.startMin,
            endMin: activities.endMin,
          })
          .from(picks)
          .innerJoin(activities, eq(picks.activityId, activities.id))
          .where(eq(picks.planId, planId))
          .all();

        const status = optionStatus(currentPicks, target);
        if (typeof status === "object") throw new ClashError(status.clashesWith);

        tx.delete(picks)
          .where(and(eq(picks.planId, planId), eq(picks.courseCode, target.courseCode), eq(picks.type, target.type)))
          .run();

        tx.insert(picks)
          .values({ planId, activityId: target.id, courseCode: target.courseCode, type: target.type })
          .run();

        return target;
      });
    },

    removePick(planId, activityId) {
      db.delete(picks).where(and(eq(picks.planId, planId), eq(picks.activityId, activityId))).run();
    },

    close() {
      client.close();
    },
  };
}
