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
  // DESIGN.md "Lectures come first": an activity type with exactly one
  // group is fixed. Computed from the catalogue, not stored.
  fixed: boolean;
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
  { courseCode: "COMP2100", courseTitle: "Software Design Methodologies", type: "TUT", group: "04", day: 5, startMin: 720, endMin: 840 },
  // DESIGN.md, this session: moved from Mon 12:00-13:00 so no two lectures
  // clash (COMP4020 LEC 01 is Mon 11:00-13:00) — this is now COMP2100 TUT 03's
  // fixed-lecture clash instead.
  { courseCode: "MATH1005", courseTitle: "Discrete Mathematical Models", type: "LEC", group: "01", day: 1, startMin: 840, endMin: 900 },
  { courseCode: "MATH1005", courseTitle: "Discrete Mathematical Models", type: "TUT", group: "01", day: 5, startMin: 600, endMin: 660 },
  { courseCode: "MATH1005", courseTitle: "Discrete Mathematical Models", type: "TUT", group: "02", day: 2, startMin: 660, endMin: 720 },
  { courseCode: "MATH1005", courseTitle: "Discrete Mathematical Models", type: "TUT", group: "03", day: 3, startMin: 720, endMin: 780 },
  { courseCode: "STAT1003", courseTitle: "Statistical Techniques", type: "LEC", group: "01", day: 3, startMin: 540, endMin: 660 },
  { courseCode: "STAT1003", courseTitle: "Statistical Techniques", type: "TUT", group: "01", day: 1, startMin: 900, endMin: 960 },
  { courseCode: "STAT1003", courseTitle: "Statistical Techniques", type: "TUT", group: "02", day: 3, startMin: 660, endMin: 720 },
  { courseCode: "STAT1003", courseTitle: "Statistical Techniques", type: "TUT", group: "03", day: 4, startMin: 720, endMin: 780 },
  { courseCode: "STAT1003", courseTitle: "Statistical Techniques", type: "TUT", group: "04", day: 5, startMin: 780, endMin: 840 },
  { courseCode: "COMP2310", courseTitle: "Systems, Networks and Concurrency", type: "LEC", group: "01", day: 4, startMin: 540, endMin: 660 },
  { courseCode: "COMP2310", courseTitle: "Systems, Networks and Concurrency", type: "LAB", group: "01", day: 2, startMin: 720, endMin: 840 },
  { courseCode: "COMP2310", courseTitle: "Systems, Networks and Concurrency", type: "LAB", group: "02", day: 3, startMin: 780, endMin: 900 },
  { courseCode: "COMP2310", courseTitle: "Systems, Networks and Concurrency", type: "LAB", group: "03", day: 4, startMin: 660, endMin: 780 },
  { courseCode: "COMP2310", courseTitle: "Systems, Networks and Concurrency", type: "LAB", group: "04", day: 5, startMin: 840, endMin: 960 },
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
// (<Day> <start>-<end>)", or "clashes with lecture ..." when the class
// being clashed with is fixed. Exported so the page's option label and
// ClashError's message are the same text — DESIGN.md "What the page shows
// is what the server checks".
export function clashReason(clashesWith: Activity): string {
  return `clashes with ${clashesWith.fixed ? "lecture " : ""}${describeActivity(clashesWith)}`;
}

export class ClashError extends Error {
  readonly clashesWith: Activity;

  constructor(clashesWith: Activity) {
    super(clashReason(clashesWith));
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

// DESIGN.md "Lectures come first": fixed classes can't be picked, removed
// or swapped — they're already in the plan.
export class FixedClassError extends Error {
  readonly activity: Activity;

  constructor(activity: Activity) {
    super(`${describeActivity(activity)} is fixed and cannot be picked or removed`);
    this.name = "FixedClassError";
    this.activity = activity;
  }
}

// DESIGN.md "Fill the rest for me": the exact refusal text.
export const NO_SOLUTION_MESSAGE =
  "No clash-free way to fill the rest while keeping your current picks. Try removing one.";

export class NoSolutionError extends Error {
  constructor() {
    super(NO_SOLUTION_MESSAGE);
    this.name = "NoSolutionError";
  }
}

// DESIGN.md "Progress". A choice is a course+type that is not fixed.
export interface Progress {
  fixed: number;
  made: number;
  total: number;
  complete: boolean;
}

export const COMPLETE_MESSAGE = "Your timetable is complete — no clashes.";

export function progressLine(p: Progress): string {
  return `${p.fixed} lectures fixed · ${p.made} of ${p.total} choices made`;
}

export type OptionStatus = "picked" | "fits" | "fixed" | { clashesWith: Activity };

// DESIGN.md: "The page's 'fits' / 'clashes with ...' label and the server's
// refusal come from the same function. They cannot disagree." `picks` is
// the plan's current picks; the pick for the same course+type as `activity`
// is ignored, since picking a different group of the same type swaps
// rather than clashes. A fixed activity always reports "fixed", even
// though it's also always present in `picks`.
export function optionStatus(picks: Activity[], activity: Activity): OptionStatus {
  if (activity.fixed) return "fixed";
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
  progress(planId: string): Progress;
  fill(planId: string): Activity[];
  close(): void;
}

const typeKey = (a: { courseCode: string; type: string }) => `${a.courseCode}\u0000${a.type}`;

// Groups the catalogue by course+type, keeping listed (id) order for both
// the types and the groups inside each.
function groupByTypeKey(catalogue: Activity[]): Map<string, Activity[]> {
  const byKey = new Map<string, Activity[]>();
  for (const a of catalogue) {
    const key = typeKey(a);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(a);
  }
  return byKey;
}

// Depth-first over the unmade choices in listed order, trying each group
// in listed order, so the first completion found is always the same one.
// `placed` starts as the plan's current picks (fixed classes included).
function search(choices: Activity[][], placed: Activity[]): Activity[] | null {
  if (choices.length === 0) return [];
  const [groups, ...rest] = choices;
  for (const g of groups) {
    if (placed.some((p) => clashes(g, p))) continue;
    const tail = search(rest, [...placed, g]);
    if (tail) return [g, ...tail];
  }
  return null;
}

const ACTIVITY_COLUMNS = {
  id: activities.id,
  courseCode: activities.courseCode,
  type: activities.type,
  group: activities.group,
  day: activities.day,
  startMin: activities.startMin,
  endMin: activities.endMin,
};

// DESIGN.md "Lectures come first": an activity type with exactly one group
// is fixed. Computed from the catalogue currently in the database, not
// stored — a set of "courseCode\u0000type" keys.
function computeFixedSet(db: BetterSQLite3Database): Set<string> {
  const rows = db.select({ courseCode: activities.courseCode, type: activities.type, group: activities.group }).from(activities).all();
  const groupsByKey = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = `${row.courseCode}\u0000${row.type}`;
    if (!groupsByKey.has(key)) groupsByKey.set(key, new Set());
    groupsByKey.get(key)!.add(row.group);
  }
  const fixed = new Set<string>();
  for (const [key, groups] of groupsByKey) {
    if (groups.size === 1) fixed.add(key);
  }
  return fixed;
}

// Catalogue seeding is an upsert keyed on (course_code, type, group), not
// only an insert when the table is empty — production already has an old
// row (e.g. MATH1005 LEC 01's old time) that "seed only when empty" would
// never fix on the next deploy.
function upsertCatalogue(db: BetterSQLite3Database, catalogue: ActivitySeed[]): void {
  db.transaction((tx) => {
    const titleByCode = new Map<string, string>();
    for (const seed of catalogue) titleByCode.set(seed.courseCode, seed.courseTitle);
    for (const [code, title] of titleByCode) {
      tx.insert(courses).values({ code, title }).onConflictDoUpdate({ target: courses.code, set: { title } }).run();
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
        .onConflictDoUpdate({
          target: [activities.courseCode, activities.type, activities.group],
          set: { day: seed.day, startMin: seed.startMin, endMin: seed.endMin },
        })
        .run();
    }
  });
}

// DESIGN.md "Lectures come first": ensures every fixed class is picked for
// `planId` (idempotent), then drops any non-fixed pick that now clashes
// with a fixed class — e.g. after the timetable changed and a lecture
// moved onto a tutorial the plan had already picked. Called whenever a
// plan's picks are read.
function ensureFixed(db: BetterSQLite3Database, planId: string, fixed: Activity[]): void {
  db.transaction((tx) => {
    for (const f of fixed) {
      tx.insert(picks)
        .values({ planId, activityId: f.id, courseCode: f.courseCode, type: f.type })
        .onConflictDoNothing()
        .run();
    }

    const current = tx
      .select(ACTIVITY_COLUMNS)
      .from(picks)
      .innerJoin(activities, eq(picks.activityId, activities.id))
      .where(eq(picks.planId, planId))
      .all();

    for (const row of current) {
      if (fixed.some((f) => f.id === row.id)) continue;
      const clashesWithFixed = fixed.some(
        (f) => !(f.courseCode === row.courseCode && f.type === row.type) && clashes(row, f),
      );
      if (clashesWithFixed) {
        tx.delete(picks).where(and(eq(picks.planId, planId), eq(picks.activityId, row.id))).run();
      }
    }
  });
}

// Opens (creating if needed) a SQLite file at `path`, runs migrations, and
// upserts `catalogue` into it, keyed on (course_code, type, group) — safe
// to reopen the same path any number of times, and it picks up catalogue
// changes on an existing database rather than only ever inserting once.
export function openPlanStore(path: string, catalogue: ActivitySeed[] = SEED_CATALOGUE): PlanStore {
  mkdirSync(dirname(path), { recursive: true });
  const client = new Database(path);
  client.pragma("journal_mode = WAL");
  const db = drizzle(client);
  migrate(db, { migrationsFolder: "./drizzle" });
  upsertCatalogue(db, catalogue);

  let fixedSet = computeFixedSet(db);
  const toActivity = (row: Omit<Activity, "fixed">): Activity => ({
    ...row,
    fixed: fixedSet.has(`${row.courseCode}\u0000${row.type}`),
  });
  const fixedActivities = (): Activity[] =>
    db.select(ACTIVITY_COLUMNS).from(activities).orderBy(activities.id).all().map(toActivity).filter((a) => a.fixed);

  const store: PlanStore = {
    findActivity(courseCode, type, group) {
      const row = db
        .select(ACTIVITY_COLUMNS)
        .from(activities)
        .where(and(eq(activities.courseCode, courseCode), eq(activities.type, type), eq(activities.group, group)))
        .get();
      if (!row) throw new Error(`no such activity: ${courseCode} ${type} ${group}`);
      return toActivity(row);
    },
    // (kept as a plain Error above: that lookup is by course/type/group, for
    // tests and seeding, not DESIGN.md's "picking an activity id" 404 rule)

    listCourses() {
      return db.select({ code: courses.code, title: courses.title }).from(courses).all();
    },

    // Ordered by id, i.e. seed/insertion order — DESIGN.md's course list
    // order, for /plan to group by course and then by activity type.
    listActivities() {
      return db.select(ACTIVITY_COLUMNS).from(activities).orderBy(activities.id).all().map(toActivity);
    },

    listPicks(planId) {
      ensureFixed(db, planId, fixedActivities());
      return db
        .select(ACTIVITY_COLUMNS)
        .from(picks)
        .innerJoin(activities, eq(picks.activityId, activities.id))
        .where(eq(picks.planId, planId))
        .orderBy(activities.id)
        .all()
        .map(toActivity);
    },

    // One transaction: load the plan's current picks (as full Activity rows,
    // the same shape optionStatus takes), run them through optionStatus —
    // the same function the page's label comes from — and only write on
    // "fits"/"picked". A clash throws and rolls back — nothing is written.
    // A fixed target is refused outright: it's already in the plan.
    pick(planId, activityId) {
      ensureFixed(db, planId, fixedActivities());
      return db.transaction((tx) => {
        const targetRow = tx.select(ACTIVITY_COLUMNS).from(activities).where(eq(activities.id, activityId)).get();
        if (!targetRow) throw new NotFoundError(activityId);
        const target = toActivity(targetRow);
        if (target.fixed) throw new FixedClassError(target);

        const currentPicks = tx
          .select(ACTIVITY_COLUMNS)
          .from(picks)
          .innerJoin(activities, eq(picks.activityId, activities.id))
          .where(eq(picks.planId, planId))
          .all()
          .map(toActivity);

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
      const row = db.select(ACTIVITY_COLUMNS).from(activities).where(eq(activities.id, activityId)).get();
      if (row && toActivity(row).fixed) throw new FixedClassError(toActivity(row));
      db.delete(picks).where(and(eq(picks.planId, planId), eq(picks.activityId, activityId))).run();
    },

    progress(planId) {
      const current = store.listPicks(planId);
      const byKey = groupByTypeKey(store.listActivities());
      const choiceKeys = [...byKey.keys()].filter((k) => !byKey.get(k)![0].fixed);
      const pickedKeys = new Set(current.map(typeKey));
      const made = choiceKeys.filter((k) => pickedKeys.has(k)).length;
      const noClash = current.every((a, i) => current.slice(i + 1).every((b) => !clashes(a, b)));
      return {
        fixed: byKey.size - choiceKeys.length,
        made,
        total: choiceKeys.length,
        complete: made === choiceKeys.length && noClash,
      };
    },

    // DESIGN.md "Fill the rest for me": the server does the search, keeps
    // every existing pick, and writes all new picks in one transaction or
    // none at all.
    fill(planId) {
      ensureFixed(db, planId, fixedActivities());
      db.transaction((tx) => {
        const current = tx
          .select(ACTIVITY_COLUMNS)
          .from(picks)
          .innerJoin(activities, eq(picks.activityId, activities.id))
          .where(eq(picks.planId, planId))
          .all()
          .map(toActivity);
        const catalogue = tx.select(ACTIVITY_COLUMNS).from(activities).orderBy(activities.id).all().map(toActivity);
        const pickedKeys = new Set(current.map(typeKey));
        const unmade = [...groupByTypeKey(catalogue).values()].filter(
          (groups) => !groups[0].fixed && !pickedKeys.has(typeKey(groups[0])),
        );

        const found = search(unmade, current);
        if (!found) throw new NoSolutionError();

        for (const a of found) {
          tx.insert(picks).values({ planId, activityId: a.id, courseCode: a.courseCode, type: a.type }).run();
        }
      });
      return store.listPicks(planId);
    },

    close() {
      client.close();
    },
  };
  return store;
}
