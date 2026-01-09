// scripts/sheets/items/equipment-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Equipment Item Sheet (V13 Sheet V2)
 * - Supports a "type" dropdown: weapon | armor | misc
 * - Template conditionally displays placeholder sections based on type
 * - No mechanics wiring yet (stats are placeholders only)
 */
export class HwfwmEquipmentSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "equipment"],
    position: { width: 640, height: 620 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/equipment-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Normalize common aliases so templates can use {{item}} and {{system}}
    context.item = this.document;
    context.system = this.document.system;

    context.equipmentTypes = [
      { value: "weapon", label: "Weapon" },
      { value: "armor", label: "Armor" },
      { value: "misc", label: "Misc" }
    ];

    const type = (context.system?.type ?? context.system?.category ?? "weapon").toString();
    context._ui = {
      type,
      isWeapon: type === "weapon",
      isArmor: type === "armor",
      isMisc: type === "misc"
    };

    return context;
  }
}
