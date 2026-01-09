// scripts/sheets/items/ability-sheet.mjs

/**
 * HWFWM Ability Item Sheet (baseline placeholder)
 * - Ability is a generic item type that can represent:
 *   - racial abilities
 *   - role abilities
 *   - essence abilities
 * - Minimal, stable UI scaffolding; mechanics wiring comes later.
 */
export class HwfwmAbilitySheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "ability"],
      width: 620,
      height: 580,
      resizable: true,

      // IMPORTANT: ensure form fields persist to the Item document
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/ability-sheet.hbs";
  }

  /** @override */
  async getData(options = {}) {
    const data = await super.getData(options);

    data.abilityTypeOptions = [
      { value: "racial", label: "Racial" },
      { value: "role", label: "Role" },
      { value: "essence", label: "Essence" }
    ];

    return data;
  }
}
