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
 * Keep values at 0 until you decide balance per background.
 */
export const BACKGROUND_ADJUSTMENTS = {
  commoner: { lifeForce: 0, mana: 0, stamina: 0 },
  criminal: { lifeForce: 0, mana: 0, stamina: 0 },
  artisan: { lifeForce: 0, mana: 0, stamina: 0 },
  noble: { lifeForce: 0, mana: 0, stamina: 0 },
  scholar: { lifeForce: 0, mana: 0, stamina: 0 }
};

/**
 * Optional per-rank upgrades (placeholder for later systems)
 * Example shape:
 *  {
 *    scholar: {
 *      iron:   { status: { pace: 1 } },
 *      silver: { status: { pace: 1 } }
 *    }
 *  }
 */
export const BACKGROUND_BY_RANK = {};

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
