import { HWFWM_CONFIG } from "./config/index.mjs";
import { HwfwmActorSheet } from "./scripts/sheets/actor-sheet.mjs";

Hooks.once("init", () => {
  console.log("HWFWM System | Initialized");

  // Register system-wide config namespace
  CONFIG["hwfwm-system"] = HWFWM_CONFIG;

 // Register the Actor sheet (applies to all actor types for now)
Actors.unregisterSheet("core", BaseActorSheet ?? ActorSheet);
Actors.registerSheet("hwfwm-system", HwfwmActorSheet, {
  makeDefault: true,
  label: "HWFWM Actor Sheet"
});
});
