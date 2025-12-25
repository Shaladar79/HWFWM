import { HWFWM_CONFIG } from "./config/index.mjs";

Hooks.once("init", () => {
  console.log("HWFWM System | Initialized");

  // Register system-wide config namespace
  CONFIG["hwfwm-system"] = HWFWM_CONFIG;
});
