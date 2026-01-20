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
 * Per-actor stored shape (backward compatible):
 * system.treasures.miscItems.<key> = {
 *   name, quantity, notes,
 *   equipped?, rank?,
 *   weightOverride?, valueOverride?
 * }
 *
 * Catalog remains authoritative for static metadata (group/category, baseWeight, baseValue, tags, description, etc).
 */

/** Coerce helpers */
function toStr(v) {
  return String(v ?? "").trim();
}

function toIntClamp0(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function toBool(v) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "on" || s === "yes";
}

function normalizeOptionalNumber(v) {
  // Accept blank as "no override"
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.max(0, n) : null;
}

function ensureMiscEntryShape(existing, key, catalogEntry) {
  const entryName = existing?.name ?? catalogEntry?.name ?? key;

  return {
    name: entryName,
    quantity: toIntClamp0(existing?.quantity ?? 1),
    notes: toStr(existing?.notes ?? catalogEntry?.notes ?? ""),

    // Per-actor fields (optional)
    equipped: toBool(existing?.equipped ?? false),
    rank: toStr(existing?.rank ?? ""),

    // Overrides (optional; null means "use catalog/base display value")
    weightOverride:
      existing?.weightOverride === null || existing?.weightOverride === undefined
        ? null
        : normalizeOptionalNumber(existing?.weightOverride),
    valueOverride:
      existing?.valueOverride === null || existing?.valueOverride === undefined
        ? null
        : normalizeOptionalNumber(existing?.valueOverride)
  };
}

/**
 * Add or merge a misc item by catalog key (inline Add Row).
 * - Validates the key exists in the catalog
 * - Accumulates quantity if it already exists on the actor
 * - Initializes per-actor fields with sane defaults (backward compatible)
 */
export async function addMiscByKey(sheet, { key, quantity }) {
  const k = toStr(key);
  const qty = toIntClamp0(quantity);

  if (!sheet?.document) return;
  if (!k || qty <= 0) return;

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
 * Supports both "weight"/"value" (template-friendly) and "weightOverride"/"valueOverride" (storage).
 */
export async function updateMiscField(sheet, { key, field, value }) {
  const k = toStr(key);
  const f = toStr(field);
  if (!sheet?.document) return;
  if (!k || !f) return;

  const catalog = getFlatMiscCatalog();
  const catEntry = catalog[k] ?? null;

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
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

  // Common string fields
  if (f === "name" || f === "notes" || f === "rank") {
    current[k][f] = toStr(value);
    await sheet.document.update({ "system.treasures.miscItems": current });
    return;
  }

  // Boolean fields
  if (f === "equipped") {
    current[k].equipped = toBool(value);
    await sheet.document.update({ "system.treasures.miscItems": current });
    return;
  }

  // Override numeric fields (null when blank)
  if (f === "weight" || f === "weightOverride") {
    current[k].weightOverride = normalizeOptionalNumber(value);
    await sheet.document.update({ "system.treasures.miscItems": current });
    return;
  }

  if (f === "value" || f === "valueOverride") {
    current[k].valueOverride = normalizeOptionalNumber(value);
    await sheet.document.update({ "system.treasures.miscItems": current });
    return;
  }

  // Fallback: store trimmed string for unknown future fields (non-breaking)
  current[k][f] = typeof value === "string" ? value.trim() : value;
  await sheet.document.update({ "system.treasures.miscItems": current });
}
