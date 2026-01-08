// scripts/sheets/actor/listeners/traits.mjs

const toKey = (v) => String(v ?? "").trim();

function safeCatalogName(catalog, key, fallbackPrefix = "") {
  const meta = catalog?.[key];
  if (meta?.name) return String(meta.name);
  return fallbackPrefix ? `${fallbackPrefix}${key}` : String(key);
}

/* -------------------------------------------- */
/* Specialties                                   */
/* -------------------------------------------- */

export async function addSelectedSpecialty(sheet) {
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
/* Affinities                                    */
/* -------------------------------------------- */

export async function addSelectedAffinity(sheet) {
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

export async function removeAffinity(sheet, key) {
  const actor = sheet?.document;
  if (!actor) return;

  const k = toKey(key);
  if (!k) return;

  const current = actor.system?.affinities ?? {};
  if (!current?.[k]) return;

  await actor.update({ [`system.affinities.-=${k}`]: null });
}

/* -------------------------------------------- */
/* Aptitudes                                     */
/* -------------------------------------------- */

export async function addSelectedAptitude(sheet) {
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

export async function removeAptitude(sheet, key) {
  const actor = sheet?.document;
  if (!actor) return;

  const k = toKey(key);
  if (!k) return;

  const current = actor.system?.aptitudes ?? {};
  if (!current?.[k]) return;

  await actor.update({ [`system.aptitudes.-=${k}`]: null });
}

/* -------------------------------------------- */
/* Resistances                                   */
/* -------------------------------------------- */

export async function addSelectedResistance(sheet) {
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

export async function removeResistance(sheet, key) {
  const actor = sheet?.document;
  if (!actor) return;

  const k = toKey(key);
  if (!k) return;

  const current = actor.system?.resistances ?? {};
  if (!current?.[k]) return;

  await actor.update({ [`system.resistances.-=${k}`]: null });
}
