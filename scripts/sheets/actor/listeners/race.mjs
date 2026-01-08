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
    if (v?.source === "race" && v?.granted === true) {
      update[`system.affinities.-=${k}`] = null;
    }
  }

  const apt = actor.system?.aptitudes ?? {};
  for (const [k, v] of Object.entries(apt)) {
    if (v?.source === "race" && v?.granted === true) {
      update[`system.aptitudes.-=${k}`] = null;
    }
  }

  const res = actor.system?.resistances ?? {};
  for (const [k, v] of Object.entries(res)) {
    if (v?.source === "race" && v?.granted === true) {
      update[`system.resistances.-=${k}`] = null;
    }
  }

  if (Object.keys(update).length) await actor.update(update);
}

async function applyRaceGrantedEnhancements(actor, raceKey) {
  const rKey = toKey(raceKey);
  if (!rKey) return;

  const affinityCatalog = CONFIG["hwfwm-system"]?.affinityCatalog ?? {};
  const aptitudeCatalog = CONFIG["hwfwm-system"]?.aptitudeCatalog ?? {};
  const resistanceCatalog = CONFIG["hwfwm-system"]?.resistanceCatalog ?? {};

  const grantedAff = Array.isArray(RACE_GRANTED_AFFINITIES?.[rKey])
    ? RACE_GRANTED_AFFINITIES[rKey]
    : [];
  const grantedApt = Array.isArray(RACE_GRANTED_APTITUDES?.[rKey])
    ? RACE_GRANTED_APTITUDES[rKey]
    : [];
  const grantedRes = Array.isArray(RACE_GRANTED_RESISTANCES?.[rKey])
    ? RACE_GRANTED_RESISTANCES[rKey]
    : [];

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
/* Feature Items                                 */
/* -------------------------------------------- */

async function cleanupRaceGrantedFeatureItems(actor) {
  const items = Array.from(actor.items ?? []).filter((it) => it?.type === "feature");

  if (HARD_REPLACE_RACE_FEATURES) {
    // Delete anything explicitly tagged race OR in our "race:" namespace (legacy-safe).
    const toDelete = items
      .filter((it) => {
        const src = toKey(it?.system?.source);
        const gk = toKey(it?.system?.grantKey);
        return src === "race" || gk.startsWith("race:");
      })
      .map((it) => it.id);

    if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
    return;
  }

  // Conservative mode: only delete items we can prove we own.
  const toDelete = items
    .filter((it) => toKey(it?.system?.source) === "race")
    .filter((it) => toKey(it?.system?.grantKey).startsWith("race:"))
    .map((it) => it.id);

  if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
}

async function applyRaceGrantedFeatureItems(actor, raceKey) {
  const rKey = toKey(raceKey);
  if (!rKey) return;

  const defs = Array.isArray(RACE_GRANTED_FEATURES?.[rKey]) ? RACE_GRANTED_FEATURES[rKey] : [];
  if (!defs.length) return;

  // In hard-replace mode, create deterministically; no de-dupe needed.
  if (HARD_REPLACE_RACE_FEATURES) {
    const toCreate = defs
      .map((f) => {
        const name = toKey(f?.name);
        if (!name) return null;

        return {
          name,
          type: "feature",
          system: {
            source: "race",
            grantKey: buildRaceFeatureGrantKey(rKey, f),
            notes: toKey(f?.description) || ""
          }
        };
      })
      .filter(Boolean);

    if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);
    return;
  }

  // (Conservative mode logic could go here if you ever turn hard replace off.)
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

    // Skip if already completed for this race.
    const stamp = toKey(actor.system?._flags?.raceGrantStamp);
    if (stamp === rKey) return;

    await cleanupRaceGrantedEnhancements(actor);
    await cleanupRaceGrantedFeatureItems(actor);

    await applyRaceGrantedEnhancements(actor, rKey);
    await applyRaceGrantedFeatureItems(actor, rKey);

    // Mark complete at the end (critical).
    await actor.update({ "system._flags.raceGrantStamp": rKey });
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

