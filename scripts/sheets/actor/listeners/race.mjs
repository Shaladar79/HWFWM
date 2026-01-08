// scripts/sheets/actor/listeners/race.mjs

import {
  RACE_GRANTED_AFFINITIES,
  RACE_GRANTED_APTITUDES,
  RACE_GRANTED_FEATURES,
  RACE_GRANTED_RESISTANCES
} from "../../../../config/races.mjs";

/**
 * If true: delete ALL race-granted feature items before applying the new race.
 * This is the most reliable fix while your schema is evolving.
 */
const HARD_REPLACE_RACE_FEATURES = true;

/**
 * Namespace used for Foundry flags.
 * (Must be stable and match your system id conventions.)
 */
const FLAG_NS = "hwfwm-system";
const ACTOR_FLAG_RACE_STAMP = "raceGrantStamp";
const ITEM_FLAG_GRANT_SOURCE = "grantSource";
const ITEM_FLAG_GRANT_KEY = "grantKey";

/**
 * Per-actor single-flight lock to prevent overlapping calls from re-render cascades.
 * actorId -> Promise
 */
const _raceSyncLocks = new Map();

const toKey = (v) => String(v ?? "").trim();

function safeCatalogName(catalog, key, fallbackPrefix = "") {
  const meta = catalog?.[key];
  if (meta?.name) return String(meta.name);
  return fallbackPrefix ? `${fallbackPrefix}${key}` : String(key);
}

function buildRaceFeatureGrantKey(raceKey, featureDef) {
  const r = toKey(raceKey);
  const gk = toKey(featureDef?.grantKey);
  if (gk) return gk;

  const local =
    toKey(featureDef?.key) ||
    toKey(featureDef?.name).toLowerCase().replace(/\s+/g, "");
  return `race:${r}:${local}`;
}

/* -------------------------------------------- */
/* Enhancements: affinities/aptitudes/resistances */
/* -------------------------------------------- */

async function cleanupRaceGrantedEnhancements(actor) {
  const update = {};

  const aff = actor.system?.affinities ?? {};
  for (const [k, v] of Object.entries(aff)) {
    if (v?.source === "race" && v?.granted === true) update[`system.affinities.-=${k}`] = null;
  }

  const apt = actor.system?.aptitudes ?? {};
  for (const [k, v] of Object.entries(apt)) {
    if (v?.source === "race" && v?.granted === true) update[`system.aptitudes.-=${k}`] = null;
  }

  const res = actor.system?.resistances ?? {};
  for (const [k, v] of Object.entries(res)) {
    if (v?.source === "race" && v?.granted === true) update[`system.resistances.-=${k}`] = null;
  }

  if (Object.keys(update).length) await actor.update(update);
}

async function applyRaceGrantedEnhancements(actor, raceKey) {
  const rKey = toKey(raceKey);
  if (!rKey) return;

  const affinityCatalog = CONFIG["hwfwm-system"]?.affinityCatalog ?? {};
  const aptitudeCatalog = CONFIG["hwfwm-system"]?.aptitudeCatalog ?? {};
  const resistanceCatalog = CONFIG["hwfwm-system"]?.resistanceCatalog ?? {};

  const grantedAff = Array.isArray(RACE_GRANTED_AFFINITIES?.[rKey]) ? RACE_GRANTED_AFFINITIES[rKey] : [];
  const grantedApt = Array.isArray(RACE_GRANTED_APTITUDES?.[rKey]) ? RACE_GRANTED_APTITUDES[rKey] : [];
  const grantedRes = Array.isArray(RACE_GRANTED_RESISTANCES?.[rKey]) ? RACE_GRANTED_RESISTANCES[rKey] : [];

  const currentAff = actor.system?.affinities ?? {};
  const currentApt = actor.system?.aptitudes ?? {};
  const currentRes = actor.system?.resistances ?? {};

  const update = {};

  for (const raw of grantedAff) {
    const key = toKey(raw);
    if (!key) continue;
    if (!affinityCatalog?.[key]) continue;
    if (currentAff?.[key]) continue;

    const name = safeCatalogName(affinityCatalog, key, "Affinity: ");
    update[`system.affinities.${key}`] = { key, name, source: "race", granted: true };
  }

  for (const raw of grantedApt) {
    const key = toKey(raw);
    if (!key) continue;
    if (!aptitudeCatalog?.[key]) continue;
    if (currentApt?.[key]) continue;

    const name = safeCatalogName(aptitudeCatalog, key, "Aptitude: ");
    update[`system.aptitudes.${key}`] = { key, name, source: "race", granted: true };
  }

  for (const raw of grantedRes) {
    const key = toKey(raw);
    if (!key) continue;
    if (!resistanceCatalog?.[key]) continue;
    if (currentRes?.[key]) continue;

    const name = safeCatalogName(resistanceCatalog, key, "Resistance: ");
    update[`system.resistances.${key}`] = { key, name, source: "race", granted: true };
  }

  if (Object.keys(update).length) await actor.update(update);
}

/* -------------------------------------------- */
/* Feature Items (race-granted)                  */
/* -------------------------------------------- */

function isRaceGrantedFeatureItem(item) {
  if (item?.type !== "feature") return false;

  // New reliable marker
  const flagSource = item.getFlag?.(FLAG_NS, ITEM_FLAG_GRANT_SOURCE);
  if (flagSource === "race") return true;

  // Backward compatible markers
  const src = toKey(item?.system?.source);
  if (src === "race") return true;

  const gk = toKey(item?.system?.grantKey);
  if (gk.startsWith("race:")) return true;

  return false;
}

async function cleanupRaceGrantedFeatureItems(actor) {
  const featureItems = Array.from(actor.items ?? []).filter((it) => it?.type === "feature");

  if (HARD_REPLACE_RACE_FEATURES) {
    // Delete anything race-tagged by ANY of our markers.
    const toDelete = featureItems.filter(isRaceGrantedFeatureItem).map((it) => it.id);
    if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
    return;
  }

  // Conservative mode: only delete items we can prove we created via flags.
  const toDelete = featureItems
    .filter((it) => it.getFlag?.(FLAG_NS, ITEM_FLAG_GRANT_SOURCE) === "race")
    .map((it) => it.id);

  if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
}

async function applyRaceGrantedFeatureItems(actor, raceKey) {
  const rKey = toKey(raceKey);
  if (!rKey) return;

  const defs = Array.isArray(RACE_GRANTED_FEATURES?.[rKey]) ? RACE_GRANTED_FEATURES[rKey] : [];
  if (!defs.length) return;

  // In hard-replace mode, we recreate the set deterministically each time.
  const toCreate = defs
    .map((f) => {
      const name = toKey(f?.name);
      if (!name) return null;

      const grantKey = buildRaceFeatureGrantKey(rKey, f);

      return {
        name,
        type: "feature",
        system: {
          // Keep these for UI/debug, but do not rely on them for cleanup.
          source: "race",
          grantKey,
          notes: toKey(f?.description) || ""
        },
        flags: {
          [FLAG_NS]: {
            [ITEM_FLAG_GRANT_SOURCE]: "race",
            [ITEM_FLAG_GRANT_KEY]: grantKey
          }
        }
      };
    })
    .filter(Boolean);

  if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);
}

/* -------------------------------------------- */
/* Public API: replace race grants (single-flight) */
/* -------------------------------------------- */

export async function replaceRaceGrants(sheet, raceKey) {
  const actor = sheet?.document;
  if (!actor) return;

  const rKey = toKey(raceKey);
  if (!rKey) return;

  const actorId = actor.id;

  // Wait for any in-flight sync to complete.
  const inflight = _raceSyncLocks.get(actorId);
  if (inflight) await inflight.catch(() => {});

  const task = (async () => {
    // Skip stale calls if actor already changed race again.
    const liveRace = toKey(actor.system?.details?.raceKey);
    if (liveRace && liveRace !== rKey) return;

    // Skip if already completed for this race (stored in Foundry flags, not system data).
    const stamp = toKey(actor.getFlag?.(FLAG_NS, ACTOR_FLAG_RACE_STAMP));
    if (stamp === rKey) return;

    await cleanupRaceGrantedEnhancements(actor);
    await cleanupRaceGrantedFeatureItems(actor);

    await applyRaceGrantedEnhancements(actor, rKey);
    await applyRaceGrantedFeatureItems(actor, rKey);

    // Mark complete (critical): use flags so it persists regardless of template schema.
    await actor.setFlag?.(FLAG_NS, ACTOR_FLAG_RACE_STAMP, rKey);
  })();

  _raceSyncLocks.set(actorId, task);

  try {
    await task;
  } catch (err) {
    console.warn("HWFWM | replaceRaceGrants failed", err);
  } finally {
    if (_raceSyncLocks.get(actorId) === task) _raceSyncLocks.delete(actorId);
  }
}
