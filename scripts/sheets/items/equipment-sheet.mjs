// scripts/sheets/items/equipment-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

import {
  ITEM_RANK_KEYS,
  WEAPON_CATEGORY_KEYS,
  WEAPON_TYPES_BY_CATEGORY,
  ARMOR_CLASS_KEYS,
  ARMOR_TYPES_BY_CLASS
} from "../../../config/items.mjs";

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

  /**
   * Coerce a value that might be:
   * - Array               -> return as-is
   * - { "0": {...}, ... } -> convert to array in numeric order
   * - anything else       -> []
   */
  _coerceIndexedToArray(value) {
    if (Array.isArray(value)) return value;

    if (value && typeof value === "object") {
      const keys = Object.keys(value).filter((k) => /^\d+$/.test(k));
      if (!keys.length) return [];
      keys.sort((a, b) => Number(a) - Number(b));
      return keys.map((k) => value[k]);
    }

    return [];
  }

  _ensureMinRows(arr, factory, min = 1) {
    const out = Array.isArray(arr) ? arr : [];
    while (out.length < min) out.push(factory());
    return out;
  }

  _toOptionsFromKeys(keys, labelFn) {
    return (keys ?? []).map((k) => ({ value: k, label: labelFn ? labelFn(k) : k }));
  }

  _toOptionsFromStrings(strings) {
    return (strings ?? []).map((s) => ({ value: s, label: s }));
  }

  _titleCaseKey(key) {
    const s = String(key ?? "");
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

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

    // Persistent item rank (new)
    sys.itemRank = ITEM_RANK_KEYS.includes(String(sys.itemRank ?? ""))
      ? String(sys.itemRank)
      : "normal";

    sys.equipped = !!sys.equipped;

    sys.description ??= "";
    sys.notes ??= "";

    sys.weapon ??= {};
    sys.armor ??= {};
    sys.misc ??= {};

    // Weapon normalization (melee/ranged only)
    sys.weapon.category = WEAPON_CATEGORY_KEYS.includes(String(sys.weapon.category ?? ""))
      ? String(sys.weapon.category)
      : "";

    sys.weapon.weaponType ??= "";
    if (sys.weapon.category) {
      const allowed = WEAPON_TYPES_BY_CATEGORY[sys.weapon.category] ?? [];
      if (!allowed.includes(String(sys.weapon.weaponType ?? ""))) {
        sys.weapon.weaponType = "";
      }
    } else {
      if (String(sys.weapon.weaponType ?? "")) sys.weapon.weaponType = "";
    }

    sys.weapon.damagePerSuccess ??= 0;
    sys.weapon.range ??= 0;
    sys.weapon.actionCost ??= 0;
    sys.weapon.damageType1 ??= "";
    sys.weapon.damageType2 ??= "";
    sys.weapon.damageType3 ??= "";

    // Armor normalization (class + type)
    sys.armor.armorType = ARMOR_CLASS_KEYS.includes(String(sys.armor.armorType ?? ""))
      ? String(sys.armor.armorType)
      : "";

    // New dependent field
    sys.armor.armorName ??= "";
    if (sys.armor.armorType) {
      const allowedArmor = ARMOR_TYPES_BY_CLASS[sys.armor.armorType] ?? [];
      if (!allowedArmor.includes(String(sys.armor.armorName ?? ""))) {
        sys.armor.armorName = "";
      }
    } else {
      if (String(sys.armor.armorName ?? "")) sys.armor.armorName = "";
    }

    sys.armor.value ??= 0;

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

    // IMPORTANT: preserve numeric-key objects by coercing to arrays
    sys.adjustments.specialties = this._ensureMinRows(
      this._coerceIndexedToArray(sys.adjustments.specialties),
      () => ({ type: "", key: "" }),
      1
    );

    sys.adjustments.affinities = this._ensureMinRows(
      this._coerceIndexedToArray(sys.adjustments.affinities),
      () => ({ key: "" }),
      1
    );

    sys.adjustments.resistances = this._ensureMinRows(
      this._coerceIndexedToArray(sys.adjustments.resistances),
      () => ({ key: "" }),
      1
    );

    // ----- Equipment option lists (from config/items.mjs) -----
    context.weaponCategoryOptions = this._toOptionsFromKeys(WEAPON_CATEGORY_KEYS, (k) =>
      k === "melee" ? "Melee" : k === "ranged" ? "Ranged" : this._titleCaseKey(k)
    );

    const weaponTypes =
      sys.weapon.category && WEAPON_TYPES_BY_CATEGORY[sys.weapon.category]
        ? WEAPON_TYPES_BY_CATEGORY[sys.weapon.category]
        : [];
    context.weaponTypeOptions = this._toOptionsFromStrings(weaponTypes);

    context.armorClassOptions = this._toOptionsFromKeys(ARMOR_CLASS_KEYS, (k) =>
      k === "light" ? "Light" : k === "medium" ? "Medium" : k === "heavy" ? "Heavy" : this._titleCaseKey(k)
    );

    const armorTypes =
      sys.armor.armorType && ARMOR_TYPES_BY_CLASS[sys.armor.armorType]
        ? ARMOR_TYPES_BY_CLASS[sys.armor.armorType]
        : [];
    context.armorTypeOptions = this._toOptionsFromStrings(armorTypes);

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

  async _handleChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const name = target.getAttribute("name") ?? "";

    // Existing: adjustments array fix-ups
    if (name.startsWith("system.adjustments.")) {
      const m = name.match(
        /^system\.adjustments\.(specialties|affinities|resistances)\.(\d+)\.(type|key)$/
      );
      if (!m) return;

      const [, group, idxStr, field] = m;
      const index = Number(idxStr);
      if (!Number.isFinite(index) || index < 0) return;

      const value =
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
          ? target.value
          : "";

      const path = `system.adjustments.${group}`;

      // Read and coerce current value to a real array
      const raw = foundry.utils.getProperty(this.document, path);
      let current = this._coerceIndexedToArray(foundry.utils.deepClone(raw));

      // Ensure row exists
      while (current.length <= index) {
        if (group === "specialties") current.push({ type: "", key: "" });
        else current.push({ key: "" });
      }

      current[index] ??= group === "specialties" ? { type: "", key: "" } : { key: "" };
      current[index][field] = value;

      if (group === "specialties" && field === "type") {
        current[index].key = "";
      }

      await this.document.update({ [path]: current });
      return;
    }

    // NEW: dependent dropdown behavior (weapon type depends on weapon category)
    if (name === "system.weapon.category") {
      const selected =
        target instanceof HTMLSelectElement || target instanceof HTMLInputElement
          ? String(target.value ?? "")
          : "";

      const allowed = WEAPON_TYPES_BY_CATEGORY[selected] ?? [];
      const currentType = String(this.document.system?.weapon?.weaponType ?? "");

      // If category changes and current type is invalid, clear it.
      if (!allowed.includes(currentType)) {
        await this.document.update({ "system.weapon.weaponType": "" });
      }
      return;
    }

    // NEW: dependent dropdown behavior (armor type depends on armor class)
    if (name === "system.armor.armorType") {
      const selected =
        target instanceof HTMLSelectElement || target instanceof HTMLInputElement
          ? String(target.value ?? "")
          : "";

      const allowed = ARMOR_TYPES_BY_CLASS[selected] ?? [];
      const currentName = String(this.document.system?.armor?.armorName ?? "");

      if (!allowed.includes(currentName)) {
        await this.document.update({ "system.armor.armorName": "" });
      }
      return;
    }
  }

  async _addRow(path, row) {
    const raw = foundry.utils.getProperty(this.document, path);
    const current = this._coerceIndexedToArray(foundry.utils.deepClone(raw));
    current.push(foundry.utils.deepClone(row));
    await this.document.update({ [path]: current });
  }

  async _removeRow(path, index, fallbackRow) {
    const raw = foundry.utils.getProperty(this.document, path);
    let current = this._coerceIndexedToArray(foundry.utils.deepClone(raw));

    if (Number.isFinite(index) && index >= 0 && index < current.length) {
      current.splice(index, 1);
    }

    if (current.length < 1) current.push(foundry.utils.deepClone(fallbackRow));
    await this.document.update({ [path]: current });
  }
}
