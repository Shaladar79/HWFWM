// scripts/sheets/actor/context.mjs

import { computeEssenceUI } from "./essence.mjs";
import { getFlatMiscCatalog } from "./treasures-misc.mjs";

/**
 * Build the actor sheet context.
 * @param {HwfwmActorSheet} sheet
 * @param {object} baseContext - result of super._prepareContext(options)
 * @param {object} options
 */
export async function buildActorSheetContext(sheet, baseContext, options) {
  const context = baseContext ?? {};
  const cfg = CONFIG["hwfwm-system"] ?? {};

  context.system = sheet.document?.system ?? context.system ?? {};

  // options
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

  const details = sheet.document?.system?.details ?? {};
  context.details = {
    roleKey: details.roleKey ?? "",
    rankKey: details.rankKey ?? "",
    raceKey: details.raceKey ?? "",
    backgroundKey: details.backgroundKey ?? ""
  };

  // ---------------------------------------------------------------------------
  // DERIVED RANK (Header)
  // ---------------------------------------------------------------------------
  // Tier values per rankKey: normal 0, iron 1, bronze 2, silver 3, gold 4, diamond 5
  // This should live in config eventually; until then we default here.
  const rankTierValues =
    cfg.rankTierValues ??
    {
      normal: 0,
      iron: 1,
      bronze: 2,
      silver: 3,
      gold: 4,
      diamond: 5
    };

  function deriveRankKeyFromTierTotal(total) {
    const t = Number(total) || 0;
    if (t >= 20) return "diamond";
    if (t >= 16) return "gold";
    if (t >= 12) return "silver";
    if (t >= 8) return "bronze";
    if (t >= 4) return "iron";
    return "normal";
  }

  // NOW LOCKED: We only read from the actual actor schema:
  // system.attributes.<attr>.rankKey
  const sys = context.system ?? {};
  const attrRankKeys = {
    power: sys.attributes?.power?.rankKey ?? "normal",
    speed: sys.attributes?.speed?.rankKey ?? "normal",
    spirit: sys.attributes?.spirit?.rankKey ?? "normal",
    recovery: sys.attributes?.recovery?.rankKey ?? "normal"
  };

  const derivedRankTotal =
    (rankTierValues[attrRankKeys.power] ?? 0) +
    (rankTierValues[attrRankKeys.speed] ?? 0) +
    (rankTierValues[attrRankKeys.spirit] ?? 0) +
    (rankTierValues[attrRankKeys.recovery] ?? 0);

  const derivedRankKey = deriveRankKeyFromTierTotal(derivedRankTotal);
  const derivedRankLabel = ranks?.[derivedRankKey] ?? derivedRankKey;

  // Expose to templates (header)
  context.derivedRankTotal = derivedRankTotal;
  context.derivedRankKey = derivedRankKey;
  context.derivedRankLabel = derivedRankLabel;

    // ---------------------------------------------------------------------------
  // Overview: Rank label + description (read-only)
  // ---------------------------------------------------------------------------
  const rankDescriptions = cfg.rankDescriptions ?? {};
  context.overviewRankLabel = derivedRankLabel;

  // Fall back to a safe placeholder if we haven't authored the text yet
  context.overviewRankDescription =
    rankDescriptions?.[derivedRankKey] ?? "Rank description not yet defined.";

  // Optional debugging
  context._attrRankKeys = attrRankKeys;

  // Items
  const items = Array.from(sheet.document?.items ?? []);
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

  // UI state holder
  context.system._ui = context.system._ui ?? {};
  context.system._ui.addSpecialtyKey = context.system._ui.addSpecialtyKey ?? "";
  context.system._ui.addAffinityKey = context.system._ui.addAffinityKey ?? "";
  context.system._ui.addResistanceKey = context.system._ui.addResistanceKey ?? "";
  context.system._ui.addAptitudeKey = context.system._ui.addAptitudeKey ?? "";
  context.system._ui.addMiscItemKey = context.system._ui.addMiscItemKey ?? "";

  // Subtab persistence
  const storedEssenceTab = context.system._ui.essenceSubTab ?? "power";
  if (!sheet._activeSubTabs.essence) sheet._activeSubTabs.essence = storedEssenceTab;
  context.system._ui.essenceSubTab = sheet._activeSubTabs.essence ?? storedEssenceTab ?? "power";

  const storedTreasuresTab = context.system._ui.treasuresSubTab ?? "equipment";
  if (!sheet._activeSubTabs.treasures) sheet._activeSubTabs.treasures = storedTreasuresTab;
  context.system._ui.treasuresSubTab =
    sheet._activeSubTabs.treasures ?? storedTreasuresTab ?? "equipment";

  // catalogs
  context.specialtyCatalog = cfg.specialtyCatalog ?? {};
  context.affinityCatalog = cfg.affinityCatalog ?? {};
  context.resistanceCatalog = cfg.resistanceCatalog ?? {};
  context.aptitudeCatalog = cfg.aptitudeCatalog ?? {};
  context.essenceCatalog = cfg.essenceCatalog ?? {};
  context.confluenceEssenceCatalog = cfg.confluenceEssenceCatalog ?? {};

  // IMPORTANT: always provide a FLAT misc catalog
  context.miscItemCatalog = getFlatMiscCatalog();

  // Essence UI
  context.essenceUI = computeEssenceUI(sheet, context.system);

  // Treasures: items
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

  // Misc actor-data
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
