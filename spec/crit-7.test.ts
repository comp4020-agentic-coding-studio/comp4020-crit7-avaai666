import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// C7's own spec, turned into tests before any of it is built. See DESIGN.md
// for the product this describes. Both modules imported below do not exist
// yet — that is the point: this file is the contract the next session builds
// against, not a suite that passes today.
//
//   src/lib/clash.ts
//     export interface TimeSlot { day: number; startMin: number; endMin: number }
//     export function clashes(a: TimeSlot, b: TimeSlot): boolean
//       -- pure; DESIGN.md's rule: a.day === b.day && a.start < b.end && b.start < a.end
//
//   src/lib/plan-store.ts
//     export interface Activity {
//       id: number; courseCode: string; type: string; group: string;
//       day: number; startMin: number; endMin: number;
//     }
//     export interface ActivitySeed {
//       courseCode: string; courseTitle: string; type: string; group: string;
//       day: number; startMin: number; endMin: number;
//     }
//     export const SEED_CATALOGUE: ActivitySeed[]  -- the DESIGN.md demo table
//     export class ClashError extends Error {
//       readonly clashesWith: Activity;
//       -- message names the clashing class, e.g.
//          "clashes with COMP4020 CRIT 01 (Wed 15:30-17:00)"
//     }
//     export interface PlanStore {
//       findActivity(courseCode: string, type: string, group: string): Activity;
//       listPicks(planId: string): Activity[];
//       pick(planId: string, activityId: number): Activity; // throws ClashError, writes nothing
//       removePick(planId: string, activityId: number): void;
//       close(): void;
//     }
//     export function openPlanStore(path: string, catalogue?: ActivitySeed[]): PlanStore
//       -- opens (creating if needed) a SQLite file at `path`, runs migrations,
//          and seeds `catalogue` (default SEED_CATALOGUE) into it if the
//          activity table is empty. Reopening the same path must not reseed
//          or duplicate rows.

import { clashes, type TimeSlot } from "../src/lib/clash";
import {
  type ActivitySeed,
  openPlanStore,
  ClashError,
  NotFoundError,
  optionStatus,
  SEED_CATALOGUE,
  type PlanStore,
} from "../src/lib/plan-store";

// Days per DESIGN.md: 1-5, Mon-Fri.
const MON = 1;
const TUE = 2;
const WED = 3;
const THU = 4;
const FRI = 5;

const slot = (day: number, startMin: number, endMin: number): TimeSlot => ({ day, startMin, endMin });

describe("clash rule (pure)", () => {
  it("clashes: same day, overlapping", () => {
    // COMP2100 TUT 01 (Wed 16:00-18:00) vs COMP4020 CRIT 01 (Wed 15:30-17:00)
    const a = slot(WED, 960, 1080);
    const b = slot(WED, 930, 1020);
    expect(clashes(a, b)).toBe(true);
  });

  it("clashes: one class fully inside the other", () => {
    const outer = slot(TUE, 540, 1020); // 09:00-17:00
    const inner = slot(TUE, 600, 660); // 10:00-11:00
    expect(clashes(outer, inner)).toBe(true);
  });

  it("does not clash: same day, one ends exactly when the other starts", () => {
    // COMP4020 LEC 01 (Mon 11:00-13:00) vs COMP2100 TUT 03 (Mon 13:00-15:00)
    const a = slot(MON, 660, 780);
    const b = slot(MON, 780, 900);
    expect(clashes(a, b)).toBe(false);
  });

  it("does not clash: different day, same times", () => {
    const a = slot(WED, 930, 1020);
    const b = slot(THU, 930, 1020);
    expect(clashes(a, b)).toBe(false);
  });

  it("is symmetric", () => {
    const overlapping: [TimeSlot, TimeSlot] = [slot(FRI, 600, 690), slot(FRI, 630, 720)];
    const apart: [TimeSlot, TimeSlot] = [slot(FRI, 600, 690), slot(FRI, 690, 780)];
    expect(clashes(...overlapping)).toBe(clashes(overlapping[1], overlapping[0]));
    expect(clashes(...apart)).toBe(clashes(apart[1], apart[0]));
  });
});

describe("picking (real SQLite, temp file per test)", () => {
  let dir: string;
  let store: PlanStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "crit7-plan-"));
    store = openPlanStore(join(dir, "test.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("saves a pick that fits", () => {
    const planId = randomUUID();
    const lec = store.findActivity("COMP4020", "LEC", "01");

    store.pick(planId, lec.id);

    expect(store.listPicks(planId).map((a) => a.id)).toContain(lec.id);
  });

  it("refuses a clashing pick, names the clash, and writes nothing", () => {
    const planId = randomUUID();
    // COMP4020 LEC 01 (Mon 11:00-13:00) vs MATH1005 LEC 01 (Mon 12:00-13:00): clash
    const comp4020Lec = store.findActivity("COMP4020", "LEC", "01");
    const mathLec = store.findActivity("MATH1005", "LEC", "01");

    store.pick(planId, comp4020Lec.id);

    let error: unknown;
    try {
      store.pick(planId, mathLec.id);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(ClashError);
    const clashError = error as ClashError;
    expect(clashError.clashesWith.id).toBe(comp4020Lec.id);
    expect(clashError.message).toContain("COMP4020");

    const picks = store.listPicks(planId);
    expect(picks.map((a) => a.id)).toEqual([comp4020Lec.id]);
  });

  it("replaces the previous pick of the same course + activity type", () => {
    const planId = randomUUID();
    const crit01 = store.findActivity("COMP4020", "CRIT", "01");
    const crit03 = store.findActivity("COMP4020", "CRIT", "03");

    store.pick(planId, crit01.id);
    store.pick(planId, crit03.id);

    const picks = store.listPicks(planId).filter((a) => a.courseCode === "COMP4020" && a.type === "CRIT");
    expect(picks.map((a) => a.id)).toEqual([crit03.id]);
  });

  it("swapping is not blocked by the group being replaced, even if their times overlap", () => {
    const planId = randomUUID();
    const custom: ActivitySeed[] = [
      {
        courseCode: "TEST1000",
        courseTitle: "Test Course",
        type: "TUT",
        group: "01",
        day: MON,
        startMin: 600,
        endMin: 660,
      },
      {
        // overlaps group 01 (630 < 660), but it's the same course + type,
        // so replacing 01 with 02 must not be refused as a clash with itself
        courseCode: "TEST1000",
        courseTitle: "Test Course",
        type: "TUT",
        group: "02",
        day: MON,
        startMin: 630,
        endMin: 690,
      },
    ];
    const swapDir = mkdtempSync(join(tmpdir(), "crit7-swap-"));
    const swapStore = openPlanStore(join(swapDir, "test.db"), custom);
    try {
      const g01 = swapStore.findActivity("TEST1000", "TUT", "01");
      const g02 = swapStore.findActivity("TEST1000", "TUT", "02");

      swapStore.pick(planId, g01.id);
      swapStore.pick(planId, g02.id);

      expect(swapStore.listPicks(planId).map((a) => a.id)).toEqual([g02.id]);
    } finally {
      swapStore.close();
      rmSync(swapDir, { recursive: true, force: true });
    }
  });

  it("removes a pick", () => {
    const planId = randomUUID();
    const lec = store.findActivity("COMP4020", "LEC", "01");
    store.pick(planId, lec.id);

    store.removePick(planId, lec.id);

    expect(store.listPicks(planId).map((a) => a.id)).not.toContain(lec.id);
  });

  it("persists across closing and reopening the same file", () => {
    const planId = randomUUID();
    const dbPath = join(dir, "test.db");
    const lec = store.findActivity("COMP4020", "LEC", "01");
    store.pick(planId, lec.id);
    store.close();

    store = openPlanStore(dbPath);

    expect(store.listPicks(planId).map((a) => a.id)).toContain(lec.id);
  });

  it("keeps two plan ids independent", () => {
    const planA = randomUUID();
    const planB = randomUUID();
    const critA = store.findActivity("COMP4020", "CRIT", "01");
    const critB = store.findActivity("COMP4020", "CRIT", "02");

    store.pick(planA, critA.id);
    store.pick(planB, critB.id);

    expect(store.listPicks(planA).map((a) => a.id)).toEqual([critA.id]);
    expect(store.listPicks(planB).map((a) => a.id)).toEqual([critB.id]);
  });
});

// DESIGN.md, added this session: "Picking an activity id that does not exist
// is refused with HTTP 404. Nothing is written."
describe("unknown activity id (real SQLite, temp file per test)", () => {
  let dir: string;
  let store: PlanStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "crit7-plan-"));
    store = openPlanStore(join(dir, "test.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("refuses to pick an activity id that does not exist, and writes nothing", () => {
    const planId = randomUUID();

    expect(() => store.pick(planId, 999999)).toThrow(NotFoundError);
    expect(store.listPicks(planId)).toEqual([]);
  });

  // plan-store's pick() takes only (planId, activityId) — there is no
  // parameter through which a caller could supply course_code/type, and
  // DESIGN.md's API only ever accepts {"activityId": <id>}. There is no
  // vector for a caller to pass a mismatched course_code/type, so the
  // "pick row always matches its activity" case does not apply at this
  // layer. Skipped rather than written against a parameter that doesn't
  // exist.
  it.skip("a pick row's course_code/type always match its activity, even if the caller passes something else — not applicable: pick() has no such parameter", () => {});
});

// DESIGN.md, added this session: "The page's 'fits' / 'clashes with ...'
// label and the server's refusal come from the same function."
describe("optionStatus (the shared fits/clashes/picked check)", () => {
  let dir: string;
  let store: PlanStore;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "crit7-plan-"));
    store = openPlanStore(join(dir, "test.db"));
  });

  afterEach(() => {
    store.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("matches DESIGN.md's worked example after picking COMP4020 CRIT 01", () => {
    const planId = randomUUID();
    const crit01 = store.findActivity("COMP4020", "CRIT", "01");
    store.pick(planId, crit01.id);
    const picks = store.listPicks(planId);

    const tut01 = store.findActivity("COMP2100", "TUT", "01");
    const tut03 = store.findActivity("COMP2100", "TUT", "03");
    const crit02 = store.findActivity("COMP4020", "CRIT", "02");

    expect(optionStatus(picks, tut01)).toEqual({ clashesWith: crit01 });
    expect(optionStatus(picks, tut03)).toBe("fits");
    expect(optionStatus(picks, crit02)).toBe("fits");
    expect(optionStatus(picks, crit01)).toBe("picked");
  });

  it("pick() agrees with optionStatus for every seed activity, after one pick", () => {
    const planId = randomUUID();
    const crit01 = store.findActivity("COMP4020", "CRIT", "01");
    store.pick(planId, crit01.id);

    for (const seed of SEED_CATALOGUE) {
      const activity = store.findActivity(seed.courseCode, seed.type, seed.group);
      const picksBefore = store.listPicks(planId);
      const status = optionStatus(picksBefore, activity);

      if (status === "fits" || status === "picked") {
        expect(() => store.pick(planId, activity.id)).not.toThrow();
      } else {
        let error: unknown;
        try {
          store.pick(planId, activity.id);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ClashError);
        expect((error as ClashError).clashesWith.id).toBe(status.clashesWith.id);
        expect(store.listPicks(planId)).toEqual(picksBefore);
      }
    }
  });
});
