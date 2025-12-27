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
}
