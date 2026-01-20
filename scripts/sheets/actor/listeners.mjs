// scripts/sheets/actor/listeners.mjs

import { activateTabGroup } from "./tabs.mjs";
import { handleEssenceSelectChange } from "./essence.mjs";
import {
  removeMiscByKey,
  updateMiscField,
  addMiscByKey,
  removeMiscQuantity,
  getFlatMiscCatalog
} from "./treasures-misc.mjs";

// Split modules (new)
import {
  persistBackgroundGrantedSpecialties,
  handleBackgroundChoiceGrant,
  replaceBackgroundSpecialties
} from "./listeners/background.mjs";

import {
  addSelectedSpecialty,
  addSelectedAffinity,
  removeAffinity,
  addSelectedAptitude,
  removeAptitude,
  addSelectedResistance,
  removeResistance
} from "./listeners/traits.mjs";

import { replaceRaceGrants } from "./listeners/race.mjs";
import { replaceRoleGrantedSpecialties } from "./listeners/role.mjs";

/* -------------------------------------------- */
/* Lock choices                                  */
/* -------------------------------------------- */

async function lockChoices(sheet) {
  try {
    const actor = sheet?.document;
    if (!actor) return;

    if (actor.system?._flags?.choicesLocked) return;
    await actor.update({ "system._flags.choicesLocked": true });
  } catch (err) {
    console.warn("HWFWM | lockChoices failed", err);
  }
}

/* -------------------------------------------- */
/* Misc inline add-row controller                */
/* -------------------------------------------- */

function bindMiscAddRow(sheet, root, { signal }) {
  const catalog = getFlatMiscCatalog();

  const toStr = (v) => String(v ?? "");
  const norm = (v) =>
    toStr(v)
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  // NOTE: Must match template data-misc-add-field values
  const categorySel = root.querySelector('select[data-misc-add-field="category"]');
  const keySel = root.querySelector('select[data-misc-add-field="key"]');
  const qtyInput = root.querySelector('input[data-misc-add-field="qty"]');

  // If the template isn't present (older sheet or different actor type), do nothing.
  if (!categorySel || !keySel || !qtyInput) return;

  const escape = (s) => foundry.utils.escapeHTML(String(s ?? ""));

  const getAllCategoriesFromCatalog = () => {
    const map = new Map(); // normalized -> display value (first seen)
    for (const v of Object.values(catalog ?? {})) {
      const raw = toStr(v?.group);
      const k = norm(raw);
      if (!k) continue;
      if (!map.has(k)) map.set(k, raw.trim());
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  };

  const rowsForCategory = (categoryName) => {
    const wanted = norm(categoryName);
    return Object.entries(catalog ?? {})
      .filter(([, v]) => norm(v?.group) === wanted) // normalized compare
      .map(([k, v]) => ({ key: k, name: v?.name ?? k }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  /**
   * Always rebuild Category <select> from catalog.
   * This avoids mismatch between hard-coded template options and catalog group strings.
   */
  const rebuildCategoryOptions = () => {
    const categories = getAllCategoriesFromCatalog();

    // If there are no categories in the catalog, we cannot populate items.
    if (!categories.length) {
      categorySel.innerHTML = `<option value="">— No Categories —</option>`;
      keySel.innerHTML = `<option value="">— None Available —</option>`;
      return false;
    }

    const prior = toStr(categorySel.value).trim();
    const priorNorm = norm(prior);

    categorySel.innerHTML = categories
      .map((c) => `<option value="${escape(c)}">${escape(c)}</option>`)
      .join("");

    // Preserve previous selection if still valid; otherwise snap to first.
    const validNorms = new Set(categories.map((c) => norm(c)));
    categorySel.value = priorNorm && validNorms.has(priorNorm) ? prior : categories[0];

    return true;
  };

  const refreshItems = () => {
    const ok = rebuildCategoryOptions();
    if (!ok) return;

    const categoryName = toStr(categorySel.value);
    let rows = rowsForCategory(categoryName);

    // Fallback: snap to first category that actually has items
    if (!rows.length) {
      const categories = getAllCategoriesFromCatalog();
      const firstWithItems = categories.find((c) => rowsForCategory(c).length > 0);
      if (firstWithItems) {
        categorySel.value = firstWithItems;
        rows = rowsForCategory(firstWithItems);
      }
    }

    if (!rows.length) {
      keySel.innerHTML = `<option value="">— None Available —</option>`;
      return;
    }

    keySel.innerHTML = [
      `<option value="">— Select —</option>`,
      ...rows.map((r) => {
        const safeKey = escape(r.key);
        const safeName = escape(r.name);
        return `<option value="${safeKey}">${safeName}</option>`;
      })
    ].join("");
  };

  // Initialize
  refreshItems();

  // Re-populate when category changes
  categorySel.addEventListener(
    "change",
    () => {
      // keep qty sane + clear item selection
      const n = Number(qtyInput.value || 1);
      qtyInput.value = String(Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1);

      refreshItems();
      keySel.value = "";
    },
    { signal }
  );
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
  let sheet, root, controller;

  // Normalize args
  if (arg1 && typeof arg1 === "object" && arg1.sheet && arg1.root && arg1.controller) {
    ({ sheet, root, controller } = arg1);
  } else {
    sheet = arg1;
    root = arg2;
    controller = arg3;
  }

  if (!sheet || !root || !controller) return;

  const { signal } = controller;

  // Bind inline misc add-row UI (no dialog)
  bindMiscAddRow(sheet, root, { signal });

  // One-time sync on render/bind
  const details = sheet.document?.system?.details ?? {};
  const initialBgKey = details.backgroundKey ?? "";
  const initialRaceKey = details.raceKey ?? "";
  const initialRoleKey = details.roleKey ?? "";

  // ------------------------------------------------------------
  // Background: stamp-based initial sync (mirrors race/role pattern)
  // ------------------------------------------------------------
  const bgStamp = sheet.document?.system?._flags?.backgroundGrantStamp ?? "";

  if (initialBgKey && bgStamp && bgStamp !== initialBgKey) {
    replaceBackgroundSpecialties(sheet, initialBgKey, bgStamp).then(() =>
      sheet.document?.update?.({ "system._flags.backgroundGrantStamp": initialBgKey }).catch(() => {})
    );
  } else {
    persistBackgroundGrantedSpecialties(sheet, initialBgKey);
    handleBackgroundChoiceGrant(sheet, initialBgKey);

    if (initialBgKey && bgStamp !== initialBgKey) {
      sheet.document?.update?.({ "system._flags.backgroundGrantStamp": initialBgKey }).catch(() => {});
    }
  }

  const raceStamp = sheet.document?.system?._flags?.raceGrantStamp ?? "";
  if (initialRaceKey && raceStamp !== initialRaceKey) {
    replaceRaceGrants(sheet, initialRaceKey);
  }

  const roleStamp = sheet.document?.system?._flags?.roleGrantStamp ?? "";
  if (initialRoleKey && roleStamp !== initialRoleKey) {
    replaceRoleGrantedSpecialties(sheet, initialRoleKey);
  }

  /* ----------------------- */
  /* Tabs                    */
  /* ----------------------- */

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

  const sanitizeTreasuresTab = (tab) => {
    const t = String(tab ?? "").trim();
    return t === "inventory" ? "inventory" : "equipment";
  };

  sheet._activeSubTabs.treasures = sanitizeTreasuresTab(
    sheet._activeSubTabs.treasures ?? sheet.document?.system?._ui?.treasuresSubTab ?? "equipment"
  );

  const persistedTreasuresTab = sanitizeTreasuresTab(sheet.document?.system?._ui?.treasuresSubTab ?? "equipment");
  if ((sheet.document?.system?._ui?.treasuresSubTab ?? "equipment") !== persistedTreasuresTab) {
    sheet.document?.update?.({ "system._ui.treasuresSubTab": persistedTreasuresTab }).catch(() => {});
  }

  activateTabGroup(sheet, root, {
    group: "treasures",
    navSelector: '.hwfwm-tabs[data-group="treasures"]',
    defaultTab: "equipment",
    getPersisted: () => sheet._activeSubTabs.treasures,
    setPersisted: (t) => {
      const safe = sanitizeTreasuresTab(t);
      sheet._activeSubTabs.treasures = safe;

      const currentRaw = sheet.document?.system?._ui?.treasuresSubTab ?? "equipment";
      const currentSafe = sanitizeTreasuresTab(currentRaw);

      if (currentSafe !== safe) {
        sheet.document?.update?.({ "system._ui.treasuresSubTab": safe }).catch(() => {});
      }
    },
    signal
  });

  /* ----------------------- */
  /* Change handler (CAPTURE) */
  /* ----------------------- */
  root.addEventListener(
    "change",
    async (ev) => {
      const target = ev.target;

      if (target instanceof HTMLSelectElement && target.name === "system.details.backgroundKey") {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();

        const actor = sheet?.document;
        if (!actor) return;

        const newKey = String(target.value ?? "").trim();
        const oldKey = String(actor.system?.details?.backgroundKey ?? "").trim();

        await actor.update({
          "system.details.backgroundKey": newKey,
          "system._flags.backgroundGrantStamp": newKey
        });

        await replaceBackgroundSpecialties(sheet, newKey, oldKey);
        return;
      }
    },
    { signal, capture: true }
  );

  /* ----------------------- */
  /* Change handler          */
  /* ----------------------- */
  root.addEventListener(
    "change",
    async (ev) => {
      const target = ev.target;

      if (target instanceof HTMLSelectElement && target.name === "system.details.raceKey") {
        await replaceRaceGrants(sheet, target.value);
        return;
      }

      if (target instanceof HTMLSelectElement && target.name === "system.details.roleKey") {
        await replaceRoleGrantedSpecialties(sheet, target.value);
        return;
      }

      // Embedded Items (equipment/consumables/etc.)
      if (
        (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
        target.dataset?.itemId &&
        target.dataset?.itemField
      ) {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();

        const item = sheet.document?.items?.get(target.dataset.itemId);
        if (!item) return;

        const field = target.dataset.itemField;

        const coerceBool = (v) => {
          if (v === true) return true;
          if (v === false) return false;
          const s = String(v ?? "").trim().toLowerCase();
          if (["1", "true", "yes", "y", "on"].includes(s)) return true;
          if (["0", "false", "no", "n", "off", ""].includes(s)) return false;
          return false;
        };

        let value;
        const wantsBool = String(target.dataset?.bool ?? "").trim().toLowerCase() === "true";

        if (target instanceof HTMLInputElement && target.type === "checkbox") {
          value = target.checked === true;
        } else if (wantsBool) {
          value = coerceBool(target.value);
        } else {
          value = target.value;

          if (target instanceof HTMLInputElement && target.type === "number") {
            const n = Number(value);
            value = Number.isFinite(n) ? n : 0;
          }
        }

        if (field === "system.quantity" && typeof value === "number" && value <= 0) {
          await item.delete();
          sheet.render(false);
          return;
        }

        if (field === "name") {
          await item.update({ name: String(value ?? "") });
          return;
        }

        await item.update({ [field]: value });

        if (field === "system.equipped" || field === "system.readied" || field === "system.quantity") {
          sheet.render(false);
        }

        return;
      }

      // Misc Items (actor-data) — lightweight only: quantity + rank
      if (
        (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
        target.dataset?.miscKey &&
        target.dataset?.miscField
      ) {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();

        const field = String(target.dataset.miscField ?? "").trim();
        const key = String(target.dataset.miscKey ?? "").trim();

        let value;

        if (field === "quantity") {
          const n = Number(target.value);
          value = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
        } else if (field === "rank") {
          value = String(target.value ?? "").trim();
        } else {
          // Ignore any stray legacy fields the DOM might still contain
          return;
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
        }
      }
    },
    { signal, capture: false }
  );

  /* ----------------------- */
  /* Click handler           */
  /* ----------------------- */
  root.addEventListener(
    "click",
    async (ev) => {
      const btn = ev.target?.closest?.("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;

      const allowed = new Set([
        // misc inventory
        "misc-add-row",
        "remove-misc-qty",
        "remove-misc-item",

        "add-specialty",
        "add-affinity",
        "remove-affinity",
        "add-aptitude",
        "remove-aptitude",
        "add-resistance",
        "remove-resistance",
        "lock-choices",

        "open-item",
        "delete-item",
        "create-talent"
      ]);

      if (!allowed.has(action)) return;

      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();

      switch (action) {
        case "misc-add-row": {
          const keySel = root.querySelector('select[data-misc-add-field="key"]');
          const qtyInput = root.querySelector('input[data-misc-add-field="qty"]');

          const key = String(keySel?.value ?? "").trim();

          const qtyNum = Number(qtyInput?.value ?? 1);
          const qty = Number.isFinite(qtyNum) ? Math.max(0, Math.floor(qtyNum)) : 0;

          if (!key || qty <= 0) return;

          await addMiscByKey(sheet, { key, quantity: qty });

          if (qtyInput) qtyInput.value = "1";
          if (keySel) keySel.value = "";

          sheet.render(false);
          return;
        }

        case "remove-misc-qty": {
          const key = String(btn.dataset.key ?? btn.getAttribute("data-key") ?? "").trim();
          if (!key) return;

          const currentQty = Number(sheet.document?.system?.treasures?.miscItems?.[key]?.quantity ?? 0);
          const safeCurrentQty = Number.isFinite(currentQty) ? currentQty : 0;

          const content = `
            <form class="hwfwm-misc-removeqty-dialog">
              <div class="form-group">
                <label>Remove how many?</label>
                <input type="number" name="qty" min="0" step="1" value="1" />
                <p class="notes">Current quantity: ${safeCurrentQty}</p>
              </div>
            </form>
          `;

          new Dialog(
            {
              title: "Remove Quantity",
              content,
              buttons: {
                remove: {
                  label: "Remove",
                  callback: async (html) => {
                    const form = html?.[0]?.querySelector?.("form.hwfwm-misc-removeqty-dialog");
                    const raw = form?.querySelector?.('input[name="qty"]')?.value ?? "1";
                    const n = Number(raw);
                    const qtyToRemove = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;

                    if (qtyToRemove <= 0) return;

                    await removeMiscQuantity(sheet, { key, quantity: qtyToRemove });
                    sheet.render(false);
                  }
                },
                cancel: { label: "Cancel" }
              },
              default: "remove"
            },
            { width: 360 }
          ).render(true);

          return;
        }

        case "remove-misc-item": {
          const key = btn.dataset.key ?? btn.getAttribute("data-key");
          await removeMiscByKey(sheet, key);
          sheet.render(false);
          return;
        }

        case "add-specialty":
          return addSelectedSpecialty(sheet);

        case "add-affinity":
          return addSelectedAffinity(sheet);

        case "remove-affinity": {
          const key = btn.dataset.key ?? btn.getAttribute("data-key");
          return removeAffinity(sheet, key);
        }

        case "add-aptitude":
          return addSelectedAptitude(sheet);

        case "remove-aptitude": {
          const key = btn.dataset.key ?? btn.getAttribute("data-key");
          return removeAptitude(sheet, key);
        }

        case "add-resistance":
          return addSelectedResistance(sheet);

        case "remove-resistance": {
          const key = btn.dataset.key ?? btn.getAttribute("data-key");
          return removeResistance(sheet, key);
        }

        case "lock-choices":
          return lockChoices(sheet);

        case "open-item": {
          const id = btn.dataset.itemId ?? btn.getAttribute("data-item-id");
          const item = id ? sheet.document?.items?.get(id) : null;
          if (item?.sheet) item.sheet.render(true);
          return;
        }

        case "delete-item": {
          const id = btn.dataset.itemId ?? btn.getAttribute("data-item-id");
          const item = id ? sheet.document?.items?.get(id) : null;
          if (item) await item.delete();
          sheet.render(false);
          return;
        }

        case "create-talent":
          await sheet.document?.createEmbeddedDocuments?.("Item", [{ name: "New Talent", type: "talent" }]);
          sheet.render(false);
          return;

        default:
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
