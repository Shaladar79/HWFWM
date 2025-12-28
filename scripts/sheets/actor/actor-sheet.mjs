// scripts/sheets/actor/actor-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

import { prepareActorContext } from "./context.mjs";
import { prepareEssenceContext } from "./essence.mjs";
import { prepareTreasuresMiscContext } from "./treasures-misc.mjs";
import { bindActorSheetListeners } from "./listeners.mjs";

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
  _domController = null;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.system = this.document?.system ?? context.system ?? {};
    context.config = CONFIG["hwfwm-system"] ?? {};

    if (typeof prepareActorContext === "function") {
      await prepareActorContext({ sheet: this, actor: this.document, context, options });
    }
    if (typeof prepareTreasuresMiscContext === "function") {
      await prepareTreasuresMiscContext({ sheet: this, actor: this.document, context });
    }
    if (typeof prepareEssenceContext === "function") {
      await prepareEssenceContext({ sheet: this, actor: this.document, context });
    }

    return context;
  }

  _onRender(...args) {
    super._onRender(...args);

    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    if (this._domController) this._domController.abort();
    this._domController = new AbortController();

    // Your listeners file expects (sheet, root, controller)
    bindActorSheetListeners(this, root, this._domController);
  }
}
