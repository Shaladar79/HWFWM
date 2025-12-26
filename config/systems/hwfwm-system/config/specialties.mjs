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
  athletics: {
    name: "Athletics",
    attribute: "Power"
  },

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
