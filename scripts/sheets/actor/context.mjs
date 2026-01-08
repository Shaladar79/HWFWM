// scripts/sheets/actor/context.mjs

import { computeEssenceUI } from "./essence.mjs";
import { getFlatMiscCatalog } from "./treasures-misc.mjs";
import {
  BACKGROUND_DESCRIPTIONS,
  BACKGROUND_GRANTED_SPECIALTIES
} from "../../../config/backgrounds.mjs"; // ✅ FIXED PATH

// ✅ NEW: race grants (derived-only visibility; no persistence)
import { RACE_GRANTED_AFFINITIES, RACE_GRANTED_APTITUDES } from "../../../config/races.mjs";

/**
 * Build the actor sheet context.
 * @param {HwfwmActorSheet} sheet
 * @param {object} baseContext - result of super._prepareContext(options)
 * @param {object} options
 */
export async function buildActorSheetContext(sheet, baseContext, options) {
  const context = baseContext ?? {};
  const cfg = CONFIG["hwfwm-system"] ?? {};

  context.system = sheet.document?.system ?? context.system ?? {};

  // options
  const roles = cfg.roles ?? {};
  const roleOrder = cfg.roleOrder ?? Object.keys(roles);
  const ranks = cfg.ranks ?? {};
  const rankOrder = cfg.rankOrder ?? Object.keys(ranks);
  const races = cfg.races ?? {};
  const raceOrder = cfg.raceOrder ?? Object.keys(races);
  const backgrounds = cfg.backgrounds ?? {};
  const backgroundOrder = cfg.backgroundOrder ?? Object.keys(backgrounds);

  context.roleOptions = roleOrder.map((k) => ({ value: k, label: roles[k] ?? k }));
  context.rankOptions = rankOrder.map((k) => ({ value: k, label: ranks[k] ?? k }));
  context.raceOptions = raceOrder.map((k) => ({ value: k, label: races[k] ?? k }));
  context.backgroundOptions = backgroundOrder.map((k) => ({ value: k, label: backgrounds[k] ?? k }));

  const details = sheet.document?.system?.details ?? {};
  context.details = {
    roleKey: details.roleKey ?? "",
    rankKey: details.rankKey ?? "",
    raceKey: details.raceKey ?? "",
    backgroundKey: details.backgroundKey ?? ""
  };

  // ---------------------------------------------------------------------------
  // Ensure required nested paths exist for templates (prevents silent undefined)
  // ---------------------------------------------------------------------------
  const sys = context.system ?? {};
  sys.resources = sys.resources ?? {};
  sys.resources.mana = sys.resources.mana ?? { value: 0, max: 0 };
  sys.resources.stamina = sys.resources.stamina ?? { value: 0, max: 0 };
  sys.resources.lifeForce = sys.resources.lifeForce ?? { value: 0, max: 0 };

  // NEW: read-only derived display fields (may be set by actor.mjs; default to 0)
  sys.resources.mana.recovery = Number.isFinite(Number(sys.resources.mana.recovery))
    ? Number(sys.resources.mana.recovery)
    : 0;
  sys.resources.stamina.recovery = Number.isFinite(Number(sys.resources.stamina.recovery))
    ? Number(sys.resources.stamina.recovery)
    : 0;
  sys.resources.lifeForce.recovery = Number.isFinite(Number(sys.resources.lifeForce.recovery))
    ? Number(sys.resources.lifeForce.recovery)
    : 0;
  sys.resources.naturalArmor = Number.isFinite(Number(sys.resources.naturalArmor))
    ? Number(sys.resources.naturalArmor)
    : 0;

  context.system = sys;

  // ---------------------------------------------------------------------------
  // DERIVED RANK (Header)
  // ---------------------------------------------------------------------------
  // Prefer authoritative derived rank from actor.prepareDerivedData().
  // Fallback to local computation if not available.
  const d
