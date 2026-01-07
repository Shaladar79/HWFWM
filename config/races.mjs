/**
 * Race configuration (display + mechanics hooks).
 *
 * This file is AUTHORITATIVE DATA ONLY.
 * No mechanics are applied here — everything is descriptive or declarative.
 *
 * Wiring rules (for later):
 * - Aptitudes → Traits > Enhancements > Aptitudes
 * - Affinities → Traits > Enhancements > Affinities
 * - Granted Abilities → Features (Active / Passive sections later)
 */

/* -------------------------------------------- */
/* Race Labels                                  */
/* -------------------------------------------- */

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

/* -------------------------------------------- */
/* Baseline Resource / Pace Adjustments          */
/* -------------------------------------------- */

export const RACE_ADJUSTMENTS = {
  outworlder: { lifeForce: 5, mana: 5, stamina: 5, pace: 5 },

  celestine: { lifeForce: 5, mana: 5, stamina: 3, pace: 6 },
  draconian: { lifeForce: 7, mana: 6, stamina: 3, pace: 4 },
  elf:       { lifeForce: 4, mana: 9, stamina: 1, pace: 6 },
  human:     { lifeForce: 5, mana: 5, stamina: 5, pace: 5 },
  leonid:    { lifeForce: 5, mana: 3, stamina: 6, pace: 6 },
  runic:     { lifeForce: 7, mana: 8, stamina: 1, pace: 5 },
  smoulder:  { lifeForce: 8, mana: 1, stamina: 7, pace: 4 }
};

/* -------------------------------------------- */
/* Racial Descriptions (UI only)                 */
/* -------------------------------------------- */

export const RACE_DESCRIPTIONS = {
  outworlder:
    "Baseline traveler from another world. No innate affinities or aptitudes.",

  human:
    "Adaptable and ambitious. Humans grow through essence mastery and relentless drive.",

  elf:
    "Mystically attuned beings with strong ties to magic, nature, and the astral.",

  leonid:
    "Proud lionkin warriors whose strength and presence bolster allies.",

  celestine:
    "Heaven-touched beings infused with astral and holy energies.",

  runic:
    "Arcane constructs or rune-bound entities sustained by structured magic.",

  smoulder:
    "Earth- and fire-aspected beings born of stone, magma, and living flame.",

  draconian:
    ""
};

/* -------------------------------------------- */
/* Race → Granted Aptitudes                      */
/* -------------------------------------------- */

export const RACE_GRANTED_APTITUDES = {
  human: ["specialAttack"],

  elf: ["spellcasting"],

  leonid: ["boon"],

  celestine: ["specialAbility"],

  runic: ["spellcasting"]
};

/* -------------------------------------------- */
/* Race → Granted Affinities                     */
/* -------------------------------------------- */

export const RACE_GRANTED_AFFINITIES = {
  elf: ["life", "nature", "magic"],

  celestine: ["holy", "astral"],

  runic: ["magic"],

  smoulder: ["earth", "fire"]
};

/* -------------------------------------------- */
/* Race → Granted Features (Abilities)           */
/* -------------------------------------------- */

export const RACE_GRANTED_FEATURES = {
  /* -------- Human -------- */
  human: [
    {
      key: "essenceGift",
      name: "Essence Gift",
      grantKey: "race:human:essenceGift",
      description:
        "Passive. Gain Essence Gift x4. Each gift evolves into an essence-aligned ability when an Essence or Confluence Essence is acquired."
    },
    {
      key: "humanAmbition",
      name: "Human Ambition",
      grantKey: "race:human:humanAmbition",
      description:
        "Passive (placeholder). Gain 10% increased advancement toward Essence Abilities and Specialty scores."
    }
  ],

  /* -------- Elf -------- */
  elf: [
    {
      key: "mysticBloodline",
      name: "Mystic Bloodline",
      grantKey: "race:elf:mysticBloodline",
      description:
        "Passive (placeholder). Increase maximum Mana by 15%."
    },
    {
      key: "grace",
      name: "Grace",
      grantKey: "race:elf:grace",
      description:
        "Passive. Gain +4 to the Speed attribute."
    }
  ],

  /* -------- Leonid -------- */
  leonid: [
    {
      key: "ancestralStrength",
      name: "Ancestral Strength",
      grantKey: "race:leonid:ancestralStrength",
      description:
        "Passive. Gain +3% Power."
    },
    {
      key: "ancestralSwiftness",
      name: "Ancestral Swiftness",
      grantKey: "race:leonid:ancestralSwiftness",
      description:
        "Passive. Gain +3% Speed."
    },
    {
      key: "tireless",
      name: "Tireless",
      grantKey: "race:leonid:tireless",
      description:
        "Passive (placeholder). Ability stamina costs are reduced by 20%."
    },
    {
      key: "sprint",
      name: "Sprint",
      grantKey: "race:leonid:sprint",
      description:
        "Active. Double Pace for 1 round. Costs 10 Stamina."
    },
    {
      key: "leonidsRoar",
      name: "Leonid’s Roar",
      grantKey: "race:leonid:roar",
      description:
        "Active (Boon). Increase nearby allies’ Power and Speed by 2% per character rank for 1 round."
    }
  ],

  /* -------- Celestine -------- */
  celestine: [
    {
      key: "celestialBounty",
      name: "Celestial Bounty",
      grantKey: "race:celestine:bounty",
      description:
        "Passive (placeholder). Mana recovery rate increased by 20%."
    },
    {
      key: "celestialSwiftness",
      name: "Celestial Swiftness",
      grantKey: "race:celestine:swiftness",
      description:
        "Passive. Gain +4% Speed."
    },
    {
      key: "manaIntegrity",
      name: "Mana Integrity",
      grantKey: "race:celestine:manaIntegrity",
      description:
        "Passive (placeholder). Mana costs reduced by 15%."
    }
  ],

  /* -------- Runic -------- */
  runic: [
    {
      key: "spellborn",
      name: "Spellborn",
      grantKey: "race:runic:spellborn",
      description:
        "Passive (placeholder). Increase maximum Mana by 15%."
    },
    {
      key: "wellspring",
      name: "Wellspring",
      grantKey: "race:runic:wellspring",
      description:
        "Passive (placeholder). Mana recovery rate increased by 20%."
    },
    {
      key: "adaptiveResistance",
      name: "Adaptive Resistance",
      grantKey: "race:runic:adaptiveResistance",
      description:
        "Passive (placeholder). Gain resistance to the most recent damage type encountered."
    },
    {
      key: "manaBeacon",
      name: "Mana Beacon",
      grantKey: "race:runic:manaBeacon",
      description:
        "Active. Stabilize ambient magic in the area. Costs 10 Mana."
    }
  ],

  /* -------- Smoulder -------- */
  smoulder: [
    {
      key: "heartOfTheEarth",
      name: "Heart of the Earth",
      grantKey: "race:smoulder:heartOfTheEarth",
      description:
        "Passive (placeholder). While meditating, Mana and Stamina recovery are doubled."
    },
    {
      key: "lifeFire",
      name: "Life Fire",
      grantKey: "race:smoulder:lifeFire",
      description:
        "Passive (placeholder). Take 10% less fire damage and regain Stamina equal to 10% of fire damage taken."
    },
    {
      key: "earthBorn",
      name: "Earth Born",
      grantKey: "race:smoulder:earthBorn",
      description:
        "Passive (placeholder). Gain +2 Natural Armor."
    },
    {
      key: "flameInvestiture",
      name: "Flame Investiture",
      grantKey: "race:smoulder:flameInvestiture",
      description:
        "Active. Superheat objects. Costs 10 Mana."
    }
  ]
};

