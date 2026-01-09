// scripts/sheets/items/feature-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Feature Item Sheet (V13 Sheet V2)
 * - Uses ItemSheetV2 + HandlebarsApplicationMixin
 * - Uses DocumentSheetV2 form handling so fields persist correctly
 */
export class HwfwmFeatureSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "feature"],
    position: { width: 560, height: 520 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/feature-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Normalize common aliases so templates can use {{item}} and {{system}}
    // (many v1 templates were written that way)
    context.item = this.document;
    context.system = this.document.system;

    // Provide stable option lists for template dropdowns
    context.featureSources = [
      { value: "manual", label: "Manual" },
      { value: "race", label: "Race" },
      { value: "role", label: "Role" },
      { value: "background", label: "Background" },
      { value: "rank", label: "Rank" },
      { value: "system", label: "System" }
    ];

    context.activationTypes = [
      { value: "passive", label: "Passive" },
      { value: "active", label: "Active" }
    ];

    context.featureCategories = [
      { value: "", label: "—" },
      { value: "racial", label: "Racial" },
      { value: "role", label: "Role" },
      { value: "background", label: "Background" },
      { value: "general", label: "General" }
    ];

    return context;
  }
}
