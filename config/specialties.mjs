/**
 * Specialties configuration
 *
 * This file defines the authoritative list of available specialties.
 * These are reference data only and should NOT be mutated at runtime.
 *
 * Actor data stores:
 * - system.specialties        (base / fixed specialties)
 * - system.specialtiesCustom  (player-added specialties)
 */

export const HWFWM_SPECIALTIES = {
  /* -------------------------------------------- */
  /* Power Specialties                            */
  /* -------------------------------------------- */

  athletics: {
    name: "Athletics",
    attribute: "Power",
    description: "Feats of physical strength such as lifting, climbing, jumping, swimming, and sustained exertion."
  },

  combatGrappling: {
    name: "Combat: Grappling",
    attribute: "Power",
    description: "Wrestling, holds, pins, and contests of raw physical strength against an opponent."
  },

  combatMedium: {
    name: "Combat: Medium Weapons",
    attribute: "Power",
    description: "Use of standard one-handed melee weapons relying on force and control rather than finesse."
  },

  combatHeavy: {
    name: "Combat: Heavy Weapons",
    attribute: "Power",
    description: "Use of large or two-handed weapons that depend on strength, momentum, and impact."
  },

  combatHurling: {
    name: "Combat: Hurling",
    attribute: "Power",
    description: "Throwing large or heavy objects as weapons, emphasizing mass and brute force."
  },

  endurance: {
    name: "Endurance",
    attribute: "Power",
    description: "Resistance to fatigue, exhaustion, and prolonged physical strain."
  },

  painTolerance: {
    name: "Pain Tolerance",
    attribute: "Power",
    description: "Ability to continue functioning despite injury, pain, or physical trauma."
  },

  intimidation: {
    name: "Intimidation",
    attribute: "Power",
    description: "Coercion and dominance through physical presence, size, and implied violence."
  },

  /* -------------------------------------------- */
  /* Speed Specialties                            */
  /* -------------------------------------------- */

  acrobatics: {
    name: "Acrobatics",
    attribute: "Speed",
    description: "Balance, tumbling, evasive movement, and controlled agile motion."
  },

  combatUnarmed: {
    name: "Combat: Unarmed",
    attribute: "Speed",
    description: "Fast, precise strikes and martial techniques relying on speed rather than brute force."
  },

  combatLight: {
    name: "Combat: Light Weapons",
    attribute: "Speed",
    description: "Use of finesse-focused melee weapons such as daggers and rapiers."
  },

  combatThrowing: {
    name: "Combat: Throwing",
    attribute: "Speed",
    description: "Thrown weapons and light objects where accuracy and timing are paramount."
  },

  combatRanged: {
    name: "Combat: Ranged Weapons",
    attribute: "Speed",
    description: "Use of bows, crossbows, firearms, and other ranged weapons requiring precision and timing."
  },

  sleightOfHand: {
    name: "Sleight of Hand",
    attribute: "Speed",
    description: "Fine motor control, quick manipulation, pickpocketing, and rapid hand movements."
  },

  stealth: {
    name: "Stealth",
    attribute: "Speed",
    description: "Moving unseen and unheard, hiding, and shadowing targets."
  },

  thievery: {
    name: "Thievery",
    attribute: "Speed",
    description: "Bypassing locks, traps, and security through dexterity and illicit skill."
  },

  /* -------------------------------------------- */
  /* Spirit Specialties                           */
  /* -------------------------------------------- */

  perception: {
    name: "Perception",
    attribute: "Spirit",
    description: "Awareness, alertness, and the ability to notice hidden, subtle, or supernatural details."
  },

  magicTheory: {
    name: "Magic Theory",
    attribute: "Spirit",
    description: "Academic understanding of magical systems, spell structure, and mana behavior."
  },

  ritualMagic: {
    name: "Ritual Magic",
    attribute: "Spirit",
    description: "Knowledge and execution of structured, long-form magical rites, circles, and ceremonies."
  },

  auraLore: {
    name: "Aura Lore",
    attribute: "Spirit",
    description: "Understanding aura types, signatures, intensity, and spiritual interactions."
  },

  essenceLore: {
    name: "Essence Lore",
    attribute: "Spirit",
    description: "Knowledge of essences, essence stones, and the rules governing essence abilities."
  },

  astralLore: {
    name: "Astral Lore",
    attribute: "Spirit",
    description: "Understanding astral spaces, planes, thresholds, and metaphysical geography."
  },

  monsterLore: {
    name: "Monster Lore",
    attribute: "Spirit",
    description: "Knowledge of magical creatures, aberrations, and non-humanoid threats."
  },

  auraControl: {
    name: "Aura Control",
    attribute: "Spirit",
    description: "Shaping, stabilizing, suppressing, or expanding one’s own aura."
  },

  auraProjection: {
    name: "Aura Projection",
    attribute: "Spirit",
    description: "Directing aura outward for pressure, signaling, intimidation, or influence."
  },

  suppressAura: {
    name: "Suppress Aura",
    attribute: "Spirit",
    description: "Overwhelming others through focused spiritual pressure and dominating presence."
  },

  /* -------------------------------------------- */
  /* Recovery Specialties                         */
  /* -------------------------------------------- */

  survival: {
    name: "Survival",
    attribute: "Recovery",
    description: "Enduring harsh environments, finding resources, and maintaining life in the wild."
  }
};
