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

  _activeTab = "overview";
  _activeSubTabs = { traits: "enhancements" };

  /**
   * AbortController used to ensure we never stack handlers,
   * and that handlers are always rebound to the latest root after rerender.
   * @private
   */
  _domController = null;

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

    // Items context for Traits > Features
    const items = Array.from(this.document?.items ?? []);
    const grantedSources = new Set(["race", "role", "background", "rank"]);

    context.grantedFeatures = items
      .filter((it) => it?.type === "feature")
      .filter((it) => grantedSources.has(it?.system?.source))
      .map((it) => ({
        id: it.id,
        name: it.name,
        source: it.system?.source ?? ""
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    context.talents = items
      .filter((it) => it?.type === "talent")
      .map((it) => ({
        id: it.id,
        name: it.name,
        talentType: it.system?.talentType ?? ""
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Ensure UI holder exists so the Add Specialty select has a bound value
    context.system = context.system ?? {};
    context.system._ui = context.system._ui ?? {};
    context.system._ui.addSpecialtyKey = context.system._ui.addSpecialtyKey ?? "";

    /**
     * FIX: Ensure specialtyCatalog exists in the render context so the dropdown can populate.
     * Preferred source: CONFIG (stable reference list)
     * Fallback: actor system data if you still store it there
     *
     * IMPORTANT:
     * Your HBS should iterate `{{#each specialtyCatalog as |s key|}}`
     * not `system.specialtyCatalog` to avoid coupling to persisted actor data.
     */
    context.specialtyCatalog =
      cfg.specialtyCatalog ??
      this.document?.system?.specialtyCatalog ??
      {};

    return context;
  }

  _onRender(...args) {
    super._onRender(...args);

    // Normalize root element
    let root = this.element;
    if (Array.isArray(root)) root = root[0];
    if (root && !(root instanceof HTMLElement) && root[0] instanceof HTMLElement) root = root[0];
    if (!(root instanceof HTMLElement)) return;

    // Kill old DOM listeners and rebind to the new root
    if (this._domController) this._domController.abort();
    this._domController = new AbortController();
    const { signal } = this._domController;

    // Primary tabs
    this._activateTabGroup(root, {
      group: "primary",
      navSelector: '.hwfwm-tabs[data-group="primary"]',
      defaultTab: "overview",
      getPersisted: () => this._activeTab,
      setPersisted: (t) => (this._activeTab = t),
      signal
    });

    // Traits subtabs
    this._activateTabGroup(root, {
      group: "traits",
      navSelector: '.hwfwm-tabs[data-group="traits"]',
      defaultTab: "enhancements",
      getPersisted: () => this._activeSubTabs.traits,
      setPersisted: (t) => (this._activeSubTabs.traits = t),
      signal
    });

    // One delegated click handler for ALL actions + rolls
    root.addEventListener(
      "click",
      async (ev) => {
        // -----------------------------
        // Actions
        // -----------------------------
        const actionBtn = ev.target.closest("[data-action]");
        if (actionBtn) {
          const action = actionBtn.dataset.action;

          // Only handle our known actions
          const allowed = new Set([
            "open-item",
            "delete-item",
            "create-talent",
            "add-specialty",
            "remove-specialty"
          ]);
          if (!allowed.has(action)) return;

          ev.preventDefault();

          if (action === "open-item") {
            const id = actionBtn.dataset.itemId;
            const item = this.document?.items?.get(id);
            if (!item) return;
            item.sheet?.render(true);
            return;
          }

          if (action === "delete-item") {
            const id = actionBtn.dataset.itemId;
            const item = this.document?.items?.get(id);
            if (!item) return;
            await item.delete();
            return;
          }

          if (action === "create-talent") {
            await this.document.createEmbeddedDocuments("Item", [
              { name: "New Talent", type: "talent", system: { talentType: "" } }
            ]);
            return;
          }

          if (action === "add-specialty") {
            /**
             * FIX: Read the current select value from the DOM.
             * Relying on this.document.system._ui.addSpecialtyKey can be stale because the
             * form submits asynchronously (submitOnChange).
             */
            const select = root.querySelector('select[name="system._ui.addSpecialtyKey"]');
            const keyFromDom = (select?.value ?? "").trim();

            const key = keyFromDom || (this.document?.system?._ui?.addSpecialtyKey ?? "");
            if (!key) return;

            // Prefer CONFIG catalog (stable), fallback to actor system storage.
            const catalog =
              CONFIG["hwfwm-system"]?.specialtyCatalog ??
              this.document?.system?.specialtyCatalog ??
              {};

            const entry = catalog[key];
            if (!entry) return;

            // Prevent duplicates across base + custom
            const baseHas = !!this.document?.system?.specialties?.[key];
            const customHas = !!this.document?.system?.specialtiesCustom?.[key];
            if (baseHas || customHas) {
              await this.document.update({ "system._ui.addSpecialtyKey": "" });
              return;
            }

            await this.document.update({
              [`system.specialtiesCustom.${key}`]: {
                name: entry.name ?? key,
                attribute: entry.attribute ?? "",
                total: 0,
                notes: ""
              },
              "system._ui.addSpecialtyKey": ""
            });

            return;
          }

          if (action === "remove-specialty") {
            const key = actionBtn.dataset.key;
            if (!key) return;

            // Robust delete: clone object, delete key, write back
            const current = foundry.utils.deepClone(this.document?.system?.specialtiesCustom ?? {});
            if (!(key in current)) return;

            delete current[key];

            await this.document.update({
              "system.specialtiesCustom": current
            });

            return;
          }
        }

        // -----------------------------
        // Rolls
        // -----------------------------
        const rollBtn = ev.target.closest("[data-roll]");
        if (!rollBtn) return;

        const rollType = rollBtn.dataset.roll;
        if (!["specialty", "specialty-custom"].includes(rollType)) return;

        ev.preventDefault();

        const key = rollBtn.dataset.key;
        if (!key) return;

        const spec =
          rollType === "specialty"
            ? this.document?.system?.specialties?.[key]
            : this.document?.system?.specialtiesCustom?.[key];

        if (!spec) return;

        const total = Number(spec.total ?? 0);
        const name = spec.name ?? key;

        if (!Number.isFinite(total) || total <= 0) return;

        // Placeholder roll (simple d100 <= total) with 95–100 hard fail safeguard
        const roll = await new Roll("1d100").evaluate();
        const hardFail = roll.total >= 95;
        const success = !hardFail && roll.total <= total;

        const speaker = ChatMessage.getSpeaker({ actor: this.document });

        await roll.toMessage({
          speaker,
          flavor: `Specialty: ${name} (TN ${total}) — ${success ? "Success" : "Failure"}`
        });
      },
      { signal }
    );
  }

  /**
   * Generic tab activator for any data-group.
   * - nav:  .hwfwm-tabs[data-group="X"] with .hwfwm-tab[data-tab]
   * - panels: .tab[data-group="X"][data-tab]
   */
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
