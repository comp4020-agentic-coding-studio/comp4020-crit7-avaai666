import { clashes, type TimeSlot } from "./clash";

// The week grid: 08:00-20:00 in 15-minute rows, so every seed time (all on
// the hour or half-hour) lines up on a row boundary. Column 1 is the hour
// gutter, so Mon..Fri are columns 2..6.
export const GRID_START_MIN = 480;
export const GRID_ROWS = ((20 - 8) * 60) / 15;

export function gridRow(min: number): number {
  return Math.min(Math.max(Math.round((min - GRID_START_MIN) / 15), 0), GRID_ROWS) + 1;
}

// Both ends are explicit: the preview block is absolutely positioned, and an
// absolutely positioned grid item with no column end stretches to the grid's
// far edge instead of spanning one column.
export function gridPlacement(slot: TimeSlot): { gridColumn: string; gridRow: string } {
  const column = slot.day + 1;
  return {
    gridColumn: `${column} / ${column + 1}`,
    gridRow: `${gridRow(slot.startMin)} / ${gridRow(slot.endMin)}`,
  };
}

// While a preview overlaps existing week blocks, they share the column like
// a calendar: those blocks in the left half, the preview in the right half.
// Overlap is the clash rule itself, so touching blocks stay full width.
export function previewSplit(
  preview: TimeSlot,
  blocks: (TimeSlot & { id: number })[],
): { preview: "full" | "right"; leftIds: number[] } {
  const leftIds = blocks.filter((b) => clashes(preview, b)).map((b) => b.id);
  return { preview: leftIds.length > 0 ? "right" : "full", leftIds };
}
