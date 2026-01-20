// scripts/sheets/actor/treasures/context.mjs
//
// Phase 2 (Extraction): Treasures context builder
// - NO behavior changes vs prior inline logic in scripts/sheets/actor/context.mjs
// - Returns the same arrays used by existing templates:
//   allEquipment, equippedEquipment, allConsumables, allMiscItems

import { buildMiscRows } from "./misc.mjs";

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
  // Inventory: Misc actor-data + catalog metadata for display (Phase 3 isolated)
  // ---------------------------------------------------------------------------
  const miscCatalog = context?.miscItemCatalog ?? {};
  const { rows: miscEntries } = buildMiscRows({
    system: context?.system ?? {},
    miscCatalog,
    getRarityValueRule,
    debug: false
  });

  return {
    allEquipment: equipment,
    equippedEquipment: equipment.filter((it) => it.equipped === true),
    allConsumables: consumables,
    allMiscItems: miscEntries
  };
}
