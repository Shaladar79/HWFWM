// scripts/sheets/items/equipment-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

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

    context.item = this.document;
    context.system = this.document.system ?? {};

    context.equipmentTypes = [
      { value: "weapon", label: "Weapon" },
      { value: "armor", label: "Armor" },
      { value: "misc", label: "Misc" }
    ];

    context.attributesList = [
      { value: "power", label: "Power" },
      { value: "speed", label: "Speed" },
      { value: "spirit", label: "Spirit" },
      { value: "recovery", label: "Recovery" }
    ];

    const type = (context.system?.type ?? context.system?.category ?? "weapon").toString();
    context._ui = {
      type,
      isWeapon: type === "weapon",
      isArmor: type === "armor",
      isMisc: type === "misc"
    };

    // ----- Option lists from CONFIG catalogs -----
    const cfg = CONFIG["hwfwm-system"] ?? {};

    const specialtyCatalog = cfg.specialtyCatalog ?? {};
    const affinityCatalog = cfg.affinityCatalog ?? {};
    const resistanceCatalog = cfg.resistanceCatalog ?? {};

    const specialtyTypeOrder = ["power", "speed", "spirit", "recovery"];
    const specialtyTypeLabels = {
      power: "Power",
      speed: "Speed",
      spirit: "Spirit",
      recovery: "Recovery"
    };

    const typesFound = new Set();
    const specialtiesByType = {};

    for (const [key, meta] of Object.entries(specialtyCatalog)) {
      const rawAttr = String(meta?.attribute ?? "").trim();
      if (!rawAttr) continue;

      const t = rawAttr.toLowerCase();
      if (!specialtyTypeOrder.includes(t)) continue;

      typesFound.add(t);
      specialtiesByType[t] ??= [];
      specialtiesByType[t].push({ value: key, label: meta?.name ?? key });
    }

    for (const t of Object.keys(specialtiesByType)) {
      specialtiesByType[t].sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }

    context.specialtyTypeOptions = specialtyTypeOrder
      .filter((t) => typesFound.has(t))
      .map((t) => ({ value: t, label: specialtyTypeLabels[t] ?? t }));

    context.specialtiesByType = specialtiesByType;

    const toOptions = (catalog) =>
      Object.entries(catalog)
        .map(([key, meta]) => ({ value: key, label: meta?.name ?? key }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));

    context.affinityOptions = toOptions(affinityCatalog);
    context.resistanceOptions = toOptions(resistanceCatalog);

    // ----- Safe normalization -----
    const sys = context.system;

    sys.equipped = !!sys.equipped;

    sys.description ??= "";
    sys.notes ??= "";

    sys.weapon ??= {};
    sys.armor ??= {};
    sys.misc ??= {};

    sys.weapon.category ??= "";
    sys.weapon.weaponType ??= "";
    sys.weapon.damagePerSuccess ??= 0;
    sys.weapon.range ??= 0;
    sys.weapon.actionCost ??= 0;
    sys.weapon.damageType1 ??= "";
    sys.weapon.damageType2 ??= "";
    sys.weapon.damageType3 ??= "";

    sys.armor.value ??= 0;
    sys.armor.armorType ??= "";

    sys.misc.armor ??= 0;

    sys.adjustments ??= {};
    sys.adjustments.attributes ??= {};
    sys.adjustments.resources ??= {};

    for (const a of context.attributesList) {
      sys.adjustments.attributes[a.value] ??= {};
      sys.adjustments.attributes[a.value].flat ??= 0;
    }

    const ensurePctFlat = (k) => {
      sys.adjustments.resources[k] ??= {};
      sys.adjustments.resources[k].pct ??= 0;
      sys.adjustments.resources[k].flat ??= 0;
    };
    const ensureFlat = (k) => {
      sys.adjustments.resources[k] ??= {};
      sys.adjustments.resources[k].flat ??= 0;
    };

    ensurePctFlat("lifeForce");
    ensurePctFlat("mana");
    ensurePctFlat("stamina");

    ensureFlat("trauma");
    ensureFlat("pace");
    ensureFlat("reaction");
    ensureFlat("defense");
    ensureFlat("naturalArmor");

    sys.adjustments.specialties = Array.isArray(sys.adjustments.specialties) ? sys.adjustments.specialties : [];
    sys.adjustments.affinities = Array.isArray(sys.adjustments.affinities) ? sys.adjustments.affinities : [];
    sys.adjustments.resistances = Array.isArray(sys.adjustments.resistances) ? sys.adjustments.resistances : [];

    if (sys.adjustments.specialties.length < 1) sys.adjustments.specialties.push({ type: "", key: "" });
    if (sys.adjustments.affinities.length < 1) sys.adjustments.affinities.push({ key: "" });
    if (sys.adjustments.resistances.length < 1) sys.adjustments.resistances.push({ key: "" });

    context.system = sys;
    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);

    const el = this.element;
    if (!el) return;

    // Click delegation (Add/Remove row)
    this._boundClick ??= this._handleClick.bind(this);
    el.removeEventListener("click", this._boundClick);
    el.addEventListener("click", this._boundClick);

    // Change delegation (force-save array row edits reliably)
    this._boundChange ??= this._handleChange.bind(this);
    el.removeEventListener("change", this._boundChange);
    el.addEventListener("change", this._boundChange);
  }

  async _handleClick(event) {
    const btn = event.target?.closest?.("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const index = Number(btn.dataset.index);

    switch (action) {
      case "add-specialty-row":
        return this._addRow("system.adjustments.specialties", { type: "", key: "" });

      case "remove-specialty-row":
        return this._removeRow("system.adjustments.specialties", index, { type: "", key: "" });

      case "add-affinity-row":
        return this._addRow("system.adjustments.affinities", { key: "" });

      case "remove-affinity-row":
        return this._removeRow("system.adjustments.affinities", index, { key: "" });

      case "add-resistance-row":
        return this._addRow("system.adjustments.resistances", { key: "" });

      case "remove-resistance-row":
        return this._removeRow("system.adjustments.resistances", index, { key: "" });

      default:
        return;
    }
  }

  /**
   * Force-persist row edits for array-of-objects fields.
   * Foundry will not reliably persist dot-index updates for ArrayFields in all cases.
   * We capture the change and update the entire array explicitly.
   */
  async _handleChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const name = target.getAttribute("name") ?? "";
    if (!name.startsWith("system.adjustments.")) return;

    // Matches:
    // system.adjustments.specialties.0.type
    // system.adjustments.specialties.0.key
    // system.adjustments.affinities.0.key
    // system.adjustments.resistances.0.key
    const m = name.match(
      /^system\.adjustments\.(specialties|affinities|resistances)\.(\d+)\.(type|key)$/
    );
    if (!m) return;

    const [, group, idxStr, field] = m;
    const index = Number(idxStr);
    if (!Number.isFinite(index) || index < 0) return;

    const value =
      target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
        ? target.value
        : "";

    const path = `system.adjustments.${group}`;
    const current = foundry.utils.deepClone(foundry.utils.getProperty(this.document, path) ?? []);
    if (!Array.isArray(current)) return;

    // Ensure row exists
    while (current.length <= index) {
      if (group === "specialties") current.push({ type: "", key: "" });
      else current.push({ key: "" });
    }

    // Apply change
    current[index] ??= group === "specialties" ? { type: "", key: "" } : { key: "" };
    current[index][field] = value;

    // If specialty type changed, clear specialty key so the dependent dropdown is consistent
    if (group === "specialties" && field === "type") {
      current[index].key = "";
    }

    // Persist whole array
    await this.document.update({ [path]: current });
  }

  async _addRow(path, row) {
    const current = foundry.utils.deepClone(foundry.utils.getProperty(this.document, path) ?? []);
    const next = Array.isArray(current) ? current : [];
    next.push(foundry.utils.deepClone(row));
    await this.document.update({ [path]: next });
  }

  async _removeRow(path, index, fallbackRow) {
    let current = foundry.utils.deepClone(foundry.utils.getProperty(this.document, path) ?? []);
    if (!Array.isArray(current)) current = [];

    if (Number.isFinite(index) && index >= 0 && index < current.length) {
      current.splice(index, 1);
    }

    // Keep at least 1 row so UI never disappears
    if (current.length < 1) current.push(foundry.utils.deepClone(fallbackRow));

    await this.document.update({ [path]: current });
  }
}
