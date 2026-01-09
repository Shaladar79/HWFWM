// scripts/sheets/items/miscitem-sheet.mjs

/**
 * HWFWM Misc Item Sheet (baseline placeholder)
 * - Simple sheet for catalogKey + quantity + notes
 * - No compendium lookups or actor wiring yet
 */
export class HwfwmMiscItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "miscItem"],
      width: 560,
      height: 520,
      resizable: true
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/miscitem-sheet.hbs";
  }

  /** @override */
  async getData(options = {}) {
    const data = await super.getData(options);

    // Optional: if you later want to provide a dropdown from CONFIG,
    // you can populate data.miscCatalog here.
    // For now we keep it manual and stable.
    data.miscCatalog = CONFIG["hwfwm-system"]?.miscItemCatalog ?? null;

    return data;
  }
}
