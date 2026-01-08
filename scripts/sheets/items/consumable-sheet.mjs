// scripts/sheets/items/consumable-sheet.mjs

/**
 * HWFWM Consumable Item Sheet (placeholder baseline)
 * - Minimal form: quantity, readied, notes, and use-effect placeholder
 * - No mechanics wiring yet.
 */
export class HwfwmConsumableSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "consumable"],
      width: 560,
      height: 540,
      resizable: true
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/consumable-sheet.hbs";
  }

  /** @override */
  async getData(options = {}) {
    const data = await super.getData(options);

    data.readiedOptions = [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" }
    ];

    return data;
  }
}
