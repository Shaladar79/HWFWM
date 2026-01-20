import { HWFWM_CONFIG } from "./config/index.mjs";
import { HwfwmActorSheet } from "./scripts/sheets/actor/actor-sheet.mjs";
import { HwfwmActor } from "./scripts/documents/actor.mjs";

// Item document class (normalization + derived data wiring)
import { HwfwmItem } from "./config/items.mjs";

// Item sheet classes
import { HwfwmFeatureSheet } from "./scripts/sheets/items/feature-sheet.mjs";
import { HwfwmTalentSheet } from "./scripts/sheets/items/talent-sheet.mjs";
import { HwfwmAbilitySheet } from "./scripts/sheets/items/ability-sheet.mjs";
import { HwfwmEquipmentSheet } from "./scripts/sheets/items/equipment-sheet.mjs";
import { HwfwmConsumableSheet } from "./scripts/sheets/items/consumable-sheet.mjs";
import { HwfwmMiscItemSheet } from "./scripts/sheets/items/miscitem-sheet.mjs";

// Equipment compendium folder bootstrap (AWAITABLE)
import { bootstrapEquipmentPackFolders } from "./scripts/init/compendiums/equipment-pack.mjs";

// Equipment compendium item seeding (idempotent, non-destructive)
import { seedEquipmentCompendium } from "./scripts/init/compendiums/equipment-seed.mjs";

// NEW: Talents compendium folder bootstrap + seeding
import { bootstrapTalentsPackFolders } from "./scripts/init/compendiums/talents-pack.mjs";
import { seedTalentsCompendium } from "./scripts/init/compendiums/talents-seed.mjs";

// ✅ NEW: Misc Items Catalog (flat dictionary) -> CONFIG["hwfwm-system"].miscItemCatalog
// Adjust path if your file is elsewhere.
import { HWFWM_MISC_ITEMS } from "./config/misc-items.mjs";

// ✅ NEW: rarity value rules -> CONFIG["hwfwm-system"].rarityValueRules
import { HWFWM_RARITY_VALUE_RULES } from "./config/rarities.mjs";

// If you do NOT see this, system.mjs is not being loaded at all.
console.log("HWFWM System | system.mjs module loaded");

Hooks.once("init", async () => {
  console.log("HWFWM System | Initialized (init hook fired)");

  // Register system-wide config namespace
  CONFIG["hwfwm-system"] = HWFWM_CONFIG;

  // ✅ NEW: register misc item catalog into CONFIG so sheet dropdowns can populate
  CONFIG["hwfwm-system"].miscItemCatalog = HWFWM_MISC_ITEMS;

  // ✅ NEW: register rarity rules centrally for UI + derived math references
  CONFIG["hwfwm-system"].rarityValueRules = HWFWM_RARITY_VALUE_RULES;

  // Register Actor + Item document classes (derived data engines)
  CONFIG.Actor.documentClass = HwfwmActor;
  CONFIG.Item.documentClass = HwfwmItem;

  // ---------------------------------------------------------
  // Handlebars helpers used by templates
  // ---------------------------------------------------------
  Handlebars.registerHelper("eq", (a, b) => a === b);

  // Needed by templates (you are using {{or ...}} and {{not ...}})
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("not", (v) => !v);

  // ✅ NEW: Needed by templates (e.g., treasures equipment subtab hardening)
  Handlebars.registerHelper("and", (...args) => args.slice(0, -1).every(Boolean));

  // Preload actor + item sheet templates
  // V13+: loadTemplates is namespaced under foundry.applications.handlebars
  await foundry.applications.handlebars.loadTemplates([
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
    "systems/hwfwm-system/templates/actor/tabs/treasures.hbs",

    // ✅ NEW: Treasures split templates (Phase 1)
    "systems/hwfwm-system/templates/actor/tabs/treasures/coins.hbs",
    "systems/hwfwm-system/templates/actor/tabs/treasures/equipment.hbs",
    "systems/hwfwm-system/templates/actor/tabs/treasures/inventory-equipment.hbs",
    "systems/hwfwm-system/templates/actor/tabs/treasures/consumables.hbs",
    "systems/hwfwm-system/templates/actor/tabs/treasures/misc.hbs",

    // ✅ NEW: Phase 4 (optional) wealth summary partial
    "systems/hwfwm-system/templates/actor/tabs/treasures/wealth-summary.hbs",

    // Tab Sections
    "systems/hwfwm-system/templates/actor/tabs/status/attributes.hbs",
    "systems/hwfwm-system/templates/actor/tabs/status/resources.hbs",
    "systems/hwfwm-system/templates/actor/tabs/traits/enhancements.hbs",
    "systems/hwfwm-system/templates/actor/tabs/traits/features.hbs",

    // Item sheets
    "systems/hwfwm-system/templates/item/feature-sheet.hbs",
    "systems/hwfwm-system/templates/item/talent-sheet.hbs",
    "systems/hwfwm-system/templates/item/ability-sheet.hbs",
    "systems/hwfwm-system/templates/item/equipment-sheet.hbs",
    "systems/hwfwm-system/templates/item/consumable-sheet.hbs",
    "systems/hwfwm-system/templates/item/miscitem-sheet.hbs"
  ]);

  // v13+ namespaced collections (avoids deprecation warnings)
  const ActorsCollection = foundry.documents.collections.Actors;
  const ItemsCollection = foundry.documents.collections.Items;

  // ---------------------------------------------------------
  // Actor Sheets
  // ---------------------------------------------------------
  ActorsCollection.unregisterSheet("core", foundry.applications.sheets.ActorSheetV2);
  ActorsCollection.registerSheet("hwfwm-system", HwfwmActorSheet, {
    types: ["pc"],
    makeDefault: true,
    label: "HWFWM PC Sheet"
  });

  // ---------------------------------------------------------
  // Item Sheets
  // ---------------------------------------------------------
  ItemsCollection.unregisterSheet("core", foundry.applications.sheets.ItemSheetV2);

  ItemsCollection.registerSheet("hwfwm-system", HwfwmFeatureSheet, {
    types: ["feature"],
    makeDefault: true,
    label: "HWFWM Feature Sheet"
  });

  ItemsCollection.registerSheet("hwfwm-system", HwfwmTalentSheet, {
    types: ["talent"],
    makeDefault: true,
    label: "HWFWM Talent Sheet"
  });

  ItemsCollection.registerSheet("hwfwm-system", HwfwmAbilitySheet, {
    types: ["ability"],
    makeDefault: true,
    label: "HWFWM Ability Sheet"
  });

  ItemsCollection.registerSheet("hwfwm-system", HwfwmEquipmentSheet, {
    types: ["equipment"],
    makeDefault: true,
    label: "HWFWM Equipment Sheet"
  });

  ItemsCollection.registerSheet("hwfwm-system", HwfwmConsumableSheet, {
    types: ["consumable"],
    makeDefault: true,
    label: "HWFWM Consumable Sheet"
  });

  ItemsCollection.registerSheet("hwfwm-system", HwfwmMiscItemSheet, {
    types: ["miscItem"],
    makeDefault: true,
    label: "HWFWM Misc Item Sheet"
  });
});

/**
 * IMPORTANT CHANGE:
 * We are disabling automatic equipment folder/bootstrap+seed on world entry because:
 *  - you reported world-level folders being created repeatedly (symptom of folder creation targeting game.folders)
 *  - equipment folder placement still needs community input/debugging
 *
 * You can still run these manually from the console as GM:
 *   await bootstrapEquipmentPackFolders();
 *   await seedEquipmentCompendium();
 *
 * Talents automation IS enabled below (folders -> seed), since this is the next compendium workflow.
 */

// NEW: Talents ready hook: folders FIRST (awaited), then seed (awaited)
Hooks.once("ready", async () => {
  console.log("HWFWM System | Ready hook fired (talents folders -> talents seed)");

  if (!game?.user?.isGM) {
    console.log("HWFWM System | Talents workflow skipped (not GM)");
    return;
  }

  try {
    console.time("HWFWM | talents bootstrap+seed");

    console.time("HWFWM | talents folders");
    await bootstrapTalentsPackFolders();
    console.timeEnd("HWFWM | talents folders");

    console.time("HWFWM | talents seeding");
    await seedTalentsCompendium();
    console.timeEnd("HWFWM | talents seeding");

    console.timeEnd("HWFWM | talents bootstrap+seed");
    console.log("HWFWM System | Talents ready workflow complete");
  } catch (err) {
    console.error("HWFWM System | Talents ready workflow failed", err);
  }
});

// (equipment ready hook remains intentionally disabled)
// Hooks.once("ready", async () => {
//   console.log("HWFWM System | Ready hook fired (folders -> seed)");

//   // Only the GM should mutate compendiums.
//   if (!game?.user?.isGM) {
//     console.log("HWFWM System | Ready workflow skipped (not GM)");
//     return;
//   }

//   try {
//     console.time("HWFWM | equipment bootstrap+seed");

//     console.time("HWFWM | equipment folders");
//     await bootstrapEquipmentPackFolders();
//     console.timeEnd("HWFWM | equipment folders");

//     console.time("HWFWM | equipment seeding");
//     await seedEquipmentCompendium();
//     console.timeEnd("HWFWM | equipment seeding");

//     console.timeEnd("HWFWM | equipment bootstrap+seed");
//     console.log("HWFWM System | Ready workflow complete");
//   } catch (err) {
//     console.error("HWFWM System | Ready workflow failed (folders/seed)", err);
//   }
// });
