// scripts/sheets/items/equipment-sheet.mjs

/**
 * HWFWM Equipment Item Sheet (placeholder baseline)
 * - Supports a "type" dropdown: weapon | armor | misc
 * - Template conditionally displays placeholder sections based on type
 * - No mechanics wiring yet (stats are placeholders only)
 */
export class HwfwmEquipmentSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "equipment"],
      width: 640,
      height: 620,
      resizable: true,

      // IMPORTANT: ensure form fields persist to the Item document
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/equipment-sheet.hbs";
  }

  /** @override */
  async getData(options = {}) {
    const data = await super.getData(options);

    data.equipmentTypes = [
      { value: "weapon", label: "Weapon" },
      { value: "armor", label: "Armor" },
      { value: "misc", label: "Misc" }
    ];

    const type = (data.system?.type ?? data.system?.category ?? "weapon").toString();
    data._ui = {
      type,
      isWeapon: type === "weapon",
      isArmor: type === "armor",
      isMisc: type === "misc"
    };

    return data;
  }
}
