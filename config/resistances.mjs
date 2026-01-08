/**
 * Resistances configuration
 * Reference data only (do not mutate at runtime).
 *
 * Display convention on sheet:
 * "Resistance: <Name>"
 */
export const HWFWM_RESISTANCES = {
  fire: { name: "Fire" },
  ice: { name: "Ice" },
  lightning: { name: "Lightning" },
  earth: { name: "Earth" },

  life: { name: "Life" },
  nature: { name: "Nature" },
  astral: { name: "Astral" },

  // Added to match RACE_GRANTED_RESISTANCES in config/races.mjs
  magic: { name: "Magic" },
  holy: { name: "Holy" }
};
