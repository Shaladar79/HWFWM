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
  outworlder: { lifeForce: 5, mana: 5, stamina: 5, pace: 5 },

  // placeholders (set later)
  celestine: { lifeForce: 5, mana: 5, stamina: 3, pace: 6 },
  draconian: { lifeForce: 7, mana: 6, stamina: 3, pace: 4 },
  elf: { lifeForce: 4, mana: 9, stamina: 1, pace: 6 },
  human: { lifeForce: 5, mana: 5, stamina: 5, pace: 5 },
  leonid: { lifeForce: 5, mana: 3, stamina: 6, pace: 6 },
  runic: { lifeForce: 7, mana: 8, stamina: 1, pace: 5 },
  smoulder: { lifeForce: 8, mana: 1, stamina: 7, pace: 4 }
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
