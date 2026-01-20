// scripts/sheets/actor/actor-sheet.mjs

import { buildActorSheetContext } from "./context.mjs";
import { bindActorSheetListeners } from "./listeners.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

export class HwfwmActorSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    tag: "form",
    classes: ["hwfwm-system", "sheet", "actor", "pc", "hwfwm-sheet"],
    position: { width: 875, height: 500 },
    form: { submitOnChange: true, closeOnSubmit: false }
  });

  static PARTS = {
    form: { template: "systems/hwfwm-system/templates/actor/actor-sheet.hbs" }
  };

  static ESSENCE_ATTRS = ["power", "speed", "spirit", "recovery"];

  _activeTab = "overview";
  _activeSubTabs = { traits: "enhancements", essence: null, treasures: null };
  _domController = null;

  async _prepareContext(options) {
    const baseContext = await super._prepareContext(options);
    const ctx = await buildActorSheetContext(this, baseContext, options);

    // ------------------------------------------------------------
    // Header/Overview read models:
    // - Header is read-only for Race/Role/Background
    // - Overview owns the editable dropdowns + description display
    // ------------------------------------------------------------
    const cfg = CONFIG?.["hwfwm-system"] ?? {};

    const pickLabel = (optionsList, key, fallback = "—") => {
      if (!Array.isArray(optionsList)) return fallback;
      const hit = optionsList.find((o) => String(o?.value ?? "") === String(key ?? ""));
      return String(hit?.label ?? fallback);
    };

    const pickDesc = (descMap, key, fallback = "") => {
      if (!descMap || typeof descMap !== "object") return fallback;
      return String(descMap?.[key] ?? fallback);
    };

    // Try multiple possible config shapes (keeps this resilient while configs evolve)
    const raceDescMap =
      cfg.raceDescriptions ?? cfg.racesDescriptions ?? cfg.racesDesc ?? cfg.RACE_DESCRIPTIONS ?? {};
    const roleDescMap =
      cfg.roleDescriptions ?? cfg.rolesDescriptions ?? cfg.rolesDesc ?? cfg.ROLE_DESCRIPTIONS ?? {};
    const backgroundDescMap =
      cfg.backgroundDescriptions ??
      cfg.backgroundsDescriptions ??
      cfg.backgroundsDesc ??
      cfg.BACKGROUND_DESCRIPTIONS ??
      {};

    const details = ctx.details ?? {};
    const raceKey = details.raceKey ?? "";
    const roleKey = details.roleKey ?? "";
    const backgroundKey = details.backgroundKey ?? "";

    // Labels (for header read-only inputs)
    ctx.selectedRaceLabel = pickLabel(ctx.raceOptions, raceKey, "—");
    ctx.selectedRoleLabel = pickLabel(ctx.roleOptions, roleKey, "—");
    ctx.selectedBackgroundLabel = pickLabel(ctx.backgroundOptions, backgroundKey, "—");

    // Descriptions (for Overview cards)
    ctx.selectedRaceDescription = pickDesc(raceDescMap, raceKey, "");
    ctx.selectedRoleDescription = pickDesc(roleDescMap, roleKey, "");
    ctx.selectedBackgroundDescription = pickDesc(backgroundDescMap, backgroundKey, "");

    return ctx;
  }

  _onRender(...args) {
    super._onRender(...args);

    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    if (this._domController) this._domController.abort();
    this._domController = new AbortController();

    bindActorSheetListeners(this, root, this._domController);
  }
}
