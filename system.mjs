import { HWFWM_CONFIG } from "./config/index.mjs";
import { HwfwmActorSheet } from "./scripts/sheets/actor-sheet.mjs";

Hooks.once("init", () => {
  console.log("HWFWM System | Initialized");

  // Register system-wide config namespace
  CONFIG["hwfwm-system"] = HWFWM_CONFIG;

  // Helper used by the sheet template (safe to register once)
  Handlebars.registerHelper("eq", (a, b) => a === b);

  // Register the Actor sheet (applies to all actor types for now)
  // Do NOT unregister core during early dev; it can cause avoidable issues.
  Actors.registerSheet("hwfwm-system", HwfwmActorSheet, {
    makeDefault: true,
    label: "HWFWM Actor Sheet"
  });
});
