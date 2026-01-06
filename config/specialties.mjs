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
    attribute: "Power"
  },

  combatGrappling: {
    name: "Combat: Grappling",
    attribute: "Power"
  },

  combatMedium: {
    name: "Combat: Medium Weapons",
    attribute: "Power"
  },

  combatHeavy: {
    name: "Combat: Heavy Weapons",
    attribute: "Power"
  },

  combatHurling: {
    name: "Combat: Hurling",
    attribute: "Power"
  },

  endurance: {
    name: "Endurance",
    attribute: "Power"
  },

  painTolerance: {
    name: "Pain Tolerance",
    attribute: "Power"
  },

  intimidation: {
    name: "Intimidation",
    attribute: "Power"
  },

  /* -------------------------------------------- */
  /* Existing / Other Attribute Specialties       */
  /* -------------------------------------------- */

  acrobatics: {
    name: "Acrobatics",
    attribute: "Speed"
  },

  perception: {
    name: "Perception",
    attribute: "Spirit"
  },

  survival: {
    name: "Survival",
    attribute: "Recovery"
  }
};
