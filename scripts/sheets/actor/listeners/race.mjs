// scripts/sheets/actor/listeners/race.mjs

import {
  RACE_GRANTED_AFFINITIES,
  RACE_GRANTED_APTITUDES,
  RACE_GRANTED_FEATURES,
  RACE_GRANTED_RESISTANCES
} from "../../../../config/races.mjs";

/* -------------------------------------------- */
/* Toggle: recommended cleanup behavior          */
/* -------------------------------------------- */

// If true: deletes ALL feature Items where system.source === "race" before applying new race.
// Most reliable fix for duplicate/stale race features from older formats.
const HARD_REPLACE_RACE_FEATURES = true;

/* -------------------------------------------- */
/* Helpers                                      */
/* -------------------------------------------- */

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
/* Race: affinities + aptitudes + resistances   */
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

  const cfg = CONFIG["hwfwm-system"] ?? {};

  const affinityCatalog = cfg.affinityCatalog ?? {};
  const aptitudeCatalog = cfg.aptitudeCatalog ?? {};
  const resistanceCatalog = cfg.resistanceCatalog ?? {};

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
    if (currentAff?.[key]) continue;
    if (!affinityCatalog?.[key]) continue;

    const name = safeCatalogName(affinityCatalog, key, "Affinity: ");
    update[`system.affinities.${key}`] = { key, name, source: "race", granted: true };
  }

  for (const raw of grantedApt) {
    const key = toKey(raw);
    if (!key) continue;
    if (currentApt?.[key]) continue;
    if (!aptitudeCatalog?.[key]) continue;

    const name = safeCatalogName(aptitudeCatalog, key, "Aptitude: ");
    update[`system.aptitudes.${key}`] = { key, name, source: "race", granted: true };
  }

  for (const raw of grantedRes) {
    const key = toKey(raw);
    if (!key) continue;
    if (currentRes?.[key]) continue;
    if (!resistanceCatalog?.[key]) continue;

    const name = safeCatalogName(resistanceCatalog, key, "Resistance: ");
    update[`system.resistances.${key}`] = { key, name, source: "race", granted: true };
  }

  if (Object.keys(update).length) await actor.update(update);
}

/* -------------------------------------------- */
/* Race: feature Items                           */
/* -------------------------------------------- */

async function cleanupRaceGrantedFeatureItems(actor) {
  const items = Array.from(actor.items ?? []).filter((it) => it?.type === "feature");

  if (HARD_REPLACE_RACE_FEATURES) {
    // Delete everything tagged as race.
    const toDelete = items.filter((it) => it?.system?.source === "race").map((it) => it.id);
    if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
    return;
  }

  // Legacy-safe mode: only delete items we can prove are ours ("race:" namespace)
  const toDelete = items
    .filter((it) => it?.system?.source === "race")
    .filter((it) => toKey(it?.system?.grantKey).startsWith("race:"))
    .map((it) => it.id);

  if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
}

async function applyRaceGrantedFeatureItems(actor, raceKey) {
  const rKey = toKey(raceKey);
  if (!rKey) return;

  const defs = Array.isArray(RACE_GRANTED_FEATURES?.[rKey]) ? RACE_GRANTED_FEATURES[rKey] : [];
  if (!defs.length) return;

  // Existing race feature items
  const existing = Array.from(actor.items ?? [])
    .filter((it) => it?.type === "feature")
    .filter((it) => it?.system?.source === "race");

  // De-dupe existing by grantKey (keep first, delete extras)
  const seen = new Set();
  const dupIds = [];
  for (const it of existing) {
    const gk = toKey(it?.system?.grantKey);
    if (!gk) continue;
    if (seen.has(gk)) dupIds.push(it.id);
    else seen.add(gk);
  }
  if (dupIds.length) await actor.deleteEmbeddedDocuments("Item", dupIds);

  const existing2 = Array.from(actor.items ?? [])
    .filter((it) => it?.type === "feature")
    .filter((it) => it?.system?.source === "race");

  const existingGrantKeys = new Set(existing2.map((it) => toKey(it?.system?.grantKey)).filter(Boolean));

  const toCreate = [];
  for (const f of defs) {
    const name = toKey(f?.name);
    if (!name) continue;

    const grantKey = buildRaceFeatureGrantKey(rKey, f);
    if (existingGrantKeys.has(grantKey)) continue;

    toCreate.push({
      name,
      type: "feature",
      system: {
        source: "race",
        grantKey,
        notes: toKey(f?.description) || ""
      }
    });
  }

  if (toCreate.length) await actor.createEmbeddedDocuments("Item", toCreate);
}

/* -------------------------------------------- */
/* Public: replace race grants                   */
/* -------------------------------------------- */

export async function replaceRaceGrants(sheet, raceKey) {
  const actor = sheet?.document;
  if (!actor) return;

  const rKey = toKey(raceKey);
  if (!rKey) return;

  // Reliable guard against duplicate cascades.
  // This is better than a stored flag because it blocks re-entrant calls immediately.
  if (sheet._raceGrantSyncing) return;
  sheet._raceGrantSyncing = true;

  try {
    await cleanupRaceGrantedEnhancements(actor);
    await cleanupRaceGrantedFeatureItems(actor);

    await applyRaceGrantedEnhancements(actor, rKey);
    await applyRaceGrantedFeatureItems(actor, rKey);

    // Optional: remember last applied race for debugging/UI (not used as a guard)
    await actor.update({ "system._flags.lastRaceGrantSync": rKey });
  } catch (err) {
    console.warn("HWFWM | replaceRaceGrants failed", err);
  } finally {
    sheet._raceGrantSyncing = false;
  }
}
