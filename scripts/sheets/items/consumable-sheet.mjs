// scripts/sheets/items/consumable-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Consumable Item Sheet (V13 Sheet V2)
 * - Minimal form: quantity, readied, notes, and use-effect placeholder
 * - No mechanics wiring yet.
 */
export class HwfwmConsumableSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "consumable"],
    position: { width: 560, height: 540 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/consumable-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item = this.document;
    context.system = this.document.system;

    context.readiedOptions = [
      { value: "no", label: "No" },
      { value: "yes", label: "Yes" }
    ];

    return context;
  }
}
