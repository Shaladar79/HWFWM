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
 * Aptitudes (rules placeholder, not yet implemented in mechanics):
 * - Aptitudes grant a 10% reduction in stamina or mana costs for Essence abilities of that aptitude type.
 *
 * Affinities (rules placeholder, not yet implemented in mechanics):
 * - Affinities grant:
 *   - +10% bonus to effects from abilities with a matching elemental type tag.
 *   - Resistance of the matching type (which provides the -5% detrimental effect reduction).
 *
 * Resistances (rules placeholder, not yet implemented in mechanics):
 * - Resistances grant -5% reduction to detrimental effects from abilities of that type.
 */

/**
 * Race-granted Feature items (persisted as embedded Items of type "feature").
 *
 * NOTE:
 * - These are created/ensured by sheet listeners (later step).
 * - Use grantKey to dedupe safely across renders.
 * - Some entries are placeholders until their mechanics are wired.
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
  ],

  elf: [
    {
      key: "mysticBloodline",
      name: "Mystic Bloodline",
      grantKey: "race:elf:mysticBloodline",
      description:
        "Placeholder. Increase maximum Mana by 15% (applies after normal max calculation; mechanics not wired yet)."
    },
    {
      key: "grace",
      name: "Grace",
      grantKey: "race:elf:grace",
      description:
        "Placeholder. +4 to Speed attribute total (mechanics not wired yet; intended as a flat bonus to Speed)."
    }
  ],

  leonid: [
    {
      key: "ancestralStrength",
      name: "Ancestral Strength",
      grantKey: "race:leonid:ancestralStrength",
      description:
        "Placeholder. +3% Power (intended as an additive attributePct bonus to Power; mechanics not wired yet)."
    },
    {
      key: "ancestralSwiftness",
      name: "Ancestral Swiftness",
      grantKey: "race:leonid:ancestralSwiftness",
      description:
        "Placeholder. +3% Speed (intended as an additive attributePct bonus to Speed; mechanics not wired yet)."
    },
    {
      key: "tireless",
      name: "Tireless",
      grantKey: "race:leonid:tireless",
      description:
        "Placeholder. Reduce Stamina costs for abilities by 20% (mechanics not wired yet)."
    },
    {
      key: "sprint",
      name: "Sprint",
      grantKey: "race:leonid:sprint",
      description:
        "Active (placeholder). Pay 10 Stamina to double your Pace for 1 round."
    },
    {
      key: "leonidsRoar",
      name: "Leonid's Roar",
      grantKey: "race:leonid:leonidsRoar",
      description:
        "Boon (placeholder). Roar to increase nearby allies' Power and Speed by 2% per character rank (Normal 2%, Iron 4%, Bronze 6%, Silver 8%, Gold 10%, Diamond 12%)."
    }
  ],

  celestine: [
    {
      key: "celestialBounty",
      name: "Celestial Bounty",
      grantKey: "race:celestine:celestialBounty",
      description:
        "Placeholder. Increase Mana recovery rate by 20% (recovery-rate mechanics not wired yet)."
    },
    {
      key: "celestialSwiftness",
      name: "Celestial Swiftness",
      grantKey: "race:celestine:celestialSwiftness",
      description:
        "Placeholder. +4% Speed (intended as an additive attributePct bonus to Speed; mechanics not wired yet)."
    },
    {
      key: "manaIntegrity",
      name: "Mana Integrity",
      grantKey: "race:celestine:manaIntegrity",
      description:
        "Placeholder. Reduce Mana costs for abilities by 15% (mechanics not wired yet)."
    }
  ],

  runic: [
    {
      key: "spellborn",
      name: "Spellborn",
      grantKey: "race:runic:spellborn",
      description:
        "Passive (placeholder). Increase maximum Mana by 15% (applies after normal max calculation; mechanics not wired yet)."
    },
    {
      key: "wellspring",
      name: "Wellspring",
      grantKey: "race:runic:wellspring",
      description:
        "Passive (placeholder). Increase Mana recovery rate by 20% (recovery-rate mechanics not wired yet)."
    },
    {
      key: "adaptiveResistance",
      name: "Adaptive Resistance",
      grantKey: "race:runic:adaptiveResistance",
      description:
        "Passive (placeholder). Gain resistance to recently encountered effects; specifically, the last damage type taken."
    },
    {
      key: "manaBeacon",
      name: "Mana Beacon",
      grantKey: "race:runic:manaBeacon",
      description:
        "Active (placeholder). Stabilize ambient magic. Costs 10 Mana to use."
    }
  ]
};

/**
 * Race → granted Aptitudes (persisted to system.aptitudes).
 */
export const RACE_GRANTED_APTITUDES = {
  human: ["specialAttack"],
  elf: ["spell"],
  leonid: ["boon"],
  celestine: ["specialAbility"],
  runic: ["spell"]
};

/**
 * Race → granted Affinities (persisted to system.affinities).
 */
export const RACE_GRANTED_AFFINITIES = {
  elf: ["life", "nature", "magic"],
  celestine: ["holy", "astral"],
  runic: ["magic"]
};

/**
 * Race → granted Resistances (persisted to system.resistances).
 *
 * NOTE:
 * - Per your rules, resistances are where the -5% detrimental reduction is sourced from.
 * - Affinities imply matching resistances; we grant them explicitly here for clarity.
 * - Runic also has a separate "Adaptive Resistance" feature that is NOT represented here
 *   because it is contextual/dynamic (last damage type taken).
 */
export const RACE_GRANTED_RESISTANCES = {
  elf: ["life", "nature", "magic"],
  celestine: ["holy", "astral"],
  runic: ["magic"]
};
