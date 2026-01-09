// scripts/sheets/items/ability-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Ability Item Sheet (V13 Sheet V2)
 * - Ability is a generic item type that can represent:
 *   - racial abilities
 *   - role abilities
 *   - essence abilities
 * - Minimal, stable UI scaffolding; mechanics wiring comes later.
 */
export class HwfwmAbilitySheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "ability"],
    position: { width: 620, height: 580 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/ability-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Normalize common aliases so templates can use {{item}} and {{system}}
    context.item = this.document;
    context.system = this.document.system;

    context.abilityTypeOptions = [
      { value: "racial", label: "Racial" },
      { value: "role", label: "Role" },
      { value: "essence", label: "Essence" }
    ];

    return context;
  }
}
