/**
 * Race configuration.
 *
 * KEEP STABLE (UI):
 * - RACES: key -> label for dropdowns
 * - RACE_ORDER: canonical ordering
 *
 * NEW (Mechanics-ready):
 * - RACE_ADJUSTMENTS: per-race numeric adjustments for derived stats
 * - RACE_DESCRIPTIONS: short description + notes placeholder for racial abilities
 *
 * Notes:
 * - All adjustments are deltas (additive modifiers). Default is 0.
 * - We are only filling these out starting from the top (outworlder first).
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
 * Racial adjustments (additive deltas).
 * These will be applied later when we wire derived data:
 * - lifeForce
 * - mana
 * - stamina
 * - pace
 *
 * If you later want attribute % adjustments too, we can add:
 *   attributes: { power: 0, speed: 0, spirit: 0, recovery: 0 }
 */
export const RACE_ADJUSTMENTS = {
  outworlder: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },

  // placeholders until we fill them in
  celestine: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  draconian: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  elf: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  human: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  leonid: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  runic: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 },
  smoulder: { lifeForce: 0, mana: 0, stamina: 0, pace: 0 }
};

/**
 * Short race descriptions + placeholders for special rules.
 * Keep these brief; we can expand later or move to a separate lore file.
 */
export const RACE_DESCRIPTIONS = {
  outworlder: {
    summary: "A person from another world; adaptable but socially and culturally displaced.",
    notes: [
      "Racial abilities: TBD",
      "Future hooks: affinities/resistances/aptitudes TBD"
    ]
  },

  // placeholders until we fill them in
  celestine: { summary: "TBD", notes: ["Racial abilities: TBD"] },
  draconian: { summary: "TBD", notes: ["Racial abilities: TBD"] },
  elf: { summary: "TBD", notes: ["Racial abilities: TBD"] },
  human: { summary: "TBD", notes: ["Racial abilities: TBD"] },
  leonid: { summary: "TBD", notes: ["Racial abilities: TBD"] },
  runic: { summary: "TBD", notes: ["Racial abilities: TBD"] },
  smoulder: { summary: "TBD", notes: ["Racial abilities: TBD"] }
};
