import type { APIRoute } from "astro";
import { planStore } from "../../lib/plan";
import { NoSolutionError } from "../../lib/plan-store";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// DESIGN.md "Fill the rest for me": 200 with the new picks, or 409 with the
// no-solution message. The search is plan-store's fill(), never the page's.
export const POST: APIRoute = ({ locals }) => {
  try {
    return json(planStore.fill(locals.planId), 200);
  } catch (error) {
    if (error instanceof NoSolutionError) return json({ error: error.message }, 409);
    throw error;
  }
};
