/**
 * Background configuration
 * Keys are stored on the actor as system.details.backgroundKey
 */
export const BACKGROUNDS = {
  commoner: "Commoner",
  criminal: "Criminal",
  artisan: "Artisan",
  noble: "Noble",
  scholar: "Scholar"
};

/**
 * Display order (optional but recommended)
 */
export const BACKGROUND_ORDER = [
  "commoner",
  "criminal",
  "artisan",
  "noble",
  "scholar"
];

/**
 * Baseline background adjustments (applied before rank multiplier)
 * Shape mirrors races/roles: { lifeForce, mana, stamina, pace? }
 */
export const BACKGROUND_ADJUSTMENTS = {
  commoner: { lifeForce: 4, mana: 2, stamina: 2 },
  criminal: { lifeForce: 3, mana: 2, stamina: 3 },
  artisan: { lifeForce: 2, mana: 3, stamina: 3 },
  noble: { lifeForce: 2, mana: 4, stamina: 2 },
  scholar: { lifeForce: 2, mana: 5, stamina: 1 }
};

/**
 * Optional UI descriptions (Overview/Traits hover text)
 */
export const BACKGROUND_DESCRIPTIONS = {
  commoner: "A practical upbringing grounded in everyday work and community.",
  criminal: "Raised on the wrong side of the law, with hard-earned street instincts.",
  artisan: "Trained in a trade, valuing craft, precision, and steady discipline.",
  noble: "Groomed for status and influence, accustomed to privilege and responsibility.",
  scholar: "Dedicated to learning and theory, with deep academic or institutional training."
};
