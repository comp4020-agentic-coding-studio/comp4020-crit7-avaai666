// The clash rule, from DESIGN.md: two classes clash when they are on the
// same day and their times overlap. Touching (one ends exactly when the
// other starts) is not a clash.
export interface TimeSlot {
  day: number;
  startMin: number;
  endMin: number;
}

export function clashes(a: TimeSlot, b: TimeSlot): boolean {
  return a.day === b.day && a.startMin < b.endMin && b.startMin < a.endMin;
}
