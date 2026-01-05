import { RANKS, RANK_ORDER } from "./ranks.mjs";
import { ROLES, ROLE_ORDER } from "./roles.mjs";

// UPDATED: also import the mechanics-ready race catalogs
import { RACES, RACE_ORDER, RACE_ADJUSTMENTS, RACE_DESCRIPTIONS } from "./races.mjs";

import { BACKGROUNDS, BACKGROUND_ORDER } from "./backgrounds.mjs";
import { HWFWM_SPECIALTIES } from "./specialties.mjs";
import { HWFWM_AFFINITIES } from "./affinities.mjs";
import { HWFWM_RESISTANCES } from "./resistances.mjs";
import { HWFWM_APTITUDES } from "./aptitudes.mjs";

// Rank descriptions (Overview tab)
import { RANK_DESCRIPTIONS } from "./rank-desc.mjs";

// Essence
import { HWFWM_ESSENCES } from "./essences.mjs";
import { HWFWM_CONFLUENCE_ESSENCES } from "./confluence-essences.mjs";

// Misc Inventory Items (actor-data, not Item documents)
import { HWFWM_MISC_ITEMS } from "./misc-items.mjs";

export const HWFWM_CONFIG = {
  // Core Progression
  ranks: RANKS,
  rankOrder: RANK_ORDER,
  rankDescriptions: RANK_DESCRIPTIONS,

  roles: ROLES,
  roleOrder: ROLE_ORDER,

  // UI (Dropdown)
  races: RACES,
  raceOrder: RACE_ORDER,

  // NEW: Race mechanics/lore catalogs (safe additive config)
  raceAdjustments: RACE_ADJUSTMENTS,
  raceDescriptions: RACE_DESCRIPTIONS,

  backgrounds: BACKGROUNDS,
  backgroundOrder: BACKGROUND_ORDER,

  // Traits
  specialtyCatalog: HWFWM_SPECIALTIES,
  affinityCatalog: HWFWM_AFFINITIES,
  resistanceCatalog: HWFWM_RESISTANCES,
  aptitudeCatalog: HWFWM_APTITUDES,

  // Essences
  essenceCatalog: HWFWM_ESSENCES,
  confluenceEssenceCatalog: HWFWM_CONFLUENCE_ESSENCES,

  // Treasures
  miscItemCatalog: HWFWM_MISC_ITEMS
};
