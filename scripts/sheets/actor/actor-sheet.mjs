// scripts/sheets/actor-sheet.mjs

// IMPORTANT: In ES modules, all imports must be first.
import { buildActorSheetContext } from "./actor/context.mjs";
import { bindActorSheetListeners } from "./actor/listeners.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

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

  /**
   * AbortController used to ensure we never stack handlers,
   * and that handlers are always rebound to the latest root after rerender.
   */
  _domController = null;

  async _prepareContext(options) {
    // Delegate ALL context building to the split module.
    // Your module already calls the parent _prepareContext internally.
    return await buildActorSheetContext(this, options);
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

    // Delegate event wiring to the split listeners module
    bindActorSheetListeners(this, root, this._domController);
  }
}
