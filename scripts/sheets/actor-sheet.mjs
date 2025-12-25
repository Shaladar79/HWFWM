export class HwfwmActorSheet extends foundry.applications.sheets.ActorSheetV2 {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(
    super.DEFAULT_OPTIONS,
    {
      classes: ["hwfwm-system", "sheet", "actor", "pc"],
      position: { width: 700, height: 500 }
    }
  );

  /** @override */
  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/actor/actor-sheet.hbs"
    }
  };

  /** @override */
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
}
