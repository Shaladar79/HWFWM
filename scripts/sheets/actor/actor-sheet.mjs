// scripts/sheets/actor/actor-sheet.mjs

const { HandlebarsApplicationMixin } = foundry.applications.api;

import { flattenMiscCatalog } from "./utils/catalog-utils.mjs";
import { computeEssenceUI, handleEssenceChange } from "./handlers/essence-handlers.mjs";
import { handleTraitsAction } from "./handlers/traits-handlers.mjs";
import {
  handleInlineItemChange,
  handleInlineMiscChange,
  handleInventoryAction
} from "./handlers/inventory-handlers.mjs";
import { handleRollClick } from "./handlers/roll-handlers.mjs";

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

  _activeTab = "overview";
  _activeSubTabs = { traits: "enhancements", essence: null, treasures: null };
  _domController = null;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const cfg = CONFIG["hwfwm-system"] ?? {};

    context.system = this.document?.system ?? context.system ?? {};

    const roles = cfg.roles ?? {};
    const roleOrder = cfg.roleOrder ?? Object.keys(roles);

    const ranks = cfg.ranks ?? {};
    const rankOrder = cfg.rankOrder ?? Object.keys(ranks);

    const races = cfg.races ?? {};
    const raceOrder = cfg.raceOrder ?? Object.keys(races);

    const backgrounds = cfg.backgrounds ?? {};
    const backgroundOrder = cfg.backgroundOrder ?? Object.keys(backgrounds);

    context.roleOptions = roleOrder.map((k) => ({ value: k, label: roles[k] ?? k }));
    context.rankOptions = rankOrder.map((k) => ({ value: k, label: ranks[k] ?? k }));
    context.raceOptions = raceOrder.map((k) => ({ value: k, label: races[k] ?? k }));
    context.backgroundOptions = backgroundOrder.map((k) => ({ value: k, label: backgrounds[k] ?? k }));

    const details = this.document?.system?.details ?? {};
    context.details = {
      roleKey: details.roleKey ?? "",
      rankKey: details.rankKey ?? "",
      raceKey: details.raceKey ?? "",
      backgroundKey: details.backgroundKey ?? ""
    };

    const items = Array.from(this.document?.items ?? []);
    const grantedSources = new Set(["race", "role", "background", "rank"]);

    context.grantedFeatures = items
      .filter((it) => it?.type === "feature")
      .filter((it) => grantedSources.has(it?.system?.source))
      .map((it) => ({ id: it.id, name: it.name, source: it.system?.source ?? "" }))
      .sort((a, b) => a.name.localeCompare(b.name));

    context.talents = items
      .filter((it) => it?.type === "talent")
      .map((it) => ({ id: it.id, name: it.name, talentType: it.system?.talentType ?? "" }))
      .sort((a, b) => a.name.localeCompare(b.name));

    context.system._ui = context.system._ui ?? {};
    context.system._ui.addSpecialtyKey = context.system._ui.addSpecialtyKey ?? "";
    context.system._ui.addAffinityKey = context.system._ui.addAffinityKey ?? "";
    context.system._ui.addResistanceKey = context.system._ui.addResistanceKey ?? "";
    context.system._ui.addAptitudeKey = context.system._ui.addAptitudeKey ?? "";
    context.system._ui.addMiscItemKey = context.system._ui.addMiscItemKey ?? "";

    const storedEssenceTab = context.system._ui.essenceSubTab ?? "power";
    if (!this._activeSubTabs.essence) this._activeSubTabs.essence = storedEssenceTab;
    context.system._ui.essenceSubTab = this._activeSubTabs.essence ?? storedEssenceTab ?? "power";

    const storedTreasuresTab = context.system._ui.treasuresSubTab ?? "equipment";
    if (!this._activeSubTabs.treasures) this._activeSubTabs.treasures = storedTreasuresTab;
    context.system._ui.treasuresSubTab =
      this._activeSubTabs.treasures ?? storedTreasuresTab ?? "equipment";

    context.specialtyCatalog = cfg.specialtyCatalog ?? {};
    context.affinityCatalog = cfg.affinityCatalog ?? {};
    context.resistanceCatalog = cfg.resistanceCatalog ?? {};
    context.aptitudeCatalog = cfg.aptitudeCatalog ?? {};

    context.essenceCatalog = cfg.essenceCatalog ?? {};
    context.confluenceEssenceCatalog = cfg.confluenceEssenceCatalog ?? {};

    // Important: flatten here for templates.
    context.miscItemCatalog = flattenMiscCatalog(cfg.miscItemCatalog ?? {});

    context.essenceUI = computeEssenceUI(context.system);

    const equipment = items
      .filter((it) => it?.type === "equipment")
      .map((it) => ({
        id: it.id,
        name: it.name,
        category: it.system?.category ?? "misc",
        equipped: (it.system?.equipped ?? "no").toString(),
        notes: it.system?.notes ?? ""
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const consumables = items
      .filter((it) => it?.type === "consumable")
      .map((it) => ({
        id: it.id,
        name: it.name,
        quantity: Number(it.system?.quantity ?? 0),
        readied: (it.system?.readied ?? "no").toString(),
        notes: it.system?.notes ?? ""
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    context.allEquipment = equipment;
    context.equippedEquipment = equipment.filter((it) => it.equipped === "yes");

    context.allConsumables = consumables;
    context.readiedConsumables = consumables.filter((it) => it.readied === "yes");

    const misc = context.system?.treasures?.miscItems ?? {};
    const miscEntries = Object.entries(misc).map(([key, data]) => ({
      key,
      name: data?.name ?? key,
      quantity: Number(data?.quantity ?? 1),
      notes: data?.notes ?? ""
    }));
    miscEntries.sort((a, b) => a.name.localeCompare(b.name));
    context.allMiscItems = miscEntries;

    return context;
  }

  _onRender(...args) {
    super._onRender(...args);

    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    if (this._domController) this._domController.abort();
    this._domController = new AbortController();
    const { signal } = this._domController;

    this._activateTabGroup(root, {
      group: "primary",
      navSelector: '.hwfwm-tabs[data-group="primary"]',
      defaultTab: "overview",
      getPersisted: () => this._activeTab,
      setPersisted: (t) => (this._activeTab = t),
      signal
    });

    this._activateTabGroup(root, {
      group: "traits",
      navSelector: '.hwfwm-tabs[data-group="traits"]',
      defaultTab: "enhancements",
      getPersisted: () => this._activeSubTabs.traits,
      setPersisted: (t) => (this._activeSubTabs.traits = t),
      signal
    });

    this._activateTabGroup(root, {
      group: "essence",
      navSelector: '.hwfwm-tabs[data-group="essence"]',
      defaultTab: "power",
      getPersisted: () => this._activeSubTabs.essence,
      setPersisted: (t) => {
        this._activeSubTabs.essence = t;
        const current = this.document?.system?._ui?.essenceSubTab ?? "power";
        if (current !== t) this.document?.update?.({ "system._ui.essenceSubTab": t }).catch(() => {});
      },
      signal
    });

    this._activateTabGroup(root, {
      group: "treasures",
      navSelector: '.hwfwm-tabs[data-group="treasures"]',
      defaultTab: "equipment",
      getPersisted: () => this._activeSubTabs.treasures,
      setPersisted: (t) => {
        this._activeSubTabs.treasures = t;
        const current = this.document?.system?._ui?.treasuresSubTab ?? "equipment";
        if (current !== t) this.document?.update?.({ "system._ui.treasuresSubTab": t }).catch(() => {});
      },
      signal
    });

    // CHANGE
    root.addEventListener(
      "change",
      async (ev) => {
        const target = ev.target;

        if (await handleInlineItemChange({ actor: this.document, target })) {
          ev.preventDefault?.();
          ev.stopPropagation();
          ev.stopImmediatePropagation?.();
          return;
        }

        if (await handleInlineMiscChange({ actor: this.document, target })) {
          ev.preventDefault?.();
          ev.stopPropagation();
          ev.stopImmediatePropagation?.();
          return;
        }

        if (await handleEssenceChange({ actor: this.document, target })) {
          ev.preventDefault?.();
          ev.stopPropagation();
          ev.stopImmediatePropagation?.();
          return;
        }
      },
      { signal, capture: true }
    );

    // CLICK
    root.addEventListener(
      "click",
      async (ev) => {
        const actionBtn = ev.target.closest("[data-action]");
        if (actionBtn) {
          // stop form behavior early
          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation?.();

          if (await handleInventoryAction({ actor: this.document, actionBtn })) return;
          if (await handleTraitsAction({ actor: this.document, root, actionBtn })) return;

          return;
        }

        const rollBtn = ev.target.closest("[data-roll]");
        if (rollBtn) {
          ev.preventDefault();
          await handleRollClick({ actor: this.document, rollBtn });
        }
      },
      { signal, capture: true }
    );
  }

  _activateTabGroup(root, { group, navSelector, defaultTab, getPersisted, setPersisted, signal }) {
    const nav = root.querySelector(navSelector);
    if (!nav) return;

    const panels = Array.from(root.querySelectorAll(`.tab[data-group="${group}"][data-tab]`));
    const links = Array.from(nav.querySelectorAll(`.hwfwm-tab[data-tab]`));
    if (!panels.length || !links.length) return;

    const activate = (tabName) => {
      setPersisted(tabName);

      for (const p of panels) {
        const isActive = p.dataset.tab === tabName;
        p.classList.toggle("is-active", isActive);
        p.style.display = isActive ? "" : "none";
      }
      for (const a of links) {
        a.classList.toggle("is-active", a.dataset.tab === tabName);
      }
    };

    const initial =
      getPersisted?.() ||
      links.find((a) => a.classList.contains("is-active"))?.dataset.tab ||
      defaultTab;

    activate(initial);

    nav.addEventListener(
      "click",
      (ev) => {
        const a = ev.target.closest(`.hwfwm-tab[data-tab]`);
        if (!a) return;
        ev.preventDefault();
        activate(a.dataset.tab);
      },
      { signal }
    );
  }
}
