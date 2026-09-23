import type { APIRoute } from "astro";
import { planStore } from "../../../lib/plan";

// DESIGN.md "The one flow": any pick can be removed. removePick() is a
// no-op if nothing matches, so this is always 204.
export const DELETE: APIRoute = ({ params, locals }) => {
  const activityId = Number(params.activityId);
  if (Number.isInteger(activityId)) {
    planStore.removePick(locals.planId, activityId);
  }
  return new Response(null, { status: 204 });
};
