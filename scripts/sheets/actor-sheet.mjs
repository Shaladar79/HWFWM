const { HandlebarsApplicationMixin } = foundry.applications.api;

export class HwfwmActorSheet extends HandlebarsApplicationMixin(
  foundry.applications.sheets.ActorSheetV2
) {
  static DEFAULT_OPTIONS = foundry.utils.mergeObject(super.DEFAULT_OPTIONS, {
    tag: "form",
    classes: ["hwfwm-system", "sheet", "actor", "pc", "hwfwm-sheet"],
    position: { width: 875, height: 500 },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  });

  static PARTS = {
    form: {
      template: "systems/hwfwm-system/templates/actor/actor-sheet.hbs"
    }
  };

  /**
   * Persist primary tab across autosave rerenders.
   * @private
   */
  _activeTab = "overview";

  /**
   * Persist sub-tabs per group across autosave rerenders.
   * Keys are data-group values (e.g. "traits").
   * @private
   */
  _activeSubTabs = {
    traits: "enhancements"
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const cfg = CONFIG["hwfwm-system"] ?? {};

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

    // -------------------------------------------------------
    // Items context for Traits > Features
    // -------------------------------------------------------
    const items = Array.from(this.document?.items ?? []);

    const grantedSources = new Set(["race", "role", "background", "rank"]);

    // Feature items granted by the build pipeline
    const grantedFeatures = items
      .filter((it) => it?.type === "feature")
      .filter((it) => grantedSources.has(it?.system?.source))
      .map((it) => ({
        id: it.id,
        name: it.name,
        source: it.system?.source ?? ""
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Talent items (chosen/earned)
    const talents = items
      .filter((it) => it?.type === "talent")
      .map((it) => ({
        id: it.id,
        name: it.name,
        talentType: it.system?.talentType ?? ""
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    context.grantedFeatures = grantedFeatures;
    context.talents = talents;

    return context;
  }

  /**
   * Tabs + Item button actions (V2-safe)
   */
  _onRender(...args) {
    super._onRender(...args);

    // Normalize root element
    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    // -----------------------------
    // Primary Tabs (overview/status/traits)
    // -----------------------------
    this._activateTabGroup(root, {
      group: "primary",
      navSelector: '.hwfwm-tabs[data-group="primary"]',
      defaultTab: "overview",
      getPersisted: () => this._activeTab,
      setPersisted: (t) => (this._activeTab = t)
    });

    // -----------------------------
    // Sub Tabs (Traits: enhancements/features)
    // -----------------------------
    this._activateTabGroup(root, {
      group: "traits",
      navSelector: '.hwfwm-tabs[data-group="traits"]',
      defaultTab: "enhancements",
      getPersisted: () => this._activeSubTabs.traits,
      setPersisted: (t) => (this._activeSubTabs.traits = t)
    });

    // -----------------------------
    // Item action buttons (event delegation)
    // -----------------------------
    root.addEventListener("click", async (ev) => {
      const btn = ev.target.closest("[data-action]");
      if (!btn) return;

      const action = btn.dataset.action;

      // Only handle actions used in Traits > Features
      if (!["open-item", "delete-item", "create-talent"].includes(action)) return;

      ev.preventDefault();

      // Open existing item
      if (action === "open-item") {
        const id = btn.dataset.itemId;
        const item = this.document?.items?.get(id);
        if (!item) return;
        item.sheet?.render(true);
        return;
      }

      // Delete item (Talents section)
      if (action === "delete-item") {
        const id = btn.dataset.itemId;
        const item = this.document?.items?.get(id);
        if (!item) return;
        await item.delete();
        return;
      }

      // Create a new Talent item
      if (action === "create-talent") {
        await this.document.createEmbeddedDocuments("Item", [
          {
            name: "New Talent",
            type: "talent",
            system: {
              talentType: ""
            }
          }
        ]);
        return;
      }
    });
  }

  /**
   * Generic tab activator for any data-group.
   * - nav:  .hwfwm-tabs[data-group="X"] with .hwfwm-tab[data-tab]
   * - panels: .tab[data-group="X"][data-tab]
   */
  _activateTabGroup(root, { group, navSelector, defaultTab, getPersisted, setPersisted }) {
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

    // Prefer persisted; fall back to any pre-marked active; then default
    const initial =
      getPersisted?.() ||
      links.find((a) => a.classList.contains("is-active"))?.dataset.tab ||
      defaultTab;

    activate(initial);

    nav.addEventListener("click", (ev) => {
      const a = ev.target.closest(`.hwfwm-tab[data-tab]`);
      if (!a) return;
      ev.preventDefault();
      activate(a.dataset.tab);
    });
  }
}
