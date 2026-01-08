// scripts/sheets/actor/listeners.mjs

import { activateTabGroup } from "./tabs.mjs";
import { handleEssenceSelectChange } from "./essence.mjs";
import { openAddMiscDialog, removeMiscByKey, updateMiscField } from "./treasures-misc.mjs";

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

  // One-time sync on render/bind
  const details = sheet.document?.system?.details ?? {};
  const initialBgKey = details.backgroundKey ?? "";
  const initialRaceKey = details.raceKey ?? "";
  const initialRoleKey = details.roleKey ?? "";

  // ------------------------------------------------------------
  // Background: stamp-based initial sync (mirrors race/role pattern)
  // ------------------------------------------------------------
  const bgStamp = sheet.document?.system?._flags?.backgroundGrantStamp ?? "";

  // If stamp differs, reconcile from old->new deterministically.
  // Otherwise, just ensure grants exist + prompt choice if needed.
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

  // Race: IMPORTANT - do NOT re-run every bind/render.
  // Only run if we have a raceKey AND the completed stamp doesn't match.
  const raceStamp = sheet.document?.system?._flags?.raceGrantStamp ?? "";
  if (initialRaceKey && raceStamp !== initialRaceKey) {
    replaceRaceGrants(sheet, initialRaceKey);
  }

  // Role: do NOT re-run every bind/render.
  // Only run if we have a roleKey AND the completed stamp doesn't match.
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

  /* ----------------------- */
  /* Change handler (CAPTURE) */
  /* ----------------------- */
  // We intercept background changes early so we can capture the OLD key before submitOnChange mutates the actor.
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

        // Persist the new backgroundKey ourselves (since we stopped propagation)
        await actor.update({
          "system.details.backgroundKey": newKey,
          "system._flags.backgroundGrantStamp": newKey
        });

        // Cleanup old grants and apply new ones
        await replaceBackgroundSpecialties(sheet, newKey, oldKey);
        return;
      }
    },
    { signal, capture: true }
  );

  /* ----------------------- */
  /* Change handler          */
  /* ----------------------- */
  // IMPORTANT: capture false so Foundry’s submitOnChange remains intact for normal fields.
  root.addEventListener(
    "change",
    async (ev) => {
      const target = ev.target;

      // Race change (always replace on explicit change)
      if (target instanceof HTMLSelectElement && target.name === "system.details.raceKey") {
        await replaceRaceGrants(sheet, target.value);
        return;
      }

      // Role change (always replace on explicit change)
      if (target instanceof HTMLSelectElement && target.name === "system.details.roleKey") {
        await replaceRoleGrantedSpecialties(sheet, target.value);
        return;
      }

      // Embedded Item inline edits
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

        let value = target.value;
        if (target instanceof HTMLInputElement && target.type === "number") {
          const n = Number(value);
          value = Number.isFinite(n) ? n : 0;
        }

        if (field === "system.quantity" && typeof value === "number" && value <= 0) {
          await item.delete();
          return;
        }

        if (field === "name") {
          await item.update({ name: String(value ?? "") });
          return;
        }

        await item.update({ [field]: value });
        return;
      }

      // Misc inline edits
      if (
        (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
        target.dataset?.miscKey &&
        target.dataset?.miscField
      ) {
        ev.preventDefault?.();
        ev.stopPropagation?.();
        ev.stopImmediatePropagation?.();

        let value = target.value;
        if (target instanceof HTMLInputElement && target.type === "number") {
          const n = Number(value);
          value = Number.isFinite(n) ? n : 0;
        }

        await updateMiscField(sheet, {
          key: target.dataset.miscKey,
          field: target.dataset.miscField,
          value
        });
        return;
      }

      // Essence enforcement
      if (target instanceof HTMLSelectElement) {
        const handled = await handleEssenceSelectChange(sheet, target);
        if (handled) {
          ev.preventDefault?.();
          ev.stopPropagation?.();
          ev.stopImmediatePropagation?.();
        }
      }

      // Otherwise: let Foundry handle normal actor fields.
    },
    { signal, capture: false }
  );

  /* ----------------------- */
  /* Click handler           */
  /* ----------------------- */
  // capture true so we reliably intercept our action buttons
  root.addEventListener(
    "click",
    async (ev) => {
      const btn = ev.target?.closest?.("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;

      // Only intercept actions we own (avoid Foundry window chrome collisions)
      const allowed = new Set([
        "add-misc-item",
        "remove-misc-item",
        "add-specialty",
        "add-affinity",
        "remove-affinity",
        "add-aptitude",
        "remove-aptitude",
        "add-resistance",
        "remove-resistance",
        "lock-choices",

        // NEW: item list actions used by Traits > Features template
        "open-item",
        "delete-item",
        "create-talent"
      ]);

      if (!allowed.has(action)) return;

      ev.preventDefault?.();
      ev.stopPropagation?.();
      ev.stopImmediatePropagation?.();

      switch (action) {
        case "add-misc-item":
          return openAddMiscDialog(sheet);

        case "remove-misc-item": {
          const key = btn.dataset.key ?? btn.getAttribute("data-key");
          return removeMiscByKey(sheet, key);
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
          return;
        }

        case "create-talent":
          // Creates a basic talent item. You can refine default fields later.
          return sheet.document?.createEmbeddedDocuments?.("Item", [
            { name: "New Talent", type: "talent" }
          ]);

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
