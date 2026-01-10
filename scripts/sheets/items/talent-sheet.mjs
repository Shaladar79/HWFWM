// scripts/sheets/items/talent-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * HWFWM Talent Item Sheet (V13 Sheet V2)
 * - Talents are PASSIVE items that adjust the character (stats + grants)
 * - This sheet is data-entry only; no mechanics application logic here.
 */
export class HwfwmTalentSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ItemSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    classes: ["hwfwm-system", "sheet", "item", "talent"],
    position: { width: 640, height: 680 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/item/talent-sheet.hbs"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Normalize common aliases so templates can use {{item}} and {{system}}
    context.item = this.document;
    context.system = this.document.system;

    const cfg = CONFIG["hwfwm-system"] ?? {};

    // -----------------------------------------------------------------------
    // Baseline lists (kept; template uses attributesList)
    // -----------------------------------------------------------------------
    context.attributesList = [
      { value: "power", label: "Power" },
      { value: "speed", label: "Speed" },
      { value: "spirit", label: "Spirit" },
      { value: "recovery", label: "Recovery" }
    ];

    // -----------------------------------------------------------------------
    // Dropdown option sources (derived from your live config catalogs)
    // -----------------------------------------------------------------------
    const specialtyCatalog = cfg.specialtyCatalog ?? {};
    const affinityCatalog = cfg.affinityCatalog ?? {};
    const aptitudeCatalog = cfg.aptitudeCatalog ?? {};
    const resistanceCatalog = cfg.resistanceCatalog ?? {};

    // Specialty Types (derived from specialtyCatalog.attribute)
    // We normalize to lower-case values for storage: power/speed/spirit/recovery
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

      const type = rawAttr.toLowerCase();
      if (!specialtyTypeOrder.includes(type)) continue;

      typesFound.add(type);
      specialtiesByType[type] ??= [];
      specialtiesByType[type].push({ value: key, label: meta?.name ?? key });
    }

    // Sort each type list by label
    for (const t of Object.keys(specialtiesByType)) {
      specialtiesByType[t].sort((a, b) => String(a.label).localeCompare(String(b.label)));
    }

    context.specialtyTypeOptions = specialtyTypeOrder
      .filter((t) => typesFound.has(t))
      .map((t) => ({ value: t, label: specialtyTypeLabels[t] ?? t }));

    context.specialtiesByType = specialtiesByType;

    // Affinity/Aptitude/Resistance options (object catalogs keyed by id)
    const toOptions = (catalog) =>
      Object.entries(catalog)
        .map(([key, meta]) => ({ value: key, label: meta?.name ?? key }))
        .sort((a, b) => String(a.label).localeCompare(String(b.label)));

    context.affinityOptions = toOptions(affinityCatalog);
    context.aptitudeOptions = toOptions(aptitudeCatalog);
    context.resistanceOptions = toOptions(resistanceCatalog);

    // -----------------------------------------------------------------------
    // Safe normalization for templates (UI-only)
    // Avoid crashes when fields are missing in older items.
    // -----------------------------------------------------------------------
    const sys = context.system ?? {};

    sys.adjustments ??= {};
    sys.adjustments.attributes ??= {};
    sys.adjustments.resources ??= {};

    // Attributes: ensure flat exists for each attribute
    for (const a of context.attributesList) {
      sys.adjustments.attributes[a.value] ??= {};
      sys.adjustments.attributes[a.value].flat ??= 0;
    }

    // Resources model for this sheet:
    // - lifeForce/mana/stamina: pct + flat
    // - others: flat only
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

    // Grants: new single-selection objects
    sys.grants ??= {};
    sys.grants.specialty ??= {};
    sys.grants.specialty.type ??= "";
    sys.grants.specialty.key ??= "";

    sys.grants.affinity ??= {};
    sys.grants.affinity.key ??= "";

    sys.grants.aptitude ??= {};
    sys.grants.aptitude.key ??= "";

    sys.grants.resistance ??= {};
    sys.grants.resistance.key ??= "";

    context.system = sys;
    return context;
  }
}
