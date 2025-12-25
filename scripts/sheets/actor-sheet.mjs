const BaseActorSheet = foundry.appv1?.sheets?.ActorSheet ?? ActorSheet;

export class HwfwmActorSheet extends BaseActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "actor"],
      width: 700,
      height: 500,
      resizable: true
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/actor/actor-sheet.hbs";
  }

  async getData(options = {}) {
    const data = await super.getData(options);

    const cfg = CONFIG["hwfwm-system"] ?? {};

    const roles = cfg.roles ?? {};
    const roleOrder = cfg.roleOrder ?? Object.keys(roles);

    const ranks = cfg.ranks ?? {};
    const rankOrder = cfg.rankOrder ?? Object.keys(ranks);

    const races = cfg.races ?? {};
    const raceOrder = cfg.raceOrder ?? Object.keys(races);

    // Build ordered arrays so the dropdown order is deterministic
    data.roleOptions = roleOrder.map((k) => ({ value: k, label: roles[k] ?? k }));
    data.rankOptions = rankOrder.map((k) => ({ value: k, label: ranks[k] ?? k }));
    data.raceOptions = raceOrder.map((k) => ({ value: k, label: races[k] ?? k }));

    // Safe defaults (template.json not yet in use)
    const details = data.actor.system?.details ?? {};
    data.details = {
      roleKey: details.roleKey ?? "",
      rankKey: details.rankKey ?? "",
      raceKey: details.raceKey ?? ""
    };

    return data;
  }
}
