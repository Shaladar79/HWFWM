// scripts/sheets/actor/treasures-misc.mjs

/**
 * Returns a flat misc catalog:
 * { "essence.fire": {name, group, ...}, ... }
 * Works even if cfg.miscItemCatalog was accidentally bucketed.
 */
export function getFlatMiscCatalog() {
  const raw = CONFIG["hwfwm-system"]?.miscItemCatalog ?? {};
  const out = {};

  const isEntry = (v) =>
    v && typeof v === "object" && typeof v.name === "string" && typeof v.group === "string";

  const walk = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      if (isEntry(v)) out[k] = v;
      else if (v && typeof v === "object") walk(v);
    }
  };

  walk(raw);
  return out;
}

/**
 * Per-actor stored shape (forward + backward compatible):
 * system.treasures.miscItems.<key> = {
 *   name: string,        // cached display name (fallback if catalog entry is missing later)
 *   quantity: number,
 *   rank?: string        // ONLY for ranked catalog entries (e.g., Quintessence / Food Ingredients)
 * }
 *
 * Catalog remains authoritative for metadata:
 * - group/category
 * - value
 * - description, tags, etc.
 */

/* -------------------------------------------- */
/* Coerce helpers                                */
/* -------------------------------------------- */

function toStr(v) {
  return String(v ?? "").trim();
}

function toIntClamp0(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/**
 * Prevent "category string" being passed as the key by mistake.
 * Your catalog keys are namespaced like: "sundries.rope-50ft", "essence.fire", "awakening.earth", etc.
 * This guard makes the failure mode loud (warn) instead of silently corrupting rows.
 */
function looksLikeCatalogKey(k) {
  const s = toStr(k);
  // minimal heuristic: must contain a namespace delimiter
  return s.includes(".") && !s.includes(" ");
}

/**
 * Determine whether a misc catalog entry supports "rank".
 *
 * Preferred future-proof flag: catalogEntry.hasRank === true
 * Backward-compatible fallback: group name match (until you add hasRank in config).
 */
function supportsRank(catalogEntry) {
  if (!catalogEntry || typeof catalogEntry !== "object") return false;
  if (catalogEntry.hasRank === true) return true;

  const g = toStr(catalogEntry.group);
  // Fallback list (can be changed later when config adds hasRank everywhere it matters)
  return g === "Quintessence" || g === "Food Ingredients";
}

function ensureMiscEntryShape(existing, key, catalogEntry) {
  const entryName = toStr(existing?.name) || toStr(catalogEntry?.name) || key;

  // Default quantity to 1 if missing/invalid; updates can still set it down to 0 to delete.
  const existingQty = Number.isFinite(Number(existing?.quantity)) ? Number(existing?.quantity) : 1;

  const out = {
    name: entryName,
    quantity: Math.max(0, Math.floor(existingQty))
  };

  if (supportsRank(catalogEntry)) {
    out.rank = toStr(existing?.rank ?? "");
  }

  // Intentionally do NOT carry forward any legacy fields:
  // - notes, equipped, weightOverride, valueOverride, etc.
  return out;
}

/* -------------------------------------------- */
/* CRUD helpers                                  */
/* -------------------------------------------- */

/**
 * Add or merge a misc item by catalog key (inline Add Row).
 * - Validates the key exists in the catalog
 * - Accumulates quantity if it already exists on the actor
 * - Initializes per-actor fields with sane defaults
 */
export async function addMiscByKey(sheet, { key, quantity }) {
  const k = toStr(key);
  const qty = toIntClamp0(quantity);

  if (!sheet?.document) return;
  if (!k || qty <= 0) return;

  // Explicit guard against a common UI wiring mistake:
  // passing the category string into "key".
  if (!looksLikeCatalogKey(k)) {
    ui?.notifications?.warn?.(`Misc item selection is not a valid item key: "${k}".`);
    return;
  }

  const catalog = getFlatMiscCatalog();
  const entry = catalog[k];

  if (!entry) {
    ui?.notifications?.warn?.(`Misc item selection is not a valid item key: "${k}".`);
    return;
  }

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
  const existing = current[k];

  const normalized = ensureMiscEntryShape(existing, k, entry);
  const existingQty = toIntClamp0(existing?.quantity ?? 0);
  normalized.quantity = existing ? existingQty + qty : qty;

  // Always cache the catalog name (prevents category strings, etc.)
  const catalogName = toStr(entry?.name);
  normalized.name = catalogName || normalized.name || k;

  current[k] = normalized;
  await sheet.document.update({ "system.treasures.miscItems": current });
}

/**
 * Remove a quantity from a misc item row.
 * - If quantity reaches 0, the row is deleted.
 * - If key is missing, does nothing (safe).
 */
export async function removeMiscQuantity(sheet, { key, quantity }) {
  const k = toStr(key);
  const qtyRemove = toIntClamp0(quantity);

  if (!sheet?.document) return;
  if (!k || qtyRemove <= 0) return;

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
  if (!current?.[k]) return;

  const existingQty = toIntClamp0(current[k]?.quantity ?? 0);
  const nextQty = Math.max(0, existingQty - qtyRemove);

  if (nextQty <= 0) {
    delete current[k];
  } else {
    current[k].quantity = nextQty;
  }

  await sheet.document.update({ "system.treasures.miscItems": current });
}

/**
 * Remove ALL of a misc item row (used by the "Remove All" button).
 */
export async function removeMiscByKey(sheet, key) {
  const k = toStr(key);
  if (!sheet?.document) return;
  if (!k) return;

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
  if (!(k in current)) return;

  delete current[k];
  await sheet.document.update({ "system.treasures.miscItems": current });
}

/**
 * Update a misc item field (inline edit).
 *
 * Supported fields:
 * - quantity (number; <=0 deletes the row)
 * - rank (string; only stored if the catalog entry supports rank)
 *
 * All other fields are ignored on purpose to keep misc items lightweight.
 */
export async function updateMiscField(sheet, { key, field, value }) {
  const k = toStr(key);
  const f = toStr(field);

  if (!sheet?.document) return;
  if (!k || !f) return;

  // If a bad key sneaks in, do not mutate actor data.
  if (!looksLikeCatalogKey(k)) return;

  const catalog = getFlatMiscCatalog();
  const catEntry = catalog[k] ?? null;

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});

  // If the row doesn't exist yet and catalog entry is missing, do nothing.
  // (Prevents creating orphan rows with unknown keys.)
  if (!current[k] && !catEntry) return;

  current[k] = ensureMiscEntryShape(current[k], k, catEntry);

  // Quantity: clamp >=0, auto-remove at 0
  if (f === "quantity") {
    const qty = toIntClamp0(value);

    if (qty <= 0) {
      delete current[k];
      await sheet.document.update({ "system.treasures.miscItems": current });
      return;
    }

    current[k].quantity = qty;
    await sheet.document.update({ "system.treasures.miscItems": current });
    return;
  }

  // Rank: only for ranked entries
  if (f === "rank") {
    if (!supportsRank(catEntry)) return;

    current[k].rank = toStr(value);
    await sheet.document.update({ "system.treasures.miscItems": current });
    return;
  }

  // Intentionally ignore all other fields (equipped/notes/weight/value/etc.)
}
