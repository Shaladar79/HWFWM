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

function toNumClamp0(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
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
    quantity: toNumClamp0(existing?.quantity ?? 1),
    notes: toStr(existing?.notes ?? catalogEntry?.notes ?? ""),

    // New per-actor fields (optional)
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

export function openAddMiscDialog(sheet) {
  const catalog = getFlatMiscCatalog();

  // IMPORTANT: these values must match entry.group from your misc-items config
  const TYPE_OPTIONS = [
    { value: "Sundries", label: "Sundries" },
    { value: "Awakening Stones", label: "Awakening Stones" },
    { value: "Essences", label: "Essence Cube" },
    { value: "Quintessence", label: "Quintessence" },
    { value: "Other", label: "Other" }
  ];

  const rowsForGroup = (groupName) =>
    Object.entries(catalog)
      .filter(([, v]) => toStr(v?.group) === toStr(groupName))
      .map(([k, v]) => ({ key: k, name: v?.name ?? k }))
      .sort((a, b) => a.name.localeCompare(b.name));

  const buildOptions = (groupName) => {
    const rows = rowsForGroup(groupName);
    if (!rows.length) return `<option value="">— None Available —</option>`;

    return [
      `<option value="">— Select —</option>`,
      ...rows.map((r) => {
        const safeKey = foundry.utils.escapeHTML(r.key);
        const safeName = foundry.utils.escapeHTML(r.name);
        // CRITICAL: option value is the *catalog key*, not the group/type
        return `<option value="${safeKey}">${safeName}</option>`;
      })
    ].join("");
  };

  const defaultGroup = "Sundries";

  const content = `
    <form class="hwfwm-misc-dialog">
      <div class="form-group">
        <label>Type</label>
        <select name="miscType">
          ${TYPE_OPTIONS.map((o) => {
            const safeVal = foundry.utils.escapeHTML(o.value);
            const safeLbl = foundry.utils.escapeHTML(o.label);
            return `<option value="${safeVal}" ${o.value === defaultGroup ? "selected" : ""}>${safeLbl}</option>`;
          }).join("")}
        </select>
      </div>

      <div class="form-group">
        <label>Item</label>
        <select name="miscKey">
          ${buildOptions(defaultGroup)}
        </select>
      </div>

      <div class="form-group">
        <label>Quantity</label>
        <input type="number" name="miscQty" min="0" step="1" value="1" />
      </div>
    </form>
  `;

  const onRender = (html) => {
    const form = html?.[0]?.querySelector?.("form.hwfwm-misc-dialog");
    if (!form) return;

    const typeSel = form.querySelector('select[name="miscType"]');
    const itemSel = form.querySelector('select[name="miscKey"]');
    if (!typeSel || !itemSel) return;

    const refreshItems = () => {
      const groupName = toStr(typeSel.value);
      itemSel.innerHTML = buildOptions(groupName);
    };

    typeSel.addEventListener("change", refreshItems);
    refreshItems();
  };

  new Dialog(
    {
      title: "Add Misc Item",
      content,
      render: onRender,
      buttons: {
        add: {
          label: "Add",
          callback: async (html) => {
            const form = html?.[0]?.querySelector?.("form.hwfwm-misc-dialog");
            if (!form) return;

            // CRITICAL: read the selected ITEM KEY (miscKey), not the type (miscType)
            const key = toStr(form.querySelector('select[name="miscKey"]')?.value);
            const qty = toNumClamp0(form.querySelector('input[name="miscQty"]')?.value ?? "1");

            // If nothing selected, do nothing
            if (!key || qty <= 0) return;

            // Safety: if key isn't a catalog entry, warn and stop.
            // This catches the exact bug you're seeing (key becomes "Sundries", etc.)
            const entry = catalog[key];
            if (!entry) {
              ui?.notifications?.warn?.(
                `Misc item selection is not a valid item key: "${key}". (This usually means the dialog is reading the Type instead of the Item.)`
              );
              return;
            }

            const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
            const existing = current[key];

            // Backward compatible merge:
            // - keep name/notes if already customized on actor
            // - accumulate quantity
            // - initialize new per-actor fields with sane defaults
            const normalized = ensureMiscEntryShape(existing, key, entry);

            const existingQty = toNumClamp0(existing?.quantity ?? 0);
            normalized.quantity = existing ? existingQty + qty : qty;

            current[key] = normalized;

            await sheet.document.update({ "system.treasures.miscItems": current });
          }
        },
        cancel: { label: "Cancel" }
      },
      default: "add"
    },
    { width: 420 }
  ).render(true);
}

export async function removeMiscByKey(sheet, key) {
  const k = toStr(key);
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
  if (!k || !f) return;

  const catalog = getFlatMiscCatalog();
  const catEntry = catalog[k] ?? null;

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
  current[k] = ensureMiscEntryShape(current[k], k, catEntry);

  // Quantity: clamp >=0, auto-remove at 0
  if (f === "quantity") {
    const qty = toNumClamp0(value);

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
