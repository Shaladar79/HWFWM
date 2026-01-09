// scripts/sheets/items/miscitem-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Misc Item Sheet (V13 Sheet V2)
 * - Simple sheet for catalogKey + quantity + notes
 * - No compendium lookups or actor wiring yet
 */
export class HwfwmMiscItemSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "miscItem"],
    position: { width: 560, height: 520 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/miscitem-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    context.item = this.document;
    context.system = this.document.system;

    // Optional: later you can provide a dropdown from CONFIG
    context.miscCatalog = CONFIG["hwfwm-system"]?.miscItemCatalog ?? null;

    return context;
  }
}
