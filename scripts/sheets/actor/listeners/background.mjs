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
      choiceId
    };
  }

  update[`system._flags.backgroundChoices.${bgKey}`] = picked;

  if (Object.keys(update).length) await actor.update(update);
}
