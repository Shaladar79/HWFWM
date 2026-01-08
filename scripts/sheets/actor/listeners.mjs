// scripts/sheets/actor/listeners.mjs

import { activateTabGroup } from "./tabs.mjs";
import { handleEssenceSelectChange } from "./essence.mjs";
import { openAddMiscDialog, removeMiscByKey, updateMiscField } from "./treasures-misc.mjs";
import {
  BACKGROUND_GRANTED_SPECIALTIES,
  BACKGROUND_SPECIALTY_CHOICE,
  BACKGROUND_CHOICE_OPTIONS
} from "../../../config/backgrounds.mjs";

import {
  RACE_GRANTED_AFFINITIES,
  RACE_GRANTED_APTITUDES,
  RACE_GRANTED_FEATURES
} from "../../../config/races.mjs";

/* -------------------------------------------- */
/* Helpers                                      */
/* -------------------------------------------- */

const toKey = (v) => String(v ?? "").trim();

function safeCatalogName(catalog, key, fallbackPrefix = "") {
  const meta = catalog?.[key];
  if (meta?.name) return String(meta.name);
  return fallbackPrefix ? `${fallbackPrefix}${key}` : String(key);
}

/* -------------------------------------------- */
/* Background: specialties                       */
/* -------------------------------------------- */

async function persistBackgroundGrantedSpecialties(sheet, backgroundKey) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

    const bgKey = toKey(backgroundKey);
    if (!bgKey) return;

    const granted = Array.isArray(BACKGROUND_GRANTED_SPECIALTIES?.[bgKey])
      ? BACKGROUND_GRANTED_SPECIALTIES[bgKey]
      : [];

    if (!granted.length) return;

    const current = actor.system?.specialties ?? {};
    const update = {};

    for (const key of granted) {
      const k = toKey(key);
      if (!k) continue;
      if (current?.[k]) continue;

      update[`system.specialties.${k}`] = {
        score: 0,
        source: "background",
        granted: true
      };
    }

    if (Object.keys(update).length) await actor.update(update);
  } catch (err) {
    console.warn("HWFWM | persistBackgroundGrantedSpecialties failed", err);
  }
}

async function promptForSpecialtyChoice({ title, label, options }) {
  const opts = Array.isArray(options) ? options.map(toKey).filter(Boolean) : [];
  if (!opts.length) return "";

  const catalog = CONFIG["hwfwm-system"]?.specialtyCatalog ?? {};
  const rows = opts
    .map((key) => {
      const name = safeCatalogName(catalog, key);
      return `<option value="${key}">${Handlebars.escapeExpression(name)}</option>`;
    })
    .join("");

  const content = `
    <form class="hwfwm-choice">
      <div class="form-group">
        <label>${Handlebars.escapeExpression(label ?? "Choose one")}</label>
        <select name="choice" style="width: 100%;">
          ${rows}
        </select>
      </div>
    </form>
  `;

  return await new Promise((resolve) => {
    new Dialog({
      title: title ?? "Choose",
      content,
      buttons: {
        ok: {
          label: "OK",
          callback: (html) => {
            const sel = html?.find?.('select[name="choice"]')?.val?.();
            resolve(String(sel ?? ""));
          }
        },
        cancel: { label: "Cancel", callback: () => resolve("") }
      },
      default: "ok",
      close: () => resolve("")
    }).render(true);
  });
}

async function handleBackgroundChoiceGrant(sheet, backgroundKey) {
  const actor = sheet?.document;
  if (!actor) return;

  const bgKey = toKey(backgroundKey);
  if (!bgKey) return;

  const rule = BACKGROUND_SPECIALTY_CHOICE?.[bgKey] ?? null;
  if (!rule) return;

  const choiceId = toKey(rule.id);
  if (!choiceId) return;

  const existingChoice =
    actor.system?._flags?.backgroundChoices?.[bgKey] ??
    actor.system?._flags?.backgroundChoice?.[bgKey];

  if (existingChoice) return;

  const options = BACKGROUND_CHOICE_OPTIONS?.[choiceId] ?? [];
  const label = rule.label ?? "Choose a Specialty";

  const picked = await promptForSpecialtyChoice({
    title: "Background Specialty",
    label,
    options
  });

  if (!picked) return;

  const catalog = CONFIG["hwfwm-system"]?.specialtyCatalog ?? {};
  if (!catalog?.[picked]) {
    ui?.notifications?.warn?.(`Unknown specialty key: ${picked}`);
    return;
  }

  const current = actor.system?.specialties ?? {};
  const update = {};

  if (!current?.[picked]) {
    update[`system.specialties.${picked}`] = {
      score: 0,
      source: "background",
      granted: true,
      choiceId
    };
  }

  update[`system._flags.backgroundChoices.${bgKey}`] = picked;

  if (Object.keys(update).length) await actor.update(update);
}

async function addSelectedSpecialty(sheet) {
  const actor = sheet?.document;
  if (!actor) return;

  const selectedKey = toKey(actor.system?._ui?.addSpecialtyKey);
  if (!selectedKey) return;

  const catalog = CONFIG["hwfwm-system"]?.specialtyCatalog ?? {};
  if (!catalog?.[selectedKey]) {
    ui?.notifications?.warn?.(`Unknown specialty key: ${selectedKey}`);
    return;
  }

  const current = actor.system?.specialties ?? {};
  if (current?.[selectedKey]) {
    await actor.update({ "system._ui.addSpecialtyKey": "" });
    return;
  }

  await actor.update({
    [`system.specialties.${selectedKey}`]: { score: 0, source: "manual", granted: false },
    "system._ui.addSpecialtyKey": ""
  });
}

/* -------------------------------------------- */
/* Manual: affinities / aptitudes / resistances  */
/* -------------------------------------------- */

async function addSelectedAffinity(sheet) {
  const actor = sheet?.document;
  if (!actor) return;

  const selectedKey = toKey(actor.system?._ui?.addAffinityKey);
  if (!selectedKey) return;

  const catalog = CONFIG["hwfwm-system"]?.affinityCatalog ?? {};
  if (!catalog?.[selectedKey]) {
    ui?.notifications?.warn?.(`Unknown affinity key: ${selectedKey}`);
    return;
  }

  const current = actor.system?.affinities ?? {};
  if (current?.[selectedKey]) {
    await actor.update({ "system._ui.addAffinityKey": "" });
    return;
  }

  const name = safeCatalogName(catalog, selectedKey, "Affinity: ");
  await actor.update({
    [`system.affinities.${selectedKey}`]: { key: selectedKey, name, source: "manual", granted: false },
    "system._ui.addAffinityKey": ""
  });
}

async function removeAffinity(sheet, key) {
  const actor = sheet?.document;
  if (!actor) return;

  const k = toKey(key);
  if (!k) return;

  const current = actor.system?.affinities ?? {};
  if (!current?.[k]) return;

  await actor.update({ [`system.affinities.-=${k}`]: null });
}

async function addSelectedAptitude(sheet) {
  const actor = sheet?.document;
  if (!actor) return;

  const selectedKey = toKey(actor.system?._ui?.addAptitudeKey);
  if (!selectedKey) return;

  const catalog = CONFIG["hwfwm-system"]?.aptitudeCatalog ?? {};
  if (!catalog?.[selectedKey]) {
    ui?.notifications?.warn?.(`Unknown aptitude key: ${selectedKey}`);
    return;
  }

  const current = actor.system?.aptitudes ?? {};
  if (current?.[selectedKey]) {
    await actor.update({ "system._ui.addAptitudeKey": "" });
    return;
  }

  const name = safeCatalogName(catalog, selectedKey, "Aptitude: ");
  await actor.update({
    [`system.aptitudes.${selectedKey}`]: { key: selectedKey, name, source: "manual", granted: false },
    "system._ui.addAptitudeKey": ""
  });
}

async function removeAptitude(sheet, key) {
  const actor = sheet?.document;
  if (!actor) return;

  const k = toKey(key);
  if (!k) return;

  const current = actor.system?.aptitudes ?? {};
  if (!current?.[k]) return;

  await actor.update({ [`system.aptitudes.-=${k}`]: null });
}

async function addSelectedResistance(sheet) {
  const actor = sheet?.document;
  if (!actor) return;

  const selectedKey = toKey(actor.system?._ui?.addResistanceKey);
  if (!selectedKey) return;

  const catalog = CONFIG["hwfwm-system"]?.resistanceCatalog ?? {};
  if (!catalog?.[selectedKey]) {
    ui?.notifications?.warn?.(`Unknown resistance key: ${selectedKey}`);
    return;
  }

  const current = actor.system?.resistances ?? {};
  if (current?.[selectedKey]) {
    await actor.update({ "system._ui.addResistanceKey": "" });
    return;
  }

  const name = safeCatalogName(catalog, selectedKey, "Resistance: ");
  await actor.update({
    [`system.resistances.${selectedKey}`]: { key: selectedKey, name, source: "manual", granted: false },
    "system._ui.addResistanceKey": ""
  });
}

async function removeResistance(sheet, key) {
  const actor = sheet?.document;
  if (!actor) return;

  const k = toKey(key);
  if (!k) return;

  const current = actor.system?.resistances ?? {};
  if (!current?.[k]) return;

  await actor.update({ [`system.resistances.-=${k}`]: null });
}

/* -------------------------------------------- */
/* Race: REPLACE grants (cleanup + reapply)      */
/* -------------------------------------------- */

function buildRaceFeatureGrantKey(raceKey, featureDef) {
  const r = toKey(raceKey);
  const gk = toKey(featureDef?.grantKey);
  if (gk) return gk;

  // deterministic fallback: stable across renders
  const local = toKey(featureDef?.key) || toKey(featureDef?.name).toLowerCase().replace(/\s+/g, "");
  return `race:${r}:${local}`;
}

async function cleanupRaceGrantedEnhancements(actor) {
  // Remove only entries that are marked as race-granted
  const update = {};

  const aff = actor.system?.affinities ?? {};
  for (const [k, v] of Object.entries(aff)) {
    if (v?.source === "race" || v?.granted === true) {
      // be conservative: only remove if it looks like our race grant record
      if ((v?.source === "race") && (v?.granted === true)) {
        update[`system.affinities.-=${k}`] = null;
      }
    }
  }

  const apt = actor.system?.aptitudes ?? {};
  for (const [k, v] of Object.entries(apt)) {
    if ((v?.source === "race") && (v?.granted === true)) {
      update[`system.aptitudes.-=${k}`] = null;
    }
  }

  if (Object.keys(update).length) await actor.update(update);
}

async function applyRaceGrantedEnhancements(actor, raceKey) {
  const rKey = toKey(raceKey);
  if (!rKey) return;

  const affinityCatalog = CONFIG["hwfwm-system"]?.affinityCatalog ?? {};
  const aptitudeCatalog = CONFIG["hwfwm-system"]?.aptitudeCatalog ?? {};

  const grantedAff = Array.isArray(RACE_GRANTED_AFFINITIES?.[rKey]) ? RACE_GRANTED_AFFINITIES[rKey] : [];
  const grantedApt = Array.isArray(RACE_GRANTED_APTITUDES?.[rKey]) ? RACE_GRANTED_APTITUDES[rKey] : [];

  const currentAff = actor.system?.affinities ?? {};
  const currentApt = actor.system?.aptitudes ?? {};

  const update = {};

  for (const raw of grantedAff) {
    const key = toKey(raw);
    if (!key) continue;
    if (currentAff?.[key]) continue;

    const name = safeCatalogName(affinityCatalog, key, "Affinity: ");
    update[`system.affinities.${key}`] = { key, name, source: "race", granted: true };
  }

  for (const raw of grantedApt) {
    const key = toKey(raw);
    if (!key) continue;
    if (currentApt?.[key]) continue;

    const name = safeCatalogName(aptitudeCatalog, key, "Aptitude: ");
    update[`system.aptitudes.${key}`] = { key, name, source: "race", granted: true };
  }

  if (Object.keys(update).length) await actor.update(update);
}

async function cleanupRaceGrantedFeatureItems(actor) {
  // Delete only feature Items that are clearly race-created by our system
  const toDelete = Array.from(actor.items ?? [])
    .filter((it) => it?.type === "feature")
    .filter((it) => it?.system?.source === "race")
    .filter((it) => {
      const gk = toKey(it?.system?.grantKey);
      return gk.startsWith("race:");
    })
    .map((it) => it.id);

  if (toDelete.length) await actor.deleteEmbeddedDocuments("Item", toDelete);
}

async function applyRaceGrantedFeatureItems(actor, raceKey) {
  const rKey = toKey(raceKey);
  if (!rKey) return;

  const defs = Array.isArray(RACE_GRANTED_FEATURES?.[rKey]) ? RACE_GRANTED_FEATURES[rKey] : [];
  if (!defs.length) return;

  // Build desired grantKey set
  const desired = defs
    .map((d) => buildRaceFeatureGrantKey(rKey, d))
    .map(toKey)
    .filter(Boolean);

  const desiredSet = new Set(desired);

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

  // Refresh existing after possible deletes
  const existing2 = Array.from(actor.items ?? [])
    .filter((it) => it?.type === "feature")
    .filter((it) => it?.system?.source === "race");

  const existingGrantKeys = new Set(
    existing2.map((it) => toKey(it?.system?.grantKey)).filter(Boolean)
  );

  // Create missing
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

  // Final safety: delete any race feature items that are not in desired set
  const final = Array.from(actor.items ?? [])
    .filter((it) => it?.type === "feature")
    .filter((it) => it?.system?.source === "race");

  const staleIds = final
    .filter((it) => {
      const gk = toKey(it?.system?.grantKey);
      // only manage our namespace
      if (!gk.startsWith("race:")) return false;
      return !desiredSet.has(gk);
    })
    .map((it) => it.id);

  if (staleIds.length) await actor.deleteEmbeddedDocuments("Item", staleIds);
}

/**
 * Replace race grants:
 *  - Remove prior race-granted affinities/aptitudes (only those marked source="race" and granted=true)
 *  - Remove prior race-granted feature items (only those with source="race" and grantKey starting with "race:")
 *  - Apply new race grants
 *
 * This prevents “old race stuff lingering” and stops runaway duplication.
 */
async function replaceRaceGrants(sheet, raceKey) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

    const rKey = toKey(raceKey);
    if (!rKey) return;

    // Guard against repeated calls during the same update cascade
    const last = actor.system?._flags?.lastRaceGrantSync ?? "";
    if (last === rKey) return;

    // Mark immediately to prevent multi-fire duplication loops
    await actor.update({ "system._flags.lastRaceGrantSync": rKey });

    // Cleanup then apply
    await cleanupRaceGrantedEnhancements(actor);
    await cleanupRaceGrantedFeatureItems(actor);

    await applyRaceGrantedEnhancements(actor, rKey);
    await applyRaceGrantedFeatureItems(actor, rKey);
  } catch (err) {
    console.warn("HWFWM | replaceRaceGrants failed", err);
  }
}

/* -------------------------------------------- */
/* Lock choices                                  */
/* -------------------------------------------- */

async function lockChoices(sheet) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

    const alreadyLocked = Boolean(actor.system?._flags?.choicesLocked);
    if (alreadyLocked) return;

    await actor.update({ "system._flags.choicesLocked": true });
  } catch (err) {
    console.warn("HWFWM | lockChoices failed", err);
  }
}

/* -------------------------------------------- */
/* Binder                                        */
/* -------------------------------------------- */

export function bindActorSheetListeners(arg1, arg2, arg3) {
  let sheet, root, controller;

  if (arg1 && typeof arg1 === "object" && "sheet" in arg1 && "root" in arg1 && "controller" in arg1) {
    ({ sheet, root, controller } = arg1);
  } else {
    sheet = arg1;
    root = arg2;
    controller = arg3;
  }

  if (!sheet || !root || !controller) return;

  const { signal } = controller;

  // One-time sync on render/bind
  const initialDetails = sheet.document?.system?.details ?? {};
  const initialBgKey = initialDetails?.backgroundKey ?? "";
  const initialRaceKey = initialDetails?.raceKey ?? "";

  persistBackgroundGrantedSpecialties(sheet, initialBgKey);
  handleBackgroundChoiceGrant(sheet, initialBgKey);

  // IMPORTANT: Use replace behavior (not one-way add)
  // Also: this is safe because it only manages entries/items marked as race-granted.
  replaceRaceGrants(sheet, initialRaceKey);

  // Tabs
  activateTabGroup(sheet, root, {
    group: "primary",
    navSelector: '.hwfwm-tabs[data-group="primary"]',
    defaultTab: "overview",
    getPersisted: () => sheet._activeTab,
    setPersisted: (t) => (sheet._activeTab = t),
    signal
  });

  activateTabGroup(sheet, root, {
    group: "traits",
    navSelector: '.hwfwm-tabs[data-group="traits"]',
    defaultTab: "enhancements",
    getPersisted: () => sheet._activeSubTabs.traits,
    setPersisted: (t) => (sheet._activeSubTabs.traits = t),
    signal
  });

  activateTabGroup(sheet, root, {
    group: "essence",
    navSelector: '.hwfwm-tabs[data-group="essence"]',
    defaultTab: "power",
    getPersisted: () => sheet._activeSubTabs.essence,
    setPersisted: (t) => {
      sheet._activeSubTabs.essence = t;
      const current = sheet.document?.system?._ui?.essenceSubTab ?? "power";
      if (current !== t) sheet.document?.update?.({ "system._ui.essenceSubTab": t }).catch(() => {});
    },
    signal
  });

  activateTabGroup(sheet, root, {
    group: "treasures",
    navSelector: '.hwfwm-tabs[data-group="treasures"]',
    defaultTab: "equipment",
    getPersisted: () => sheet._activeSubTabs.treasures,
    setPersisted: (t) => {
      sheet._activeSubTabs.treasures = t;
      const current = sheet.document?.system?._ui?.treasuresSubTab ?? "equipment";
      if (current !== t) sheet.document?.update?.({ "system._ui.treasuresSubTab": t }).catch(() => {});
    },
    signal
  });

  // Change handler (do NOT capture)
  root.addEventListener(
    "change",
    async (ev) => {
      const target = ev.target;

      if (target instanceof HTMLSelectElement && target.name === "system.details.backgroundKey") {
        await persistBackgroundGrantedSpecialties(sheet, target.value);
        await handleBackgroundChoiceGrant(sheet, target.value);
        return;
      }

      if (target instanceof HTMLSelectElement && target.name === "system.details.raceKey") {
        // Replace race grants on change
        await replaceRaceGrants(sheet, target.value);
        return;
      }

      if (
        (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
        target.dataset?.itemId &&
        target.dataset?.itemField
      ) {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();

        const itemId = target.dataset.itemId;
        const field = target.dataset.itemField;

        const item = sheet.document?.items?.get(itemId);
        if (!item) return;

        let value = target.value;
        if (target instanceof HTMLInputElement && target.type === "number") {
          const n = Number(value);
          value = Number.isFinite(n) ? n : 0;
        }

        if (field === "system.quantity" && typeof value === "number" && value <= 0) {
          await item.delete();
          return;
        }

        if (field === "name") {
          await item.update({ name: String(value ?? "") });
          return;
        }

        await item.update({ [field]: value });
        return;
      }

      if (
        (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
        target.dataset?.miscKey &&
        target.dataset?.miscField
      ) {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();

        const key = target.dataset.miscKey;
        const field = target.dataset.miscField;

        let value = target.value;
        if (target instanceof HTMLInputElement && target.type === "number") {
          const n = Number(value);
          value = Number.isFinite(n) ? n : 0;
        }

        await updateMiscField(sheet, { key, field, value });
        return;
      }

      if (target instanceof HTMLSelectElement) {
        const handled = await handleEssenceSelectChange(sheet, target);
        if (handled) {
          ev.preventDefault?.();
          ev.stopPropagation?.();
          ev.stopImmediatePropagation?.();
          return;
        }
      }

      // Let Foundry handle standard submitOnChange actor fields.
    },
    { signal, capture: false }
  );

  // Click handler (delegated)
  root.addEventListener(
    "click",
    async (ev) => {
      const actionBtn = ev.target?.closest?.("[data-action]");
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;

      const allowed = new Set([
        "add-misc-item",
        "remove-misc-item",
        "add-specialty",
        "lock-choices",
        "add-affinity",
        "remove-affinity",
        "add-aptitude",
        "remove-aptitude",
        "add-resistance",
        "remove-resistance"
      ]);

      if (!allowed.has(action)) return;

      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();

      if (action === "add-misc-item") return openAddMiscDialog(sheet);

      if (action === "remove-misc-item") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        return removeMiscByKey(sheet, key);
      }

      if (action === "add-specialty") return addSelectedSpecialty(sheet);

      if (action === "add-affinity") return addSelectedAffinity(sheet);
      if (action === "remove-affinity") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        return removeAffinity(sheet, key);
      }

      if (action === "add-aptitude") return addSelectedAptitude(sheet);
      if (action === "remove-aptitude") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        return removeAptitude(sheet, key);
      }

      if (action === "add-resistance") return addSelectedResistance(sheet);
      if (action === "remove-resistance") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        return removeResistance(sheet, key);
      }

      if (action === "lock-choices") return lockChoices(sheet);
    },
    { signal, capture: true }
  );
}

export function bindListeners(args) {
  return bindActorSheetListeners(args);
}
