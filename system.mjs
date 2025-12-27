import { HWFWM_CONFIG } from "./config/index.mjs";
import { HwfwmActorSheet } from "./scripts/sheets/actor-sheet.mjs";

// Essence Ability sheet class (imported)
import { HwfwmEssenceAbilitySheet } from "./scripts/sheets/essence-ability-sheet.mjs";

/* --------------------------------------------
 * Minimal Item Sheets (placeholder)
 * -------------------------------------------- */

class HwfwmFeatureSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "feature"],
      width: 520,
      height: 420
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/feature-sheet.hbs";
  }
}

class HwfwmTalentSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["hwfwm-system", "sheet", "item", "talent"],
      width: 520,
      height: 420
    });
  }

  get template() {
    return "systems/hwfwm-system/templates/item/talent-sheet.hbs";
  }
}

Hooks.once("init", async () => {
  console.log("HWFWM System | Initialized");

  // Register system-wide config namespace
  CONFIG["hwfwm-system"] = HWFWM_CONFIG;

  // Helper used by the sheet templates
  Handlebars.registerHelper("eq", (a, b) => a === b);

  // Preload actor sheet templates + partials (required when using {{> partial }})
  await loadTemplates([
    "systems/hwfwm-system/templates/actor/actor-sheet.hbs",

    // Parts
    "systems/hwfwm-system/templates/actor/parts/header.hbs",
    "systems/hwfwm-system/templates/actor/parts/tabs-nav.hbs",

    // Tabs
    "systems/hwfwm-system/templates/actor/tabs/overview.hbs",
    "systems/hwfwm-system/templates/actor/tabs/attributes.hbs",
    "systems/hwfwm-system/templates/actor/tabs/status.hbs",
    "systems/hwfwm-system/templates/actor/tabs/traits.hbs",
    "systems/hwfwm-system/templates/actor/tabs/essence.hbs",

    // Tab Sections
    "systems/hwfwm-system/templates/actor/tabs/status/attributes.hbs",
    "systems/hwfwm-system/templates/actor/tabs/status/resources.hbs",
    "systems/hwfwm-system/templates/actor/tabs/traits/enhancements.hbs",
    "systems/hwfwm-system/templates/actor/tabs/traits/features.hbs",

    // Item sheets (placeholders)
    "systems/hwfwm-system/templates/item/feature-sheet.hbs",
    "systems/hwfwm-system/templates/item/talent-sheet.hbs",
    "systems/hwfwm-system/templates/item/essence-ability-sheet.hbs"
  ]);

  // v13+ namespaced Actors collection (avoids deprecation warning)
  const ActorsCollection = foundry.documents.collections.Actors;

  // Register our sheet for PC actors only
  ActorsCollection.registerSheet("hwfwm-system", HwfwmActorSheet, {
    types: ["pc"],
    makeDefault: true,
    label: "HWFWM PC Sheet"
  });

  // Register Item sheets
  if (typeof Items !== "undefined") {
    Items.registerSheet("hwfwm-system", HwfwmFeatureSheet, {
      types: ["feature"],
      makeDefault: true,
      label: "HWFWM Feature Sheet"
    });

    Items.registerSheet("hwfwm-system", HwfwmTalentSheet, {
      types: ["talent"],
      makeDefault: true,
      label: "HWFWM Talent Sheet"
    });

    Items.registerSheet("hwfwm-system", HwfwmEssenceAbilitySheet, {
      types: ["essenceAbility"],
      makeDefault: true,
      label: "HWFWM Essence Ability Sheet"
    });
  }
});
