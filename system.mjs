import { HWFWM_CONFIG } from "./config/index.mjs";
import { HwfwmActorSheet } from "./scripts/sheets/actor-sheet.mjs";

Hooks.once("init", () => {
  console.log("HWFWM System | Initialized");

  // Register system-wide config namespace
  CONFIG["hwfwm-system"] = HWFWM_CONFIG;

  // Helper used by the sheet template
  Handlebars.registerHelper("eq", (a, b) => a === b);

  // v13+ namespaced Actors collection (avoids deprecation warning)
  const ActorsCollection = foundry.documents.collections.Actors;

  // Register our sheet for PC actors only (prevents "type may not be undefined")
  ActorsCollection.registerSheet("hwfwm-system", HwfwmActorSheet, {
    types: ["pc"],
    makeDefault: true,
    label: "HWFWM PC Sheet"
  });
});
