// scripts/sheets/actor/listeners/role.mjs

import { ROLE_GRANTED_SPECIALTIES } from "../../../../config/roles.mjs";

/**
 * Per-actor single-flight lock to prevent overlapping calls from re-render cascades.
 * actorId -> Promise
 */
const _roleSyncLocks = new Map();

const toKey = (v) => String(v ?? "").trim();

export async function replaceRoleGrantedSpecialties(sheet, roleKey) {
  const actor = sheet?.document;
  if (!actor) return;

  const rKey = toKey(roleKey);
  if (!rKey) return;

  const actorId = actor.id;

  // Wait for any in-flight sync to complete.
  const inflight = _roleSyncLocks.get(actorId);
  if (inflight) await inflight.catch(() => {});

  const task = (async () => {
    // Skip stale calls if actor already changed role again.
    const liveRole = toKey(actor.system?.details?.roleKey);
    if (liveRole && liveRole !== rKey) return;

    // Skip if already completed for this role.
    const stamp = toKey(actor.system?._flags?.roleGrantStamp);
    if (stamp === rKey) return;

    const current = actor.system?.specialties ?? {};
    const update = {};

    // Track what we are removing so we can re-add in the same pass
    const willRemove = new Set();

    // Cleanup: remove ONLY role-granted specialties
    for (const [k, v] of Object.entries(current)) {
      if (v?.source === "role" && v?.granted === true) {
        willRemove.add(k);
        update[`system.specialties.-=${k}`] = null;
      }
    }

    // Apply: add role specialties (do not overwrite non-role sources)
    const grants = Array.isArray(ROLE_GRANTED_SPECIALTIES?.[rKey])
      ? ROLE_GRANTED_SPECIALTIES[rKey]
      : [];

    for (const raw of grants) {
      const key = toKey(raw);
      if (!key) continue;

      // If specialty exists and is NOT being removed this pass, leave it alone.
      const exists = Boolean(current?.[key]) && !willRemove.has(key);
      if (exists) continue;

      update[`system.specialties.${key}`] = {
        score: 0,
        source: "role",
        granted: true
      };
    }

    // Mark complete at end
    update["system._flags.roleGrantStamp"] = rKey;

    // Guard: do not call update with an empty object
    if (Object.keys(update).length) {
      await actor.update(update);
    }
  })();

  _roleSyncLocks.set(actorId, task);

  try {
    await task;
  } catch (err) {
    console.warn("HWFWM | replaceRoleGrantedSpecialties failed", err);
  } finally {
    if (_roleSyncLocks.get(actorId) === task) _roleSyncLocks.delete(actorId);
  }
}
