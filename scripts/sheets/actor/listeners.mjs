// scripts/sheets/actor/listeners.mjs

import { activateTabGroup } from "./tabs.mjs";
import { handleEssenceSelectChange } from "./essence.mjs";
import { openAddMiscDialog, removeMiscByKey, updateMiscField } from "./treasures-misc.mjs";
import {
  BACKGROUND_GRANTED_SPECIALTIES,
  BACKGROUND_SPECIALTY_CHOICE,
  BACKGROUND_CHOICE_OPTIONS
} from "../../../config/backgrounds.mjs"; // ✅ expand imports

// ✅ NEW: race grants + race feature definitions
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

/**
 * Persist background-granted specialties onto the Actor (one-way add).
 * - Adds missing specialty keys to system.specialties
 * - NEVER overwrites an existing entry
 * - Does NOT remove specialties if background later changes (safe behavior for now)
 */
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

      // If it already exists, do not overwrite
      if (current?.[k]) continue;

      update[`system.specialties.${k}`] = {
        score: 0,
        source: "background",
        granted: true
      };
    }

    if (Object.keys(update).length) {
      await actor.update(update);
    }
  } catch (err) {
    console.warn("HWFWM | persistBackgroundGrantedSpecialties failed", err);
  }
}

/**
 * Present a simple dialog to choose a specialty key from a configured option set.
 * Returns the chosen key string, or "" if canceled.
 */
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
        cancel: {
          label: "Cancel",
          callback: () => resolve("")
        }
      },
      default: "ok",
      close: () => resolve("")
    }).render(true);
  });
}

/**
 * Persist a chosen specialty for a background that has a choice rule.
 * - Does not overwrite existing specialties
 * - Stores a marker at system._flags.backgroundChoices.<backgroundKey> so we don't re-prompt
 */
async function handleBackgroundChoiceGrant(sheet, backgroundKey) {
  const actor = sheet?.document;
  if (!actor) return;

  const bgKey = toKey(backgroundKey);
  if (!bgKey) return;

  const rule = BACKGROUND_SPECIALTY_CHOICE?.[bgKey] ?? null;
  if (!rule) return;

  const choiceId = toKey(rule.id);
  if (!choiceId) return;

  // If already chosen previously for this background, do nothing
  const existingChoice =
    actor.system?._flags?.backgroundChoices?.[bgKey] ??
    actor.system?._flags?.backgroundChoice?.[bgKey]; // tolerate older key

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

  // Add the chosen specialty if missing (do not overwrite)
  if (!current?.[picked]) {
    update[`system.specialties.${picked}`] = {
      score: 0,
      source: "background",
      granted: true,
      choiceId
    };
  }

  // Record the choice so we do not re-prompt
  update[`system._flags.backgroundChoices.${bgKey}`] = picked;

  if (Object.keys(update).length) {
    await actor.update(update);
  }
}

/**
 * Add a selected specialty (manual pick) to the actor.
 * Reads the pick from system._ui.addSpecialtyKey.
 */
async function addSelectedSpecialty(sheet) {
  const actor = sheet?.document;
  if (!actor) return;

  const selectedKey = toKey(actor.system?._ui?.addSpecialtyKey);
  if (!selectedKey) return;

  // Validate against catalog (optional but recommended)
  const catalog = CONFIG["hwfwm-system"]?.specialtyCatalog ?? {};
  if (!catalog?.[selectedKey]) {
    ui?.notifications?.warn?.(`Unknown specialty key: ${selectedKey}`);
    return;
  }

  const current = actor.system?.specialties ?? {};
  if (current?.[selectedKey]) {
    // Already has it; just clear the dropdown to reduce friction
    await actor.update({ "system._ui.addSpecialtyKey": "" });
    return;
  }

  const update = {
    [`system.specialties.${selectedKey}`]: {
      score: 0,
      source: "manual",
      granted: false
    },
    "system._ui.addSpecialtyKey": ""
  };

  await actor.update(update);
}

/* -------------------------------------------- */
/* NEW: Affinities / Aptitudes / Resistances     */
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
  const update = {
    [`system.affinities.${selectedKey}`]: {
      key: selectedKey,
      name,
      source: "manual",
      granted: false
    },
    "system._ui.addAffinityKey": ""
  };

  await actor.update(update);
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
  const update = {
    [`system.aptitudes.${selectedKey}`]: {
      key: selectedKey,
      name,
      source: "manual",
      granted: false
    },
    "system._ui.addAptitudeKey": ""
  };

  await actor.update(update);
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
  const update = {
    [`system.resistances.${selectedKey}`]: {
      key: selectedKey,
      name,
      source: "manual",
      granted: false
    },
    "system._ui.addResistanceKey": ""
  };

  await actor.update(update);
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
/* NEW: Race one-way grants                      */
/* -------------------------------------------- */

/**
 * One-way persist: race-granted affinities + aptitudes into actor.system.*.
 * - Adds missing keys
 * - Never overwrites
 * - Never removes on race change (safe for now)
 */
async function persistRaceGrantedEnhancements(sheet, raceKey) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

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
      update[`system.affinities.${key}`] = {
        key,
        name,
        source: "race",
        granted: true
      };
    }

    for (const raw of grantedApt) {
      const key = toKey(raw);
      if (!key) continue;
      if (currentApt?.[key]) continue;

      const name = safeCatalogName(aptitudeCatalog, key, "Aptitude: ");
      update[`system.aptitudes.${key}`] = {
        key,
        name,
        source: "race",
        granted: true
      };
    }

    if (Object.keys(update).length) {
      await actor.update(update);
    }
  } catch (err) {
    console.warn("HWFWM | persistRaceGrantedEnhancements failed", err);
  }
}

/**
 * One-way persist: race-granted FEATURES into embedded Item documents (type "feature").
 * This is required because your context renders grantedFeatures from Items, not from config.
 *
 * Safe rules:
 * - Only creates missing items
 * - Uses system.source="race" and a stable system.grantKey for de-dupe
 * - Never deletes items on race change (safe for now)
 */
async function persistRaceGrantedFeatures(sheet, raceKey) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

    const rKey = toKey(raceKey);
    if (!rKey) return;

    const defs = Array.isArray(RACE_GRANTED_FEATURES?.[rKey]) ? RACE_GRANTED_FEATURES[rKey] : [];
    if (!defs.length) return;

    // De-dupe against existing items by system.grantKey (preferred), then by name fallback
    const existing = Array.from(actor.items ?? []).filter((it) => it?.type === "feature");
    const existingGrantKeys = new Set(existing.map((it) => toKey(it.system?.grantKey)).filter(Boolean));
    const existingNames = new Set(existing.map((it) => toKey(it.name)).filter(Boolean));

    const toCreate = [];

    for (const f of defs) {
      const name = toKey(f?.name);
      const grantKey = toKey(f?.grantKey);
      if (!name) continue;

      if (grantKey && existingGrantKeys.has(grantKey)) continue;
      if (!grantKey && existingNames.has(name)) continue;

      toCreate.push({
        name,
        type: "feature",
        system: {
          source: "race",
          grantKey: grantKey || `race:${rKey}:${toKey(f?.key) || name.toLowerCase().replace(/\s+/g, "")}`,
          notes: toKey(f?.description) || ""
        }
      });
    }

    if (toCreate.length) {
      await actor.createEmbeddedDocuments("Item", toCreate);
    }
  } catch (err) {
    console.warn("HWFWM | persistRaceGrantedFeatures failed", err);
  }
}

/* -------------------------------------------- */
/* Existing: One-way lock                         */
/* -------------------------------------------- */

/**
 * One-way lock to finalize character creation selections (race/role/background).
 * - Sets system._flags.choicesLocked = true
 * - Does not attempt to disable UI here; templates should render disabled based on the flag
 */
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

/**
 * Bind all DOM listeners for the actor sheet.
 *
 * Supports BOTH signatures:
 *  - bindActorSheetListeners(sheet, root, controller)
 *  - bindActorSheetListeners({ sheet, root, controller })
 */
export function bindActorSheetListeners(arg1, arg2, arg3) {
  // Normalize arguments into { sheet, root, controller }
  let sheet, root, controller;

  if (
    arg1 &&
    typeof arg1 === "object" &&
    "sheet" in arg1 &&
    "root" in arg1 &&
    "controller" in arg1
  ) {
    ({ sheet, root, controller } = arg1);
  } else {
    sheet = arg1;
    root = arg2;
    controller = arg3;
  }

  if (!sheet || !root || !controller) return;

  const { signal } = controller;

  // ✅ One-time sync on render/bind:
  // - add any fixed granted specialties
  // - if background has a choice and none recorded yet, prompt once
  const initialDetails = sheet.document?.system?.details ?? {};
  const initialBgKey = initialDetails?.backgroundKey ?? "";
  const initialRaceKey = initialDetails?.raceKey ?? "";

  persistBackgroundGrantedSpecialties(sheet, initialBgKey);
  handleBackgroundChoiceGrant(sheet, initialBgKey);

  // ✅ One-time sync: race enhancements + race features
  persistRaceGrantedEnhancements(sheet, initialRaceKey);
  persistRaceGrantedFeatures(sheet, initialRaceKey);

  // -----------------------
  // Tabs
  // -----------------------
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
      if (current !== t)
        sheet.document?.update?.({ "system._ui.treasuresSubTab": t }).catch(() => {});
    },
    signal
  });

  // -----------------------
  // Change handler (IMPORTANT: do NOT capture)
  // -----------------------
  root.addEventListener(
    "change",
    async (ev) => {
      const target = ev.target;

      // ------------------------------------------------
      // Background change: persist granted specialties + handle choice grant
      // ------------------------------------------------
      if (target instanceof HTMLSelectElement && target.name === "system.details.backgroundKey") {
        // Do NOT prevent default; let ApplicationV2 persist backgroundKey normally.
        await persistBackgroundGrantedSpecialties(sheet, target.value);
        await handleBackgroundChoiceGrant(sheet, target.value);
        return;
      }

      // ------------------------------------------------
      // Race change: persist race-granted enhancements + features (one-way add)
      // ------------------------------------------------
      if (target instanceof HTMLSelectElement && target.name === "system.details.raceKey") {
        // Do NOT prevent default; let ApplicationV2 persist raceKey normally.
        await persistRaceGrantedEnhancements(sheet, target.value);
        await persistRaceGrantedFeatures(sheet, target.value);
        return;
      }

      // ------------------------------------------------
      // Items inline edits (embedded Item documents)
      // ------------------------------------------------
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

        // Auto-delete consumables qty 0
        if (field === "system.quantity" && typeof value === "number" && value <= 0) {
          await item.delete();
          return;
        }

        // Name is a top-level field
        if (field === "name") {
          await item.update({ name: String(value ?? "") });
          return;
        }

        await item.update({ [field]: value });
        return;
      }

      // ------------------------------------------------
      // Misc inline edits (actor system data, not Items)
      // ------------------------------------------------
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

      // ------------------------------------------------
      // Essence enforcement (ONLY intercept if it handled)
      // ------------------------------------------------
      if (target instanceof HTMLSelectElement) {
        const handled = await handleEssenceSelectChange(sheet, target);
        if (handled) {
          ev.preventDefault?.();
          ev.stopPropagation?.();
          ev.stopImmediatePropagation?.();
          return;
        }
      }

      // ------------------------------------------------
      // IMPORTANT:
      // For all normal actor fields (name="system...."), do NOTHING here.
      // Let Foundry's ApplicationV2 form handler receive the event and
      // persist changes (submitOnChange).
      // ------------------------------------------------
    },
    { signal, capture: false }
  );

  // -----------------------
  // Click handler (delegated)
  // -----------------------
  root.addEventListener(
    "click",
    async (ev) => {
      const actionBtn = ev.target?.closest?.("[data-action]");
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;

      // Foundry window chrome uses data-action too.
      // Only intercept actions we own.
      const allowed = new Set([
        "add-misc-item",
        "remove-misc-item",
        "add-specialty",
        "lock-choices",

        // ✅ NEW: enhancements actions
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

      if (action === "add-misc-item") {
        openAddMiscDialog(sheet);
        return;
      }

      if (action === "remove-misc-item") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        await removeMiscByKey(sheet, key);
        return;
      }

      if (action === "add-specialty") {
        await addSelectedSpecialty(sheet);
        return;
      }

      if (action === "add-affinity") {
        await addSelectedAffinity(sheet);
        return;
      }

      if (action === "remove-affinity") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        await removeAffinity(sheet, key);
        return;
      }

      if (action === "add-aptitude") {
        await addSelectedAptitude(sheet);
        return;
      }

      if (action === "remove-aptitude") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        await removeAptitude(sheet, key);
        return;
      }

      if (action === "add-resistance") {
        await addSelectedResistance(sheet);
        return;
      }

      if (action === "remove-resistance") {
        const key = actionBtn.dataset.key ?? actionBtn.getAttribute("data-key");
        await removeResistance(sheet, key);
        return;
      }

      if (action === "lock-choices") {
        await lockChoices(sheet);
        return;
      }
    },
    { signal, capture: true }
  );
}

/**
 * Optional alias so actor-sheet.mjs can call either name safely.
 */
export function bindListeners(args) {
  return bindActorSheetListeners(args);
}
