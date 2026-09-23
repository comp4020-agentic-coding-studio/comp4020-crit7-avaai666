import type { APIRoute } from "astro";
import { planStore } from "../../lib/plan";
import { ClashError, NotFoundError } from "../../lib/plan-store";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const GET: APIRoute = ({ locals }) => {
  return json(planStore.listPicks(locals.planId), 200);
};

// DESIGN.md "The one flow" / "The clash rule": picking saves immediately, a
// clash is refused with 409 naming the class it clashes with, an unknown
// activity id is refused with 404 — both from plan-store's pick(), never
// re-decided here.
export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  const activityId = (body as { activityId?: unknown } | null)?.activityId;
  if (typeof activityId !== "number" || !Number.isInteger(activityId)) {
    return json({ error: "activityId must be an integer" }, 400);
  }

  try {
    planStore.pick(locals.planId, activityId);
  } catch (error) {
    if (error instanceof NotFoundError) return json({ error: error.message }, 404);
    if (error instanceof ClashError) return json({ error: error.message }, 409);
    throw error;
  }

  return json(planStore.listPicks(locals.planId), 200);
};
