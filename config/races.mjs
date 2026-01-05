/**
 * Race configuration (display + future mechanics hooks).
 */

export const RACES = {
  outworlder: "Outworlder",
  celestine: "Celestine",
  draconian: "Draconian",
  elf: "Elf",
  human: "Human",
  leonid: "Leonid",
  runic: "Runic",
  smoulder: "Smoulder"
};

/**
 * Canonical ordering for dropdowns and iteration.
 */
export const RACE_ORDER = [
  "outworlder",
  "celestine",
  "draconian",
  "elf",
  "human",
  "leonid",
  "runic",
  "smoulder"
];

/**
 * Race-based adjustments (baseline deltas).
 * These are applied AFTER rank scaling for max resources,
 * and added to derived pace (rank pace mod) for now.
 *
 * For now, Outworlder is locked to 0 across the board (per your note).
 */
export const RACE_ADJUSTMENTS = {
  outworlder: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },

  // placeholders (set later)
  celestine: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  draconian: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  elf: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  human: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  leonid: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  runic: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  smoulder: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 }
};

/**
 * Race descriptions / notes (UI only).
 * Use these to record racial abilities that will later drive derived values.
 */
export const RACE_DESCRIPTIONS = {
  outworlder: "Baseline traveler from another world. (Adjustments: 0 LF / 0 Mana / 0 Stamina / 0 Pace for now.)",

  // placeholders (fill later)
  celestine: "",
  draconian: "",
  elf: "",
  human: "",
  leonid: "",
  runic: "",
  smoulder: ""
};
