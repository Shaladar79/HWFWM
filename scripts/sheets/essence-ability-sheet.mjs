export class HwfwmEssenceAbilitySheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "essence-ability"],
      width: 520,
      height: 520
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/essence-ability-sheet.hbs";
  }

  async getData(options = {}) {
    const data = await super.getData(options);

    // Make sure templates can reliably use `system.*`
    data.system = this.item?.system ?? {};

    // Inject config catalogs for dropdowns
    const cfg = CONFIG["hwfwm-system"] ?? {};
    data.essenceCatalog = cfg.essenceCatalog ?? {};
    data.confluenceEssenceCatalog = cfg.confluenceEssenceCatalog ?? {};

    return data;
  }
}
