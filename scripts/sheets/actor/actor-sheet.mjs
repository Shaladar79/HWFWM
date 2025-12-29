// scripts/sheets/actor/actor-sheet.mjs
// Orchestrator for the split actor sheet modules.

// IMPORTANT: this file lives in scripts/sheets/actor/
// so sibling imports are "./context.mjs" not "./actor/context.mjs"

import { buildActorSheetContext } from "./context.mjs";
import { bindActorSheetListeners } from "./listeners.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class HwfwmActorSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    tag: "form",
    classes: ["hwfwm-system", "sheet", "actor", "pc", "hwfwm-sheet"],
    position: { width: 875, height: 500 },
    form: { submitOnChange: true, closeOnSubmit: false }
  });

  static PARTS = {
    form: { template: "systems/hwfwm-system/templates/actor/actor-sheet.hbs" }
  };

  _activeTab = "overview";
  _activeSubTabs = { traits: "enhancements", essence: null, treasures: null };

  /** AbortController used to prevent stacked handlers after rerender */
  _domController = null;

  async _prepareContext(options) {
    // Delegate all context building to the split module (which internally calls super)
    return await buildActorSheetContext(this, options);
  }

  _onRender(...args) {
    super._onRender(...args);

    // Normalize root element across Foundry wrapper types
    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    // Rebind listeners on every render safely
    if (this._domController) this._domController.abort();
    this._domController = new AbortController();

    // Bind all DOM listeners (includes tab activation)
    bindActorSheetListeners(this, root, this._domController);
  }
}
