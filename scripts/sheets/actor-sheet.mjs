const { HandlebarsApplicationMixin } = foundry.applications.api;

export class HwfwmActorSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    tag: "form", // make the application root a <form> so V2 form handling works
    classes: ["hwfwm-system", "sheet", "actor", "pc", "hwfwm-sheet"],
    position: { width: 700, height: 500 },
    form: {
      submitOnChange: true, // autosave on dropdown change
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/actor/actor-sheet.hbs"
    }
  };

  /**
   * Track the currently active tab so autosave re-renders
   * do not reset the sheet back to Overview.
   * @private
   */
  _activeTab = "overview";

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const cfg = CONFIG["hwfwm-system"] ?? {};

    const roles = cfg.roles ?? {};
    const roleOrder = cfg.roleOrder ?? Object.keys(roles);

    const ranks = cfg.ranks ?? {};
    const rankOrder = cfg.rankOrder ?? Object.keys(ranks);

    const races = cfg.races ?? {};
    const raceOrder = cfg.raceOrder ?? Object.keys(races);

    const backgrounds = cfg.backgrounds ?? {};
    const backgroundOrder = cfg.backgroundOrder ?? Object.keys(backgrounds);

    context.roleOptions = roleOrder.map((k) => ({ value: k, label: roles[k] ?? k }));
    context.rankOptions = rankOrder.map((k) => ({ value: k, label: ranks[k] ?? k }));
    context.raceOptions = raceOrder.map((k) => ({ value: k, label: races[k] ?? k }));
    context.backgroundOptions = backgroundOrder.map((k) => ({ value: k, label: backgrounds[k] ?? k }));

    const details = this.document?.system?.details ?? {};
    context.details = {
      roleKey: details.roleKey ?? "",
      rankKey: details.rankKey ?? "",
      raceKey: details.raceKey ?? "",
      backgroundKey: details.backgroundKey ?? ""
    };

    return context;
  }

  /**
   * Minimal V2-safe tabs.
   * Requires:
   * - nav:    .hwfwm-tabs[data-group="primary"] with links .hwfwm-tab[data-tab]
   * - panels: .tab[data-group="primary"][data-tab="..."]
   */
  _onRender(...args) {
    super._onRender(...args);

    // In ApplicationV2 + PARTS, `this.element` may be an HTMLElement OR a collection.
    // Normalize to a single root HTMLElement.
    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    // Some mixins/compat layers expose a jQuery-like collection with [0]
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];

    if (!(root instanceof HTMLElement)) return;

    const nav = root.querySelector('.hwfwm-tabs[data-group="primary"]');
    if (!nav) return;

    const panels = Array.from(root.querySelectorAll('.tab[data-group="primary"][data-tab]'));
    const links = Array.from(nav.querySelectorAll('.hwfwm-tab[data-tab]'));

    if (!panels.length || !links.length) return;

    const activate = (tabName) => {
      // Persist active tab across autosave re-renders
      this._activeTab = tabName;

      for (const p of panels) {
        const isActive = p.dataset.tab === tabName;
        p.classList.toggle("is-active", isActive);
        // Force visibility regardless of theme CSS defaults
        p.style.display = isActive ? "" : "none";
      }

      for (const a of links) {
        a.classList.toggle("is-active", a.dataset.tab === tabName);
      }
    };

    // Use persisted tab, defaulting to overview
    const initial = this._activeTab || "overview";
    activate(initial);

    nav.addEventListener("click", (ev) => {
      const a = ev.target.closest(".hwfwm-tab[data-tab]");
      if (!a) return;
      ev.preventDefault();
      activate(a.dataset.tab);
    });
  }
}
