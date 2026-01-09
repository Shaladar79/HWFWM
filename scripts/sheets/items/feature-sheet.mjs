// scripts/sheets/items/feature-sheet.mjs

/**
 * HWFWM Feature Item Sheet (baseline)
 * - Minimal, stable form sheet for Feature items
 * - No mechanics hooks beyond exposing options to the template
 */
export class HwfwmFeatureSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "feature"],
      width: 560,
      height: 520,
      resizable: true,

      // IMPORTANT: ensure form fields persist to the Item document
      submitOnChange: true,
      closeOnSubmit: false

      // If you later add internal tabs inside the item sheet, add tabs[] here.
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/feature-sheet.hbs";
  }

  /** @override */
  async getData(options = {}) {
    const data = await super.getData(options);

    // Provide stable option lists for template dropdowns
    data.featureSources = [
      { value: "manual", label: "Manual" },
      { value: "race", label: "Race" },
      { value: "role", label: "Role" },
      { value: "background", label: "Background" },
      { value: "rank", label: "Rank" },
      { value: "system", label: "System" }
    ];

    data.activationTypes = [
      { value: "passive", label: "Passive" },
      { value: "active", label: "Active" }
    ];

    // Optional: light “category” scaffold (safe even if template ignores it)
    data.featureCategories = [
      { value: "", label: "—" },
      { value: "racial", label: "Racial" },
      { value: "role", label: "Role" },
      { value: "background", label: "Background" },
      { value: "general", label: "General" }
    ];

    return data;
  }
}
