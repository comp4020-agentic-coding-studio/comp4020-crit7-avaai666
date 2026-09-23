/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    // Set by src/middleware.ts from the "plan" cookie. DESIGN.md "Whose plan
    // is it": never read a plan id from anywhere else.
    planId: string;
  }
}
