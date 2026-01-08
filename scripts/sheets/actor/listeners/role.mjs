// scripts/sheets/actor/listeners/role.mjs

import { ROLE_GRANTED_SPECIALTIES } from "../../../../config/roles.mjs";

/* -------------------------------------------- */
/* Helpers                                      */
/* -------------------------------------------- */

const toKey = (v) => String(v ?? "").trim();

/**
 * Replace role-granted specialties on the Actor.
 *
 * Behavior:
 * - Adds missing specialties from ROLE_GRANTED_SPECIALTIES[roleKey]
 * - Does NOT overwrite any existing specialty
 * - If the role changes, it removes ONLY prior role-granted specialties
 *   that still have score === 0 (so you don’t lose progression)
 * - Uses a stamp to prevent render-cascade duplication loops
 */
export async function replaceRoleGrantedSpecialties(sheet, roleKey) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

    const rKey = toKey(roleKey);
    if (!rKey) return;

    // Prevent repeated sync loops for the same role
    const stamp = toKey(actor.system?._flags?.roleGrantStamp);
    if (stamp === rKey) return;

    const catalog = CONFIG["hwfwm-system"]?.specialtyCatalog ?? {};
    const desired = Array.isArray(ROLE_GRANTED_SPECIALTIES?.[rKey])
      ? ROLE_GRANTED_SPECIALTIES[rKey].map(toKey).filter(Boolean)
      : [];

    // --- Cleanup: remove old role grants (score 0 only) ---
    const current = actor.system?.specialties ?? {};
    const update = {};

    for (const [k, v] of Object.entries(current)) {
      const src = toKey(v?.source);
      const granted = v?.granted === true;
      const score = Number(v?.score ?? 0);

      // Remove only "role" granted entries with no progression
      if (src === "role" && granted && score === 0) {
        update[`system.specialties.-=${k}`] = null;
      }
    }

    // Apply cleanup first (if needed)
    if (Object.keys(update).length) {
      await actor.update(update);
    }

    // Refresh after cleanup
    const after = actor.system?.specialties ?? {};
    const addUpdate = {};

    for (const key of desired) {
      // Must exist in catalog to be selectable/displayable
      if (!catalog?.[key]) continue;

      // Never overwrite existing
      if (after?.[key]) continue;

      addUpdate[`system.specialties.${key}`] = {
        score: 0,
        source: "role",
        granted: true
      };
    }

    // Mark completion stamp + add entries
    addUpdate["system._flags.roleGrantStamp"] = rKey;

    await actor.update(addUpdate);
  } catch (err) {
    console.warn("HWFWM | replaceRoleGrantedSpecialties failed", err);
  }
}
