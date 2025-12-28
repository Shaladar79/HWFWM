// scripts/sheets/actor-sheet.mjs

// NOTE: In ES modules, ALL imports must come before any other code.
// This file is the "orchestrator" for the actor sheet and delegates to
// scripts/sheets/actor/*.mjs modules when those modules expose functions.

import * as Ctx from "./actor/context.mjs";
import * as Tabs from "./actor/tabs.mjs";
import * as Listeners from "./actor/listeners.mjs";
import * as Essence from "./actor/essence.mjs";
import * as TreasuresMisc from "./actor/treasures-misc.mjs";

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
    // Base Foundry context
    const context = await super._prepareContext(options);

    // Always bind the live actor system onto context.system
    context.system = this.document?.system ?? context.system ?? {};
    context.config = CONFIG["hwfwm-system"] ?? {};

    // Delegate to your split context builder if present
    // Expected (optional) signature:
    //   prepareActorContext({ sheet, actor, context, options })
    if (typeof Ctx.prepareActorContext === "function") {
      await Ctx.prepareActorContext({
        sheet: this,
        actor: this.document,
        context,
        options
      });
    } else if (typeof Ctx.prepareContext === "function") {
      // fallback common naming
      await Ctx.prepareContext({
        sheet: this,
        actor: this.document,
        context,
        options
      });
    }

    // Delegate misc catalog / misc rows prep if present
    // Expected (optional) signature:
    //   prepareTreasuresMiscContext({ sheet, actor, context })
    if (typeof TreasuresMisc.prepareTreasuresMiscContext === "function") {
      await TreasuresMisc.prepareTreasuresMiscContext({
        sheet: this,
        actor: this.document,
        context
      });
    }

    // Delegate essence UI prep if present
    // Expected (optional) signature:
    //   prepareEssenceContext({ sheet, actor, context })
    if (typeof Essence.prepareEssenceContext === "function") {
      await Essence.prepareEssenceContext({
        sheet: this,
        actor: this.document,
        context
      });
    }

    return context;
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
    const { signal } = this._domController;

    // Delegate tab activation to split module if present
    // Expected (optional) signature:
    //   activateTabs({ sheet, root, signal })
    if (typeof Tabs.activateTabs === "function") {
      Tabs.activateTabs({ sheet: this, root, signal });
    } else if (typeof Tabs.bindTabs === "function") {
      Tabs.bindTabs({ sheet: this, root, signal });
    } else {
      // If you do not have a tabs module implementation loaded,
      // do nothing here; sheet will still render.
    }

    // Delegate listeners wiring to split module if present
    // Expected (optional) signature:
    //   bindListeners({ sheet, root, signal })
    if (typeof Listeners.bindListeners === "function") {
      Listeners.bindListeners({ sheet: this, root, signal });
      return; // listeners module fully owns event wiring
    }

    // If your listeners module is not providing a binder yet,
    // we still bind nothing here to avoid double-binding or conflicts.
  }
}
