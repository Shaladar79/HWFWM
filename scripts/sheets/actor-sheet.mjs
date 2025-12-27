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

  // IMPORTANT:
  // - traits can safely default
  // - essence MUST NOT default to "power" here, or it will override persisted actor state every time
  _activeSubTabs = { traits: "enhancements", essence: null };

  /**
   * AbortController used to ensure we never stack handlers,
   * and that handlers are always rebound to the latest root after rerender.
   * @private
   */
  _domController = null;

  /**
   * Essence slot rules:
   * - Exactly 3 unique essences may be selected across power/speed/spirit/recovery
   * - The remaining unselected attribute becomes the Confluence slot (only after 3 are selected)
   */
  static ESSENCE_ATTRS = ["power", "speed", "spirit", "recovery"];

  _computeEssenceUI(systemData) {
    const attrs = HwfwmActorSheet.ESSENCE_ATTRS;

    const ess = systemData?.essences ?? {};
    const picked = attrs
      .map((a) => (ess?.[`${a}Key`] ?? "").trim())
      .filter(Boolean);

    const unique = Array.from(new Set(picked));
    const uniqueCount = unique.length;

    const confluenceUnlocked = uniqueCount === 3;

    // Confluence slot is the ONE attribute that has no essence selected once unlocked.
    // (If player somehow has 4 selected, unlocked becomes false until corrected.)
    const confluenceSlot =
      confluenceUnlocked
        ? attrs.find((a) => !(ess?.[`${a}Key`] ?? "").trim()) ?? null
        : null;

    return {
      attrs,
      selectedEssenceKeys: unique,
      uniqueCount,
      confluenceUnlocked,
      confluenceSlot
    };
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const cfg = CONFIG["hwfwm-system"] ?? {};

    // Bind system context to the actual actor system data
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

    // Ensure UI holder exists so the Add selects have bound values
    context.system._ui = context.system._ui ?? {};
    context.system._ui.addSpecialtyKey = context.system._ui.addSpecialtyKey ?? "";
    context.system._ui.addAffinityKey = context.system._ui.addAffinityKey ?? "";
    context.system._ui.addResistanceKey = context.system._ui.addResistanceKey ?? "";
    context.system._ui.addAptitudeKey = context.system._ui.addAptitudeKey ?? "";

    // ----------------------------
    // Essence subtab persistence
    // ----------------------------
    // Preferred source of truth on open: actor stored value
    const storedEssenceTab = context.system._ui.essenceSubTab ?? "power";

    // If we haven't set a local essence tab yet, adopt the stored value.
    if (!this._activeSubTabs.essence) this._activeSubTabs.essence = storedEssenceTab;

    // HBS uses system._ui.essenceSubTab for "is-active" checks
    context.system._ui.essenceSubTab = this._activeSubTabs.essence ?? storedEssenceTab ?? "power";

    /**
     * Config-backed catalogs used by dropdowns.
     */
    context.specialtyCatalog = cfg.specialtyCatalog ?? {};
    context.affinityCatalog = cfg.affinityCatalog ?? {};
    context.resistanceCatalog = cfg.resistanceCatalog ?? {};
    context.aptitudeCatalog = cfg.aptitudeCatalog ?? {};

    // Essence dropdown catalogs (required by essence.hbs)
    context.essenceCatalog = cfg.essenceCatalog ?? {};
    context.confluenceEssenceCatalog = cfg.confluenceEssenceCatalog ?? {};

    // ----------------------------
    // Essence UI state (3 essences + 1 confluence slot)
    // ----------------------------
    context.essenceUI = this._computeEssenceUI(context.system);

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

    // Essence subtabs
    this._activateTabGroup(root, {
      group: "essence",
      navSelector: '.hwfwm-tabs[data-group="essence"]',
      defaultTab: "power",
      getPersisted: () => this._activeSubTabs.essence,
      setPersisted: (t) => {
        this._activeSubTabs.essence = t;

        // Persist ONLY if it actually changed (one write per change)
        const current = this.document?.system?._ui?.essenceSubTab ?? "power";
        if (current !== t) {
          this.document?.update?.({ "system._ui.essenceSubTab": t }).catch(() => {});
        }
      },
      signal
    });

    // ---------------------------------------------------
    // Essence enforcement (capture phase, before form submit)
    // ---------------------------------------------------
    root.addEventListener(
      "change",
      async (ev) => {
        const target = ev.target;
        if (!(target instanceof HTMLSelectElement)) return;

        const name = target.getAttribute("name") ?? "";

        // Only intercept essence/confluence selects
        const isEssence = name.startsWith("system.essences.") && name.endsWith("Key");
        const isConfluence = name.startsWith("system.confluenceEssences.") && name.endsWith("Key");
        if (!isEssence && !isConfluence) return;

        // Stop Foundry's automatic submit-on-change from racing with our enforcement
        ev.preventDefault?.();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();

        const attrs = HwfwmActorSheet.ESSENCE_ATTRS;

        // Determine which attribute is being modified (power/speed/spirit/recovery)
        const attr = attrs.find((a) => name.includes(`.${a}Key`));
        if (!attr) return;

        const systemNow = this.document?.system ?? {};
        const uiNow = this._computeEssenceUI(systemNow);

        // Helpers for revert
        const revertSelect = () => {
          if (isEssence) target.value = systemNow?.essences?.[`${attr}Key`] ?? "";
          if (isConfluence) target.value = systemNow?.confluenceEssences?.[`${attr}Key`] ?? "";
        };

        // ----------------------------
        // Essence selection enforcement
        // ----------------------------
        if (isEssence) {
          const newKey = (target.value ?? "").trim();

          // Build prospective state
          const ess = foundry.utils.deepClone(systemNow?.essences ?? {});
          ess[`${attr}Key`] = newKey;

          const picked = attrs.map((a) => (ess?.[`${a}Key`] ?? "").trim()).filter(Boolean);
          const unique = new Set(picked);

          // Rule: no duplicates
          if (picked.length !== unique.size) {
            ui.notifications?.warn("You cannot select the same Essence more than once.");
            revertSelect();
            return;
          }

          // Rule: max 3 essences
          if (unique.size > 3) {
            ui.notifications?.warn("Only three Essences may be selected. The remaining slot is reserved for a Confluence Essence.");
            revertSelect();
            return;
          }

          // If dropping below 3, clear all confluence keys to keep data clean
          const shouldClearConfluence = unique.size < 3;

          const updateData = { [`system.essences.${attr}Key`]: newKey };

          if (shouldClearConfluence) {
            updateData["system.confluenceEssences.powerKey"] = "";
            updateData["system.confluenceEssences.speedKey"] = "";
            updateData["system.confluenceEssences.spiritKey"] = "";
            updateData["system.confluenceEssences.recoveryKey"] = "";
          }

          await this.document.update(updateData);
          return;
        }

        // ----------------------------
        // Confluence selection enforcement
        // ----------------------------
        if (isConfluence) {
          // Recompute unlock state from current actor state (not prospective)
          const ui = uiNow;

          if (!ui.confluenceUnlocked) {
            ui.notifications?.warn("Select three unique Essences before choosing a Confluence Essence.");
            revertSelect();
            return;
          }

          if (ui.confluenceSlot !== attr) {
            ui.notifications?.warn("Confluence Essence can only be selected in the remaining unassigned slot.");
            revertSelect();
            return;
          }

          const newKey = (target.value ?? "").trim();
          await this.document.update({ [`system.confluenceEssences.${attr}Key`]: newKey });
          return;
        }
      },
      { signal, capture: true }
    );

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

          const allowed = new Set([
            "open-item",
            "delete-item",
            "create-talent",
            "add-specialty",
            "remove-specialty",
            "add-affinity",
            "remove-affinity",
            "add-resistance",
            "remove-resistance",
            "add-aptitude",
            "remove-aptitude"
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
            const select = root.querySelector('select[name="system._ui.addSpecialtyKey"]');
            const keyFromDom = (select?.value ?? "").trim();
            const key = keyFromDom || (this.document?.system?._ui?.addSpecialtyKey ?? "");
            if (!key) return;

            const catalog = CONFIG["hwfwm-system"]?.specialtyCatalog ?? {};
            const entry = catalog[key];
            if (!entry) return;

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

            const current = foundry.utils.deepClone(this.document?.system?.specialtiesCustom ?? {});
            if (!(key in current)) return;

            delete current[key];

            await this.document.update({ "system.specialtiesCustom": current });
            return;
          }

          if (action === "add-affinity") {
            const select = root.querySelector('select[name="system._ui.addAffinityKey"]');
            const keyFromDom = (select?.value ?? "").trim();
            const key = keyFromDom || (this.document?.system?._ui?.addAffinityKey ?? "");
            if (!key) return;

            const catalog = CONFIG["hwfwm-system"]?.affinityCatalog ?? {};
            const entry = catalog[key];
            if (!entry) return;

            const has = !!this.document?.system?.affinities?.[key];
            if (has) {
              await this.document.update({ "system._ui.addAffinityKey": "" });
              return;
            }

            await this.document.update({
              [`system.affinities.${key}`]: { name: entry.name ?? key },
              "system._ui.addAffinityKey": ""
            });

            return;
          }

          if (action === "remove-affinity") {
            const key = actionBtn.dataset.key;
            if (!key) return;

            const current = foundry.utils.deepClone(this.document?.system?.affinities ?? {});
            if (!(key in current)) return;

            delete current[key];

            await this.document.update({ "system.affinities": current });
            return;
          }

          if (action === "add-resistance") {
            const select = root.querySelector('select[name="system._ui.addResistanceKey"]');
            const keyFromDom = (select?.value ?? "").trim();
            const key = keyFromDom || (this.document?.system?._ui?.addResistanceKey ?? "");
            if (!key) return;

            const catalog = CONFIG["hwfwm-system"]?.resistanceCatalog ?? {};
            const entry = catalog[key];
            if (!entry) return;

            const has = !!this.document?.system?.resistances?.[key];
            if (has) {
              await this.document.update({ "system._ui.addResistanceKey": "" });
              return;
            }

            await this.document.update({
              [`system.resistances.${key}`]: { name: entry.name ?? key },
              "system._ui.addResistanceKey": ""
            });

            return;
          }

          if (action === "remove-resistance") {
            const key = actionBtn.dataset.key;
            if (!key) return;

            const current = foundry.utils.deepClone(this.document?.system?.resistances ?? {});
            if (!(key in current)) return;

            delete current[key];

            await this.document.update({ "system.resistances": current });
            return;
          }

          if (action === "add-aptitude") {
            const select = root.querySelector('select[name="system._ui.addAptitudeKey"]');
            const keyFromDom = (select?.value ?? "").trim();
            const key = keyFromDom || (this.document?.system?._ui?.addAptitudeKey ?? "");
            if (!key) return;

            const catalog = CONFIG["hwfwm-system"]?.aptitudeCatalog ?? {};
            const entry = catalog[key];
            if (!entry) return;

            const has = !!this.document?.system?.aptitudes?.[key];
            if (has) {
              await this.document.update({ "system._ui.addAptitudeKey": "" });
              return;
            }

            await this.document.update({
              [`system.aptitudes.${key}`]: { name: entry.name ?? key },
              "system._ui.addAptitudeKey": ""
            });

            return;
          }

          if (action === "remove-aptitude") {
            const key = actionBtn.dataset.key;
            if (!key) return;

            const current = foundry.utils.deepClone(this.document?.system?.aptitudes ?? {});
            if (!(key in current)) return;

            delete current[key];

            await this.document.update({ "system.aptitudes": current });
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
