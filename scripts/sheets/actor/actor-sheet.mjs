// scripts/sheets/actor-sheet.mjs
// Orchestrator for the Actor Sheet. Uses split modules in ./actor/*

const { HandlebarsApplicationMixin } = foundry.applications.api;

// Use NORMAL named imports (no "import * as X")
import { buildActorSheetContext } from "./actor/context.mjs";
import { bindActorSheetListeners } from "./actor/listeners.mjs";

export class HwfwmActorSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    tag: "form",
    classes: ["hwfwm-system", "sheet", "actor", "pc", "hwfwm-sheet"],
    position: { width: 875, height: 500 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/actor/actor-sheet.hbs"
    }
  };

  _activeTab = "overview";
  _activeSubTabs = { traits: "enhancements", essence: null, treasures: null };

  // AbortController used to ensure we never stack handlers after rerenders
  _domController = null;

  async _prepareContext(options) {
    // Delegate to split context builder
    if (typeof buildActorSheetContext === "function") {
      return await buildActorSheetContext(this, options);
    }

    // Fallback (should not happen once split files exist)
    return await super._prepareContext(options);
  }

  _onRender(...args) {
    super._onRender(...args);

    // Normalize root element across Foundry wrapper types
    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    // Kill old DOM listeners and rebind to the new root
    if (this._domController) this._domController.abort();
    this._domController = new AbortController();

    // Bind ALL listeners (tabs + change + click) from the split module
    if (typeof bindActorSheetListeners === "function") {
      bindActorSheetListeners(this, root, this._domController);
    }
  }
}
