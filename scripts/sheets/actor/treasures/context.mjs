// scripts/sheets/actor/treasures/context.mjs
//
// Phase 2 (Extraction): Treasures context builder
// - NO behavior changes vs prior inline logic in scripts/sheets/actor/context.mjs
// - Returns the same arrays used by existing templates:
//   allEquipment, equippedEquipment, allConsumables, allMiscItems

/**
 * Build Treasures-related context.
 *
 * @param {HwfwmActorSheet} sheet
 * @param {object} context - actor sheet context (must include system + miscItemCatalog)
 * @param {object} deps
 * @param {Array} deps.items - precomputed items array (Array.from(sheet.document.items))
 * @param {Function} deps.getRarityValueRule - rarity rule lookup function
 * @returns {Promise<{allEquipment:Array, equippedEquipment:Array, allConsumables:Array, allMiscItems:Array}>}
 */
export async function buildTreasuresContext(sheet, context, deps = {}) {
  const items = Array.isArray(deps.items) ? deps.items : Array.from(sheet.document?.items ?? []);
  const getRarityValueRule =
    typeof deps.getRarityValueRule === "function" ? deps.getRarityValueRule : () => ({ coin: "", mult: 1 });

  // ---------------------------------------------------------------------------
  // Treasures: Items (Equipment + Consumables)
  // ---------------------------------------------------------------------------
  const coerceBool = (v) => {
    if (v === true) return true;
    if (v === false) return false;

    const s = String(v ?? "").trim().toLowerCase();
    if (["1", "true", "yes", "y", "on"].includes(s)) return true;
    if (["0", "false", "no", "n", "off", ""].includes(s)) return false;

    return false;
  };

  const clampInt = (v, fallback = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  };

  const equipment = items
    .filter((it) => it?.type === "equipment")
    .map((it) => ({
      id: it.id,
      name: it.name,
      category: String(it.system?.type ?? "misc"),
      equipped: coerceBool(it.system?.equipped),
      notes: it.system?.notes ?? ""
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const consumables = items
    .filter((it) => it?.type === "consumable")
    .map((it) => ({
      id: it.id,
      name: it.name,
      quantity: clampInt(it.system?.quantity ?? 0, 0),
      readied: coerceBool(it.system?.readied),
      notes: it.system?.notes ?? ""
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ---------------------------------------------------------------------------
  // Inventory: Misc actor-data (lightweight) + catalog metadata for display
  // ---------------------------------------------------------------------------
  const misc = context?.system?.treasures?.miscItems ?? {};
  const miscCatalog = context?.miscItemCatalog ?? {};

  const normStr = (v) => String(v ?? "").trim();
  const clampNonNegInt = (v, fallback = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  };

  const supportsRank = (catEntry) => {
    if (!catEntry || typeof catEntry !== "object") return false;
    if (catEntry.hasRank === true) return true;
    const g = normStr(catEntry.group);
    return g === "Quintessence" || g === "Food Ingredients";
  };

  const toNumberNonNeg = (v, fallback = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, n);
  };

  const formatCoinValue = (amount, coin) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "";
    const txt = Number.isInteger(n) ? String(n) : String(n);
    const c = normStr(coin);
    return c ? `${txt} ${c}` : txt;
  };

  const miscEntries = Object.entries(misc).map(([key, data]) => {
    const cat = miscCatalog?.[key] ?? null;

    // Catalog-driven display; actor-stored name is fallback cache only
    const name = normStr(cat?.name ?? data?.name ?? key);

    // Keep rows stable; quantity should not be negative and should render at least 1 if absent
    const quantity = Math.max(1, clampNonNegInt(data?.quantity ?? 1, 1));

    const category = normStr(cat?.group ?? cat?.category ?? "");
    const hasRank = supportsRank(cat);
    const rank = hasRank ? normStr(data?.rank ?? "") : "";

    // rarity/value numeric + derived display (coin + multiplier)
    const rarity = normStr(data?.rarity ?? cat?.rarity ?? "common") || "common";
    const baseValue = toNumberNonNeg(data?.value ?? cat?.value ?? 1, 1);

    const rule = getRarityValueRule(rarity);
    const coin = normStr(rule?.coin ?? "");
    const mult = toNumberNonNeg(rule?.mult ?? 1, 1);

    const perUnitValue = baseValue * mult;
    const totalValue = perUnitValue * quantity;

    const displayValue = formatCoinValue(perUnitValue, coin);
    const displayTotalValue = formatCoinValue(totalValue, coin);

    const missingFromCatalog = !cat;

    return {
      key,
      name,
      category,
      quantity,
      hasRank,
      rank,

      // read-only UI fields
      rarity,
      value: baseValue,
      displayValue, // e.g. "20 LSC"
      totalValue: displayTotalValue, // e.g. "60 LSC"

      // useful if later you want to sort/filter by numeric wealth
      _coin: coin,
      _mult: mult,
      _baseValue: baseValue,
      _perUnitValue: perUnitValue,
      _totalValue: totalValue,

      missingFromCatalog
    };
  });

  miscEntries.sort((a, b) => a.name.localeCompare(b.name));

  return {
    allEquipment: equipment,
    equippedEquipment: equipment.filter((it) => it.equipped === true),
    allConsumables: consumables,
    allMiscItems: miscEntries
  };
}
