// scripts/sheets/actor/context.mjs

import { computeEssenceUI } from "./essence.mjs";
import { getFlatMiscCatalog } from "./treasures-misc.mjs";
import {
  BACKGROUND_DESCRIPTIONS,
  BACKGROUND_GRANTED_SPECIALTIES
} from "../../../config/backgrounds.mjs"; // ✅ FIXED PATH

// ✅ NEW: race grants (derived-only visibility; no persistence)
import { RACE_GRANTED_AFFINITIES, RACE_GRANTED_APTITUDES } from "../../../config/races.mjs";

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
  // Ensure required nested paths exist for templates (prevents silent undefined)
  // ---------------------------------------------------------------------------
  const sys = context.system ?? {};
  sys.resources = sys.resources ?? {};
  sys.resources.mana = sys.resources.mana ?? { value: 0, max: 0 };
  sys.resources.stamina = sys.resources.stamina ?? { value: 0, max: 0 };
  sys.resources.lifeForce = sys.resources.lifeForce ?? { value: 0, max: 0 };

  // NEW: read-only derived display fields (may be set by actor.mjs; default to 0)
  sys.resources.mana.recovery = Number.isFinite(Number(sys.resources.mana.recovery))
    ? Number(sys.resources.mana.recovery)
    : 0;
  sys.resources.stamina.recovery = Number.isFinite(Number(sys.resources.stamina.recovery))
    ? Number(sys.resources.stamina.recovery)
    : 0;
  sys.resources.lifeForce.recovery = Number.isFinite(Number(sys.resources.lifeForce.recovery))
    ? Number(sys.resources.lifeForce.recovery)
    : 0;
  sys.resources.naturalArmor = Number.isFinite(Number(sys.resources.naturalArmor))
    ? Number(sys.resources.naturalArmor)
    : 0;

  context.system = sys;

  // ---------------------------------------------------------------------------
  // DERIVED RANK (Header)
  // ---------------------------------------------------------------------------
  // Prefer authoritative derived rank from actor.prepareDerivedData().
  // Fallback to local computation if not available.
  const derivedFromActorKey = sys?._derived?.rankKey ?? null;
  const derivedFromActorLabel = sys?._derived?.rankLabel ?? null;

  if (derivedFromActorKey) {
    const derivedRankKey = String(derivedFromActorKey);
    const derivedRankLabel = String(
      derivedFromActorLabel ?? (ranks?.[derivedRankKey] ?? derivedRankKey)
    );
    const derivedRankTotal = Number(sys?._derived?.rankTierTotal ?? 0);

    context.derivedRankTotal = derivedRankTotal;
    context.derivedRankKey = derivedRankKey;
    context.derivedRankLabel = derivedRankLabel;
  } else {
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

    // Optional debugging
    context._attrRankKeys = attrRankKeys;
  }

  // ---------------------------------------------------------------------------
  // Overview: Rank label + description (read-only)
  // ---------------------------------------------------------------------------
  const rankDescriptions = cfg.rankDescriptions ?? {};
  context.overviewRankLabel = context.derivedRankLabel;

  // Fall back to a safe placeholder if we haven't authored the text yet
  context.overviewRankDescription =
    rankDescriptions?.[context.derivedRankKey] ?? "Rank description not yet defined.";

  // ---------------------------------------------------------------------------
  // Overview: Background description (read-only)
  // ---------------------------------------------------------------------------
  const bgKey = context.details?.backgroundKey ?? "";
  context.overviewBackgroundLabel = backgrounds?.[bgKey] ?? (bgKey || "—");
  context.overviewBackgroundDescription =
    BACKGROUND_DESCRIPTIONS?.[bgKey] ?? (bgKey ? "Background description not yet defined." : "—");

  // Items
  const items = Array.from(sheet.document?.items ?? []);
  const grantedSources = new Set(["race", "role", "background", "rank"]);

  context.grantedFeatures = items
    .filter((it) => it?.type === "feature")
    .filter((it) => grantedSources.has(it?.system?.source))
    .map((it) => ({ id: it.id, name: it.name, source: it.system?.source ?? "" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // NEW: subset views for Traits → Features tab (do NOT remove from grantedFeatures)
  context.raceFeatures = context.grantedFeatures.filter((it) => String(it?.source ?? "") === "race");
  context.roleFeatures = context.grantedFeatures.filter((it) => String(it?.source ?? "") === "role");

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

  // ---------------------------------------------------------------------------
  // Traits: Effective Specialties (manual + granted by background)
  // ---------------------------------------------------------------------------
  const manualSpecialties = sys.specialties ?? {};
  const grantedByBackground = BACKGROUND_GRANTED_SPECIALTIES?.[bgKey] ?? [];

  // Union keys: manual entries + granted keys
  const effectiveKeys = new Set([...Object.keys(manualSpecialties), ...grantedByBackground]);

  const effectiveSpecialties = Array.from(effectiveKeys)
    .map((key) => {
      const meta = context.specialtyCatalog?.[key] ?? null;
      const owned = manualSpecialties?.[key] ?? null;
      const isGranted = grantedByBackground.includes(key);

      return {
        key,
        // meta (reference)
        name: meta?.name ?? key,
        attribute: meta?.attribute ?? "",
        description: meta?.description ?? "",
        // actor-owned progression
        score: Number(owned?.score ?? 0),
        // provenance
        isGranted,
        source: owned?.source ?? (isGranted ? "background" : "manual")
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  context.effectiveSpecialties = effectiveSpecialties;

  // ---------------------------------------------------------------------------
  // Enhancements: Race-granted Affinities + Aptitudes (DERIVED-ONLY, VISIBILITY)
  // ---------------------------------------------------------------------------
  const raceKey = String(context.details?.raceKey ?? "").trim();

  // Ensure collections exist so #each does not silently noop
  sys.affinities = sys.affinities ?? {};
  sys.aptitudes = sys.aptitudes ?? {};
  sys.resistances = sys.resistances ?? {};

  const ownedAffinities = sys.affinities ?? {};
  const ownedAptitudes = sys.aptitudes ?? {};
  const ownedResistances = sys.resistances ?? {};

  const raceAffinityKeys = Array.isArray(RACE_GRANTED_AFFINITIES?.[raceKey])
    ? RACE_GRANTED_AFFINITIES[raceKey]
    : [];

  const raceAptitudeKeys = Array.isArray(RACE_GRANTED_APTITUDES?.[raceKey])
    ? RACE_GRANTED_APTITUDES[raceKey]
    : [];

  // Build merged affinities (owned wins)
  {
    const keys = new Set([...Object.keys(ownedAffinities), ...raceAffinityKeys]);
    const merged = {};

    for (const key of keys) {
      if (!key) continue;

      // Owned entry takes precedence
      if (ownedAffinities?.[key]) {
        merged[key] = ownedAffinities[key];
        continue;
      }

      const meta = context.affinityCatalog?.[key] ?? null;
      merged[key] = {
        key,
        name: meta?.name ?? key,
        source: "race",
        granted: true,
        _derivedOnly: true
      };
    }

    context.system.affinities = merged;
  }

  // Build merged aptitudes (owned wins)
  {
    const keys = new Set([...Object.keys(ownedAptitudes), ...raceAptitudeKeys]);
    const merged = {};

    for (const key of keys) {
      if (!key) continue;

      if (ownedAptitudes?.[key]) {
        merged[key] = ownedAptitudes[key];
        continue;
      }

      const meta = context.aptitudeCatalog?.[key] ?? null;
      merged[key] = {
        key,
        name: meta?.name ?? key,
        source: "race",
        granted: true,
        _derivedOnly: true
      };
    }

    context.system.aptitudes = merged;
  }

  // Resistances: unchanged (owned only) until you define grant rules/math
  context.system.resistances = ownedResistances;

  // IMPORTANT: always provide a FLAT misc catalog
  context.miscItemCatalog = getFlatMiscCatalog();

  // Essence UI
  context.essenceUI = computeEssenceUI(sheet, context.system);

  // ---------------------------------------------------------------------------
  // Treasures: Equipment (boolean equip wiring + derived display fields)
  // ---------------------------------------------------------------------------

  const toNum = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const equipmentDocs = items.filter((it) => it?.type === "equipment");

  const mapEquipmentRow = (it) => {
    const s = it.system ?? {};
    const type = String(s.type ?? s.category ?? "misc"); // prefer canonical system.type
    const equippedBool = s.equipped === true; // strict boolean is authoritative

    // Back-compat for older templates that used "yes"/"no" strings:
    const equipped = equippedBool ? "yes" : "no";

    // Generic display helpers
    const img = it.img ?? "";
    const itemRank = String(s.itemRank ?? "normal");
    const legendary = s.legendary === true;

    const base = {
      id: it.id,
      name: it.name,
      img,
      itemRank,
      legendary,

      // canonical + compatibility fields
      type, // preferred name going forward
      category: type, // legacy field name used by older templates
      equippedBool,
      equipped, // legacy yes/no string

      notes: s.notes ?? ""
    };

    if (type === "weapon") {
      return {
        ...base,
        weaponCategory: String(s.weapon?.category ?? ""),
        weaponType: String(s.weapon?.weaponType ?? ""),
        damagePerSuccess: toNum(s.weapon?.totalDamagePerSuccess ?? s.weapon?.damagePerSuccess ?? 0, 0),
        actionCost: toNum(s.weapon?.totalActionCost ?? s.weapon?.actionCost ?? 0, 0),
        range: toNum(s.weapon?.range ?? 0, 0)
      };
    }

    if (type === "armor") {
      return {
        ...base,
        armorClass: String(s.armor?.armorType ?? ""),
        armorName: String(s.armor?.armorName ?? ""),
        totalArmor: toNum(s.armor?.totalArmor ?? s.armor?.value ?? 0, 0)
      };
    }

    // misc
    return {
      ...base,
      miscArmor: toNum(s.misc?.armor ?? 0, 0)
    };
  };

  const equipment = equipmentDocs
    .map(mapEquipmentRow)
    .sort((a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")));

  // Flat list (for any existing templates)
  context.allEquipment = equipment;

  // Equipped list (boolean authoritative)
  context.equippedEquipment = equipment.filter((it) => it.equippedBool === true);

  // Categorized lists (recommended for new actor equipment UI)
  context.equipmentWeapons = equipment.filter((it) => it.type === "weapon");
  context.equipmentArmors = equipment.filter((it) => it.type === "armor");
  context.equipmentMisc = equipment.filter((it) => it.type === "misc");

  // ---------------------------------------------------------------------------
  // Treasures: Consumables (unchanged)
  // ---------------------------------------------------------------------------

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
