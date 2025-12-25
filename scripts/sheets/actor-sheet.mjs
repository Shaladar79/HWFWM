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
    context.backgroundOptions = backgroundOrder.map(k => ({ value: k, label: backgrounds[k] ?? k }));

    const details = this.document?.system?.details ?? {};
    context.details = {
      roleKey: details.roleKey ?? "",
      rankKey: details.rankKey ?? "",
      raceKey: details.raceKey ?? ""
    };

    return context;
  }

  /**
   * Minimal V2-safe tabs.
   * Requires:
   * - nav:  .hwfwm-tabs[data-group="primary"] with links .hwfwm-tab[data-tab]
   * - panels: .tab[data-group="primary"][data-tab="..."]
   */
  _onRender(...args) {
    super._onRender(...args);

    const root = this.element;
    if (!root) return;

    const nav = root.querySelector('.hwfwm-tabs[data-group="primary"]');
    if (!nav) return;

    const panels = Array.from(root.querySelectorAll('.tab[data-group="primary"]'));
    const links = Array.from(nav.querySelectorAll(".hwfwm-tab[data-tab]"));

    const activate = (tabName) => {
      for (const p of panels) {
        p.style.display = p.dataset.tab === tabName ? "" : "none";
      }
      for (const a of links) {
        a.classList.toggle("is-active", a.dataset.tab === tabName);
      }
    };

    // Determine initial tab (default to overview)
    const initial =
      links.find((a) => a.classList.contains("is-active"))?.dataset.tab ||
      links[0]?.dataset.tab ||
      "overview";

    activate(initial);

    nav.addEventListener("click", (ev) => {
      const a = ev.target.closest(".hwfwm-tab[data-tab]");
      if (!a) return;
      ev.preventDefault();
      activate(a.dataset.tab);
    });
  }
}
