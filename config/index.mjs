import { RANKS, RANK_ORDER } from "./ranks.mjs";
import { ROLES, ROLE_ORDER } from "./roles.mjs";
import { RACES, RACE_ORDER } from "./races.mjs";
import { BACKGROUNDS, BACKGROUND_ORDER } from "./backgrounds.mjs";
import { HWFWM_SPECIALTIES } from "./specialties.mjs";
import { HWFWM_AFFINITIES } from "./affinities.mjs";

export const HWFWM_CONFIG = {
  ranks: RANKS,
  rankOrder: RANK_ORDER,

  roles: ROLES,
  roleOrder: ROLE_ORDER,

  races: RACES,
  raceOrder: RACE_ORDER,

  backgrounds: BACKGROUNDS,
  backgroundOrder: BACKGROUND_ORDER,

  specialtyCatalog: HWFWM_SPECIALTIES
};
