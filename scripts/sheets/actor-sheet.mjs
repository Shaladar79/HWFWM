const { HandlebarsApplicationMixin } = foundry.applications.api;

export class HwfwmActorSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "actor", "pc", "hwfwm-sheet"],
    position: { width: 700, height: 500 }
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

    context.roleOptions = roleOrder.map((k) => ({ value: k, label: roles[k] ?? k }));
    context.rankOptions = rankOrder.map((k) => ({ value: k, label: ranks[k] ?? k }));
    context.raceOptions = raceOrder.map((k) => ({ value: k, label: races[k] ?? k }));

    const details = this.document?.system?.details ?? {};
    context.details = {
      roleKey: details.roleKey ?? "",
      rankKey: details.rankKey ?? "",
      raceKey: details.raceKey ?? ""
    };

    return context;
  }

  /** After render, wire up change handlers so fields save. */
  _onRender(...args) {
    super._onRender(...args);

    // The V2 sheet renders inside this.element
    const root = this.element;
    if (!root) return;

    const form = root.querySelector("form");
    if (!form) return;

    // Save on any change to inputs/selects
    form.addEventListener("change", async (event) => {
      const el = event.target;
      if (!(el instanceof HTMLElement)) return;

      // Only react to fields that have a name attribute
      if (!el.getAttribute("name")) return;

      await this._updateFromForm(form);
    });

    // Prevent default submit behavior; save through update
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      await this._updateFromForm(form);
    });
  }

  async _updateFromForm(form) {
    // Expand to object form, e.g. { system: { details: { roleKey: "..." } } }
    const fd = new FormData(form);
    const data = foundry.utils.expandObject(Object.fromEntries(fd.entries()));

    // Update the underlying Actor document
    await this.document.update(data);
  }
}
