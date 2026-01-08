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

  const toStr = (v) => String(v ?? "").trim();

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
            const qtyRaw = form.querySelector('input[name="miscQty"]')?.value ?? "1";
            const qtyNum = Number(qtyRaw);
            const qty = Number.isFinite(qtyNum) ? Math.max(0, qtyNum) : 0;

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

            if (current[key]) {
              const existingQty = Number(current[key]?.quantity ?? 0);
              const safeExistingQty = Number.isFinite(existingQty) ? existingQty : 0;

              current[key] = {
                name: current[key]?.name ?? entry.name ?? key,
                notes: current[key]?.notes ?? entry.notes ?? "",
                quantity: safeExistingQty + qty
              };
            } else {
              current[key] = {
                name: entry.name ?? key,
                quantity: qty,
                notes: entry.notes ?? ""
              };
            }

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
  const k = (key ?? "").trim();
  if (!k) return;

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
  if (!(k in current)) return;

  delete current[k];
  await sheet.document.update({ "system.treasures.miscItems": current });
}

export async function updateMiscField(sheet, { key, field, value }) {
  const k = (key ?? "").trim();
  if (!k) return;

  const current = foundry.utils.deepClone(sheet.document?.system?.treasures?.miscItems ?? {});
  if (!current[k]) current[k] = { name: k, quantity: 1, notes: "" };

  if (field === "quantity") {
    const n = Number(value);
    const qty = Number.isFinite(n) ? n : 0;

    // Auto-remove at 0
    if (qty <= 0) {
      delete current[k];
      await sheet.document.update({ "system.treasures.miscItems": current });
      return;
    }

    current[k].quantity = qty;
    await sheet.document.update({ "system.treasures.miscItems": current });
    return;
  }

  current[k][field] = value;
  await sheet.document.update({ "system.treasures.miscItems": current });
}
