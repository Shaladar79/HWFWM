// scripts/sheets/actor/treasures/context.mjs
//
// Phase 2 (Extraction): Treasures context builder
// - NO behavior changes vs prior inline logic in scripts/sheets/actor/context.mjs
// - Returns the same arrays used by existing templates:
//   allEquipment, equippedEquipment, allConsumables, allMiscItems

import { buildMiscRows } from "./misc.mjs";

function clampNonNegInt(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function formatCoinAmount(amount, label) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "0";
  const txt = Number.isInteger(n) ? String(n) : String(n);
  return label ? `${txt} ${label}` : txt;
}

/**
 * Aggregate misc rows into totals by rarity.
 * Produces formatted strings (e.g., "60 LSC") where possible.
 *
 * NOTE: If different rarities map to different coins, each rarity remains in its own coin unit.
 * We do not attempt cross-coin conversion here.
 */
function summarizeMiscByRarity(miscRows) {
  const acc = new Map(); // rarity -> { coin, total }
  for (const r of miscRows ?? []) {
    const rarity = String(r?.rarity ?? "common").trim() || "common";
    const coin = String(r?._coin ?? "").trim();
    const total = Number(r?._totalValue ?? 0);

    if (!Number.isFinite(total) || total <= 0) continue;

    const prev = acc.get(rarity);
    if (!prev) {
      acc.set(rarity, { coin, total });
      continue;
    }

    // If coin differs within same rarity (should not happen if rules are consistent),
    // we still add totals but preserve the first coin label.
    prev.total += total;
  }

  const out = {};
  for (const [rarity, { coin, total }] of acc.entries()) {
    out[rarity] = formatCoinAmount(total, coin);
  }

  // Stable ordering (alphabetical) for template iteration
  return Object.fromEntries(Object.entries(out).sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * Build Treasures-related context.
 *
 * @param {HwfwmActorSheet} sheet
 * @param {object} context - actor sheet context (must include system + miscItemCatalog)
 * @param {object} deps
 * @param {Array} deps.items - precomputed items array (Array.from(sheet.document.items))
 * @param {Function} deps.getRarityValueRule - rarity rule lookup function
 * @returns {Promise<{allEquipment:Array, equippedEquipment:Array, allConsumables:Array, allMiscItems:Array, treasures: object}>}
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
  // Inventory: Misc actor-data + catalog metadata for display (Phase 3 isolated)
  // ---------------------------------------------------------------------------
  const miscCatalog = context?.miscItemCatalog ?? {};
  const { rows: miscEntries } = buildMiscRows({
    system: context?.system ?? {},
    miscCatalog,
    getRarityValueRule,
    debug: false
  });

  // ---------------------------------------------------------------------------
  // Phase 4 (Optional): Wealth summary
  // ---------------------------------------------------------------------------
  const coins = context?.system?.treasures?.coins ?? {};
  const coinsSummary = {
    LSC: formatCoinAmount(clampNonNegInt(coins.lesser ?? 0, 0), "LSC"),
    ISC: formatCoinAmount(clampNonNegInt(coins.iron ?? 0, 0), "ISC"),
    BSC: formatCoinAmount(clampNonNegInt(coins.bronze ?? 0, 0), "BSC"),
    SSC: formatCoinAmount(clampNonNegInt(coins.silver ?? 0, 0), "SSC"),
    GSC: formatCoinAmount(clampNonNegInt(coins.gold ?? 0, 0), "GSC"),
    DSC: formatCoinAmount(clampNonNegInt(coins.diamond ?? 0, 0), "DSC")
  };

  const wealthSummary = {
    coins: coinsSummary,
    byRarity: summarizeMiscByRarity(miscEntries)
  };

  return {
    allEquipment: equipment,
    equippedEquipment: equipment.filter((it) => it.equipped === true),
    allConsumables: consumables,
    allMiscItems: miscEntries,

    // New structured treasure payload (used by wealth-summary partial)
    treasures: {
      wealthSummary
    }
  };
}
