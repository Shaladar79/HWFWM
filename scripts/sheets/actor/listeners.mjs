// scripts/sheets/actor/listeners.mjs

import { activateTabGroup } from "./tabs.mjs";
import { handleEssenceSelectChange } from "./essence.mjs";
import { openAddMiscDialog, removeMiscByKey, updateMiscField } from "./treasures-misc.mjs";

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

  if (arg1 && typeof arg1 === "object" && "sheet" in arg1 && "root" in arg1 && "controller" in arg1) {
    ({ sheet, root, controller } = arg1);
  } else {
    sheet = arg1;
    root = arg2;
    controller = arg3;
  }

  if (!sheet || !root || !controller) return;

  const { signal } = controller;

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
      if (current !== t) sheet.document?.update?.({ "system._ui.treasuresSubTab": t }).catch(() => {});
    },
    signal
  });

  // -----------------------
  // Change handler (capture)
  // -----------------------
  root.addEventListener(
    "change",
    async (ev) => {
      const target = ev.target;

      // ------------------------------------------------
      // Items inline edits (embedded Item documents)
      // ------------------------------------------------
      if (
        (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
        target.dataset?.itemId &&
        target.dataset?.itemField
      ) {
        ev.preventDefault?.();
        ev.stopPropagation();
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

        // All other fields are passed as-is (e.g. "system.category")
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
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();

        const key = target.dataset.miscKey;
        const field = target.dataset.miscField;

        let value = target.value;
        if (target instanceof HTMLInputElement && target.type === "number") {
          const n = Number(value);
          value = Number.isFinite(n) ? n : 0;
        }

        // updateMiscField is where qty<=0 should remove the row
        await updateMiscField(sheet, { key, field, value });
        return;
      }

      // ------------------------------------------------
      // Essence enforcement
      // ------------------------------------------------
      if (target instanceof HTMLSelectElement) {
        const handled = await handleEssenceSelectChange(sheet, target);
        if (handled) {
          ev.preventDefault?.();
          ev.stopPropagation();
          ev.stopImmediatePropagation?.();
        }
      }
    },
    { signal, capture: true }
  );

  // -----------------------
  // Click handler (delegated)
  // -----------------------
  root.addEventListener(
    "click",
    async (ev) => {
      const actionBtn = ev.target.closest("[data-action]");
      if (!actionBtn) return;

      const action = actionBtn.dataset.action;

      // IMPORTANT:
      // Foundry window controls also use data-action (e.g., "close").
      // Only intercept actions that this sheet actually handles.
      const handledActions = new Set(["add-misc-item", "remove-misc-item"]);
      if (!handledActions.has(action)) return;

      ev.preventDefault();
      ev.stopPropagation();
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

      // NOTE: other actions (open-item, delete-item, etc.) can be migrated next.
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
