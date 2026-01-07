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

/* ------------------------------------------------------------------------------------------------ */
/* Race → Granted Abilities (Persistence targets)                                                    */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Race-granted Feature items (persisted as embedded Items of type "feature").
 *
 * NOTE:
 * - These are created/ensured by sheet listeners (later step).
 * - Use grantKey to dedupe safely across renders.
 * - For Humans, Essence Gifts are placeholders that will later "upgrade" when an Essence/Confluence is gained.
 */
export const RACE_GRANTED_FEATURES = {
  human: [
    {
      key: "essenceGift1",
      name: "Essence Gift I",
      grantKey: "race:human:essenceGift1",
      description:
        "Placeholder. When you gain an Essence or Confluence Essence, this gift upgrades into an Essence-aligned ability."
    },
    {
      key: "essenceGift2",
      name: "Essence Gift II",
      grantKey: "race:human:essenceGift2",
      description:
        "Placeholder. When you gain an Essence or Confluence Essence, this gift upgrades into an Essence-aligned ability."
    },
    {
      key: "essenceGift3",
      name: "Essence Gift III",
      grantKey: "race:human:essenceGift3",
      description:
        "Placeholder. When you gain an Essence or Confluence Essence, this gift upgrades into an Essence-aligned ability."
    },
    {
      key: "essenceGift4",
      name: "Essence Gift IV",
      grantKey: "race:human:essenceGift4",
      description:
        "Placeholder. When you gain an Essence or Confluence Essence, this gift upgrades into an Essence-aligned ability."
    },
    {
      key: "humanAmbition",
      name: "Human Ambition",
      grantKey: "race:human:humanAmbition",
      description:
        "Placeholder. Gain 10% more advancement progress for Essence abilities and Specialty scores (i.e., 110% progress when you gain advancement)."
    }
  ]
};

/**
 * Race → granted Aptitudes (persisted to system.aptitudes).
 *
 * NOTE:
 * - This is persistence-only metadata; catalog display still comes from aptitudeCatalog in CONFIG.
 */
export const RACE_GRANTED_APTITUDES = {
  human: ["specialAttack"]
};
