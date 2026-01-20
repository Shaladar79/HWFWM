import {
  RANKS,
  RANK_ORDER,
  RANK_TIER_VALUE,
  RANK_RESOURCE_MULTIPLIER,
  RANK_PACE_MOD,
  RANK_TRAUMA
} from "./ranks.mjs";

// UPDATED: pull in role mechanics/lore catalogs
import {
  ROLES,
  ROLE_ORDER,
  ROLE_ADJUSTMENTS,
  ROLE_BY_RANK,
  ROLE_DESCRIPTIONS
} from "./roles.mjs";

// UPDATED: mechanics-ready race catalogs
import {
  RACES,
  RACE_ORDER,
  RACE_ADJUSTMENTS,
  RACE_DESCRIPTIONS
} from "./races.mjs";

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

// ✅ NEW: Rarity → coin + multiplier rules
import { HWFWM_RARITY_VALUE_RULES } from "./rarities.mjs";

export const HWFWM_CONFIG = {
  // -------------------------------------------------
  // Core Rank Progression
  // -------------------------------------------------
  ranks: RANKS,
  rankOrder: RANK_ORDER,
  rankDescriptions: RANK_DESCRIPTIONS,

  // Numeric rank mechanics (authoritative source)
  rankTierValues: RANK_TIER_VALUE,
  rankResourceMultiplier: RANK_RESOURCE_MULTIPLIER,
  rankPaceMod: RANK_PACE_MOD,
  rankTrauma: RANK_TRAUMA,

  // -------------------------------------------------
  // Roles (UI + mechanics hooks + lore)
  // -------------------------------------------------
  roles: ROLES,
  roleOrder: ROLE_ORDER,

  // Role mechanics/lore catalogs
  roleAdjustments: ROLE_ADJUSTMENTS,
  roleByRank: ROLE_BY_RANK,
  roleDescriptions: ROLE_DESCRIPTIONS,

  // -------------------------------------------------
  // Races (UI + mechanics + lore)
  // -------------------------------------------------
  races: RACES,
  raceOrder: RACE_ORDER,
  raceAdjustments: RACE_ADJUSTMENTS,
  raceDescriptions: RACE_DESCRIPTIONS,

  // -------------------------------------------------
  // Backgrounds
  // -------------------------------------------------
  backgrounds: BACKGROUNDS,
  backgroundOrder: BACKGROUND_ORDER,

  // -------------------------------------------------
  // Traits
  // -------------------------------------------------
  specialtyCatalog: HWFWM_SPECIALTIES,
  affinityCatalog: HWFWM_AFFINITIES,
  resistanceCatalog: HWFWM_RESISTANCES,
  aptitudeCatalog: HWFWM_APTITUDES,

  // -------------------------------------------------
  // Essences
  // -------------------------------------------------
  essenceCatalog: HWFWM_ESSENCES,
  confluenceEssenceCatalog: HWFWM_CONFLUENCE_ESSENCES,

  // -------------------------------------------------
  // Treasures
  // -------------------------------------------------
  miscItemCatalog: HWFWM_MISC_ITEMS,

  // ✅ NEW: Rarity → coin denomination + multiplier
  rarityValueRules: HWFWM_RARITY_VALUE_RULES
};
