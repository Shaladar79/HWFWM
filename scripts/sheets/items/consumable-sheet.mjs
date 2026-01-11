// scripts/sheets/items/consumable-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Consumable Item Sheet (V13 Sheet V2)
 * - submitOnChange enabled
 * - readied is a boolean (checkbox-friendly)
 * - avoids undefined system.description in templates (display-safe default)
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

    // Use a clone for render-safety (prevents accidental mutation of document.system)
    const system = foundry.utils.deepClone(this.document.system ?? {});
    system.description ??= ""; // display-safe default if older items lack it

    // Normalize legacy "yes/no" (or other truthy-ish values) to boolean for checkbox templates
    const r = system.readied;
    system.readied =
      r === true ||
      r === 1 ||
      r === "1" ||
      r === "true" ||
      r === "yes" ||
      r === "on";

    context.system = system;

    // Removed: readiedOptions (template should bind to system.readied as boolean)
    return context;
  }

  /**
   * Coerce readied into a true boolean on update, especially when toggled via checkbox.
   * This is intentionally minimal and avoids any migrations/refactors.
   * @override
   */
  async _updateObject(event, formData) {
    // Some V2 flows provide flattened data; others provide expanded.
    // Normalize to a flat key map so we can safely coerce.
    const flat =
      formData && typeof formData === "object"
        ? (foundry.utils.isObject(formData) ? foundry.utils.flattenObject(formData) : formData)
        : {};

    // If the change came from the readied checkbox, trust the DOM checked state.
    const target = event?.target;
    const targetName = target?.getAttribute?.("name") ?? target?.name ?? "";
    if (targetName === "system.readied" && target instanceof HTMLInputElement) {
      flat["system.readied"] = !!target.checked;
    } else if ("system.readied" in flat) {
      // Otherwise, coerce whatever came through the form pipeline to a real boolean.
      const v = flat["system.readied"];
      flat["system.readied"] =
        v === true || v === 1 || v === "1" || v === "true" || v === "yes" || v === "on";
    }

    // Re-expand to the shape Foundry expects
    const expanded = foundry.utils.expandObject(flat);
    return super._updateObject(event, expanded);
  }
}
