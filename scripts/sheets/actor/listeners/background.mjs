// scripts/sheets/actor/listeners/background.mjs

import {
  BACKGROUND_GRANTED_SPECIALTIES,
  BACKGROUND_SPECIALTY_CHOICE,
  BACKGROUND_CHOICE_OPTIONS
} from "../../../../config/backgrounds.mjs";

/* -------------------------------------------- */
/* Helpers                                      */
/* -------------------------------------------- */

const toKey = (v) => String(v ?? "").trim();

function safeCatalogName(catalog, key, fallbackPrefix = "") {
  const meta = catalog?.[key];
  if (meta?.name) return String(meta.name);
  return fallbackPrefix ? `${fallbackPrefix}${key}` : String(key);
}

function getBackgroundGrantedKeys(actor, bgKey) {
  const k = toKey(bgKey);
  if (!k) return [];

  const fixed = Array.isArray(BACKGROUND_GRANTED_SPECIALTIES?.[k])
    ? BACKGROUND_GRANTED_SPECIALTIES[k].map(toKey).filter(Boolean)
    : [];

  const choice =
    actor?.system?._flags?.backgroundChoices?.[k] ??
    actor?.system?._flags?.backgroundChoice?.[k] ??
    "";

  const picked = toKey(choice);
  const all = picked ? [...fixed, picked] : fixed;

  // unique
  return Array.from(new Set(all));
}

/**
 * Clean up specialties granted by a previous background.
 * Rules:
 * - Only touch entries that are still marked as background-granted:
 *     source === "background" AND granted === true
 * - If score > 0, convert to manual (preserve progression).
 * - If score == 0, remove the specialty entry.
 * - Clear stored choice for the previous background so reselecting prompts again.
 */
export async function cleanupBackgroundGrantedSpecialties(sheet, previousBackgroundKey) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

    const prev = toKey(previousBackgroundKey);
    if (!prev) return;

    const keys = getBackgroundGrantedKeys(actor, prev);
    if (!keys.length) return;

    const current = actor.system?.specialties ?? {};
    const update = {};

    for (const key of keys) {
      const k = toKey(key);
      if (!k) continue;

      const entry = current?.[k];
      if (!entry) continue;

      const isBgGranted = String(entry?.source ?? "") === "background" && entry?.granted === true;
      if (!isBgGranted) continue;

      const score = Number(entry?.score ?? 0);

      if (score > 0) {
        // Preserve progress: convert to manual ownership
        update[`system.specialties.${k}`] = {
          ...entry,
          source: "manual",
          granted: false,
          // provenance cleanup (optional fields)
          backgroundKey: null,
          choiceId: null
        };
      } else {
        // Remove zero-score background grants outright
        update[`system.specialties.${k}`] = null;
      }
    }

    // Clear the stored choice for that previous background so it can be chosen again later
    update[`system._flags.backgroundChoices.${prev}`] = null;
    update[`system._flags.backgroundChoice.${prev}`] = null;

    if (Object.keys(update).length) await actor.update(update);
  } catch (err) {
    console.warn("HWFWM | cleanupBackgroundGrantedSpecialties failed", err);
  }
}

/* -------------------------------------------- */
/* Background: specialties                       */
/* -------------------------------------------- */

export async function persistBackgroundGrantedSpecialties(sheet, backgroundKey) {
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
        granted: true,
        backgroundKey: bgKey
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

export async function handleBackgroundChoiceGrant(sheet, backgroundKey) {
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
      choiceId,
      backgroundKey: bgKey
    };
  }

  update[`system._flags.backgroundChoices.${bgKey}`] = picked;

  if (Object.keys(update).length) await actor.update(update);
}

/**
 * Convenience helper for callers:
 * Call this on background change with (newKey, oldKey).
 * It will clean up old grants, then apply new fixed grants, then prompt choice if needed.
 */
export async function replaceBackgroundSpecialties(sheet, newBackgroundKey, previousBackgroundKey) {
  await cleanupBackgroundGrantedSpecialties(sheet, previousBackgroundKey);
  await persistBackgroundGrantedSpecialties(sheet, newBackgroundKey);
  await handleBackgroundChoiceGrant(sheet, newBackgroundKey);
}
