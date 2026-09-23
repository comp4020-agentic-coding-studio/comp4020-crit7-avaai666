import type { APIRoute } from "astro";
import { planStore } from "../../../lib/plan";
import { FixedClassError } from "../../../lib/plan-store";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// DESIGN.md "The one flow": any pick can be removed. removePick() is a
// no-op if nothing matches, so this is always 204 — except DESIGN.md
// "Lectures come first": a fixed class can't be removed, refused with 409.
export const DELETE: APIRoute = ({ params, locals }) => {
  const activityId = Number(params.activityId);
  if (Number.isInteger(activityId)) {
    try {
      planStore.removePick(locals.planId, activityId);
    } catch (error) {
      if (error instanceof FixedClassError) return json({ error: error.message }, 409);
      throw error;
    }
  }
  return new Response(null, { status: 204 });
};
