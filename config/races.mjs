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
    "Outworlders are souls pulled through the deep astral, dying in their origin world and being reborn in a new one. They always awaken with Astral Affinity and then develop further through personal selection—an aptitude choice and a set of unique outworlder gifts. Outworlders are often noted to carry an unmistakable “springtime” scent regardless of their former race. Their gifts commonly revolve around astral survivability, adaptation, and unusual utility that other races typically require training or rituals to achieve.",

  human:
    "Humans are the most prevalent people across Pallimustus, defined less by a single innate theme and more by adaptability. Their Essence Gifts evolve as they acquire essences, allowing humans to develop powers that mirror their personal path rather than a fixed racial identity. Humans also excel through ambition: they advance more efficiently in both essence abilities and specialties, accelerating long-term growth. While they are broadly average on paper, they become highly specialized in play as their gifts mature.",

  elf:
    "Elves are mystically attuned people whose traditions favor spellcraft over direct martial combat. They are strongly aligned with Life, Nature, and Magic affinities, granting them breadth in supportive, restorative, and transformative effects. Elven bloodlines are naturally mana-rich, and their grace lends notable speed and finesse. In practice, elves are defined by sustained magical output and the ability to shape a battlefield through layered effects rather than brute force.",

  leonid:
    "Leonids are large, lion-like humanoids with a culture built around pride, presence, and physical excellence. Their ancestry expresses itself as direct improvements to Power and Speed, reinforced by tireless endurance that reduces stamina strain over time. Leonids can surge into short bursts of overwhelming mobility with Sprint, but their hallmark is Leonid’s Roar—a boon that scales with rank to elevate allies’ Power and Speed. In groups, leonids often serve as momentum engines that make everyone around them stronger and faster..",

  celestine:
    "Celestines are heaven-touched beings marked by metallic hair and matching eyes, and they naturally align with Holy and Astral affinities. They tend to manifest more special abilities than overt attacks, with strong internal efficiency that reduces mana burden and enhances recovery. Celestines are not naturally occurring; they arise as the offspring of two outworlders and can also reproduce among themselves. Their speed and presence are often pronounced, reflecting their celestial swiftness and disciplined mana integrity.",

  runic:
    "Runics are rune-bound beings whose tattoo-like markings are not superficial; the patterns are said to run down into the bones, reflecting structured magic embedded into their form. They are naturally aligned with Magic affinity and excel at sustained spellwork through increased mana capacity and enhanced recovery. Their adaptive resistance represents a living enchantment that adjusts to recent harm, while Mana Beacon stabilizes ambient magic when conditions become volatile. Runics feel less like a “people” defined by culture and more like a magical architecture that learned how to walk..",

  smoulder:
    "Smoulder are earth- and fire-aspected beings recognizable by glowing red or orange eyes and a strong connection to volcanic regions. Their nature grants them both Earth and Fire affinities and a body that trends toward natural armor and elemental resilience. Smoulder powers often reward discipline and recovery—meditation dramatically accelerates their mana and stamina restoration, and fire harm can be partially converted into stamina through their living flame. Between durability and elemental control, they are built to endure harsh environments and turn raw elemental forces into advantage.",

  draconian:
    "Draconians claim dragon ancestry, expressed through exceptional physical dominance and innate sorcery. Their scales provide natural protection, and their signature weapon is a breath attack tied to an element chosen at creation. Draconians also carry a deep magical affinity and benefit broadly from their essence abilities, with draconic manifestations shaping how those powers present."
};

/* -------------------------------------------- */
/* Race Choice Rules (declarative; not wired)    */
/* -------------------------------------------- */

export const RACE_APTITUDE_CHOICE = {
  outworlder: {
    id: "outworlderAptitude",
    label: "Choose 1 Aptitude"
  }
};

export const RACE_FEATURE_CHOICE = {
  outworlder: {
    id: "outworlderGifts",
    label: "Choose 4 Outworlder Gifts",
    picks: 4
  }
};

export const RACE_CHOICE_OPTIONS = {
  outworlderGifts: [
    "identify",
    "essenceAbsorb",
    "tongues",
    "noTrace",
    "skillBook",
    "magicDevices",
    "wellOfMana",
    "wellOfStamina",
    "manaFountain",
    "staminaFountain",
    "tough",
    "fastRegeneration"
  ]
};

export const RACE_GIFT_FEATURES = {
  identify: {
    key: "identify",
    name: "Identify",
    grantKey: "race:outworlder:identify",
    description: "Active (placeholder). Spend 5 Mana to identify an item."
  },
  essenceAbsorb: {
    key: "essenceAbsorb",
    name: "Essence Absorb",
    grantKey: "race:outworlder:essenceAbsorb",
    description: "Passive (placeholder). Absorb essences and awakening stones without a ritual."
  },
  tongues: {
    key: "tongues",
    name: "Tongues",
    grantKey: "race:outworlder:tongues",
    description: "Passive (placeholder). Understand and speak any language."
  },
  noTrace: {
    key: "noTrace",
    name: "No Trace",
    grantKey: "race:outworlder:noTrace",
    description: "Passive (placeholder). Cannot be magically tracked."
  },
  skillBook: {
    key: "skillBook",
    name: "Skill Book",
    grantKey: "race:outworlder:skillBook",
    description: "Passive (placeholder). Can use Skill Books."
  },
  magicDevices: {
    key: "magicDevices",
    name: "Magic Devices",
    grantKey: "race:outworlder:magicDevices",
    description: "Passive (placeholder). Can use Magic Devices."
  },
  wellOfMana: {
    key: "wellOfMana",
    name: "Well of Mana",
    grantKey: "race:outworlder:wellOfMana",
    description: "Passive (placeholder). +5% maximum Mana."
  },
  wellOfStamina: {
    key: "wellOfStamina",
    name: "Well of Stamina",
    grantKey: "race:outworlder:wellOfStamina",
    description: "Passive (placeholder). +5% maximum Stamina."
  },
  manaFountain: {
    key: "manaFountain",
    name: "Mana Fountain",
    grantKey: "race:outworlder:manaFountain",
    description: "Passive (placeholder). +5% Mana recovery rate."
  },
  staminaFountain: {
    key: "staminaFountain",
    name: "Stamina Fountain",
    grantKey: "race:outworlder:staminaFountain",
    description: "Passive (placeholder). +5% Stamina recovery rate."
  },
  tough: {
    key: "tough",
    name: "Tough",
    grantKey: "race:outworlder:tough",
    description: "Passive (placeholder). +5% maximum Life Force."
  },
  fastRegeneration: {
    key: "fastRegeneration",
    name: "Fast Regeneration",
    grantKey: "race:outworlder:fastRegeneration",
    description: "Passive (placeholder). +5% Life Force recovery rate."
  }
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
  outworlder: ["astral"],
  elf: ["life", "nature", "magic"],
  celestine: ["holy", "astral"],
  runic: ["magic"],
  smoulder: ["earth", "fire"],
  draconian: ["magic"]
};

/* -------------------------------------------- */
/* Race → Granted Features (Abilities)           */
/* -------------------------------------------- */

export const RACE_GRANTED_FEATURES = {
  /* -------- Human -------- */
  human: [
    {
      key: "essenceGift1",
      name: "Essence Gift I",
      grantKey: "race:human:essenceGift1",
      description:
        "Passive. Essence Gift I. Evolves into an essence-aligned ability when an Essence or Confluence Essence is acquired."
    },
    {
      key: "essenceGift2",
      name: "Essence Gift II",
      grantKey: "race:human:essenceGift2",
      description:
        "Passive. Essence Gift II. Evolves into an essence-aligned ability when an Essence or Confluence Essence is acquired."
    },
    {
      key: "essenceGift3",
      name: "Essence Gift III",
      grantKey: "race:human:essenceGift3",
      description:
        "Passive. Essence Gift III. Evolves into an essence-aligned ability when an Essence or Confluence Essence is acquired."
    },
    {
      key: "essenceGift4",
      name: "Essence Gift IV",
      grantKey: "race:human:essenceGift4",
      description:
        "Passive. Essence Gift IV. Evolves into an essence-aligned ability when an Essence or Confluence Essence is acquired."
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
  ],

  /* -------- Draconian -------- */
  draconian: [
    {
      key: "draconicMight",
      name: "Draconic Might",
      grantKey: "race:draconian:draconicMight",
      description:
        "Passive. Gain +3% Power."
    },
    {
      key: "draconicPower",
      name: "Draconic Power",
      grantKey: "race:draconian:draconicPower",
      description:
        "Passive. Gain +2% Spirit and +5% spell damage."
    },
    {
      key: "dragonAncestry",
      name: "Dragon Ancestry",
      grantKey: "race:draconian:dragonAncestry",
      description:
        "Passive (placeholder). Gain +2% effect from all essence abilities."
    },
    {
      key: "dragonScales",
      name: "Dragon Scales",
      grantKey: "race:draconian:dragonScales",
      description:
        "Passive (placeholder). Gain +2 Natural Armor."
    },
    {
      key: "dragonBreath",
      name: "Dragon Breath",
      grantKey: "race:draconian:dragonBreath",
      description:
        "Active (Special Attack). Breathe an element chosen at character creation. Costs 5 Mana and 5 Stamina."
    }
  ]
};
