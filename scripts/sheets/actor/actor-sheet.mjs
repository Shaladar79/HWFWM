// scripts/sheets/actor/actor-sheet.mjs

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

  // RESTORED: used by essence.mjs via sheet.constructor.ESSENCE_ATTRS
  static ESSENCE_ATTRS = ["power", "speed", "spirit", "recovery"];

  _activeTab = "overview";
  _activeSubTabs = { traits: "enhancements", essence: null, treasures: null };
  _domController = null;

  async _prepareContext(options) {
    // IMPORTANT: call super here (this is the only safe place to do it)
    const baseContext = await super._prepareContext(options);

    // Delegate all enrichment to the split module
    return await buildActorSheetContext(this, baseContext, options);
  }

  _onRender(...args) {
    super._onRender(...args);

    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    if (this._domController) this._domController.abort();
    this._domController = new AbortController();

    bindActorSheetListeners(this, root, this._domController);
  }
}
