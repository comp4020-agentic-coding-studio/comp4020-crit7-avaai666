import { randomUUID } from "node:crypto";
import { defineMiddleware } from "astro:middleware";

// DESIGN.md "Whose plan is it": the first request without a "plan" cookie
// gets a random plan id, in a cookie (httpOnly, SameSite=Lax, one year).
// Every route reads the plan id from locals.planId — set here, from this
// cookie, and nowhere else.
export const onRequest = defineMiddleware((context, next) => {
  let planId = context.cookies.get("plan")?.value;
  if (!planId) {
    planId = randomUUID();
    context.cookies.set("plan", planId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: import.meta.env.PROD,
    });
  }
  context.locals.planId = planId;
  return next();
});
