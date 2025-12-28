// scripts/sheets/actor-sheet.mjs
//
// Actor sheet orchestrator.
// Loads split modules from scripts/sheets/actor/*.mjs and delegates to them
// WITHOUT using namespace "import * as X" imports (which make debugging harder).
//
// IMPORTANT: We intentionally use dynamic imports + caching so that
// 1) A missing/renamed export won't hard-crash the whole sheet
// 2) You can refactor split modules incrementally without breaking the UI

const { HandlebarsApplicationMixin } = foundry.applications.api;

// ------------------------------------------------------------
// Module loader (cached)
// ------------------------------------------------------------
const _moduleCache = new Map();

/**
 * Safely import a module once and cache it.
 * Returns null if the module fails to load.
 */
async function loadModule(path) {
  if (_moduleCache.has(path)) return _moduleCache.get(path);
  try {
    const mod = await import(path);
    _moduleCache.set(path, mod);
    return mod;
  } catch (err) {
    console.error(`HWFWM | Failed to load module: ${path}`, err);
    _moduleCache.set(path, null);
    return null;
  }
}

/**
 * Call the first function that exists on the module from the provided list.
 */
async function callFirst(mod, fnNames, args) {
  if (!mod) return false;
  for (const name of fnNames) {
    if (typeof mod?.[name] === "function") {
      await mod[name](args);
      return true;
    }
  }
  return false;
}

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

  /**
   * AbortController used to ensure we never stack handlers,
   * and that handlers are always rebound to the latest root after rerender.
   */
  _domController = null;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Always bind the live actor system + config
    context.system = this.document?.system ?? context.system ?? {};
    context.config = CONFIG["hwfwm-system"] ?? {};

    // Load modules (cached)
    const Ctx = await loadModule("./actor/context.mjs");
    const TreasuresMisc = await loadModule("./actor/treasures-misc.mjs");
    const Essence = await loadModule("./actor/essence.mjs");

    // Context delegation (supports multiple naming conventions)
    await callFirst(Ctx, ["prepareActorContext", "prepareContext", "prepareActorSheetContext"], {
      sheet: this,
      actor: this.document,
      context,
      options
    });

    await callFirst(TreasuresMisc, ["prepareTreasuresMiscContext", "prepareTreasuresMiscContext"], {
      sheet: this,
      actor: this.document,
      context
    });

    await callFirst(Essence, ["prepareEssenceContext", "prepareEssenceUIContext"], {
      sheet: this,
      actor: this.document,
      context
    });

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
    const controller = this._domController;

    // Bind listeners via split module (preferred)
    // This is the cleanest: one module owns ALL event wiring.
    (async () => {
      const Listeners = await loadModule("./actor/listeners.mjs");
      const Tabs = await loadModule("./actor/tabs.mjs");

      // Tabs: support a couple possible shapes
      // - bindActorSheetListeners may already call activateTabGroup internally (best)
      // - otherwise allow a separate tabs binder if you have one
      await callFirst(Tabs, ["activateTabs", "bindTabs"], {
        sheet: this,
        root,
        signal: controller.signal
      });

      // Listeners: support both your earlier naming and the later refactor naming
      const bound = await callFirst(Listeners, ["bindActorSheetListeners", "bindListeners"], {
        sheet: this,
        root,
        controller
      });

      // If nothing bound, do nothing (avoid double-binding).
      if (!bound) return;
    })();
  }
}
