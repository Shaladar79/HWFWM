// scripts/sheets/actor/treasures/misc.mjs
//
// Phase 3: Misc display builder (PURE)
// - No Foundry hooks
// - No actor updates
// - Deterministic row shaping for templates
// - Optional per-row debug (off by default)

/**
 * Build misc display rows from actor data + catalog + rarity rules.
 *
 * @param {object} args
 * @param {object} args.system - actor system data (expects system.treasures.miscItems)
 * @param {object} args.miscCatalog - flat misc catalog: { key: {name, group, value, rarity, ...}, ... }
 * @param {Function} args.getRarityValueRule - function(rarity) => { coin, mult }
 * @param {boolean} [args.debug=false] - include _debug fields per row
 * @returns {{ rows: Array }}
 */
export function buildMiscRows({ system, miscCatalog, getRarityValueRule, debug = false }) {
  const misc = system?.treasures?.miscItems ?? {};
  const catalog = miscCatalog ?? {};
  const getRule = typeof getRarityValueRule === "function" ? getRarityValueRule : () => ({ coin: "", mult: 1 });

  const normStr = (v) => String(v ?? "").trim();

  const clampNonNegInt = (v, fallback = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  };

  const toNumberNonNeg = (v, fallback = 0) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, n);
  };

  const supportsRank = (catEntry) => {
    if (!catEntry || typeof catEntry !== "object") return false;
    if (catEntry.hasRank === true) return true;
    const g = normStr(catEntry.group);
    return g === "Quintessence" || g === "Food Ingredients";
  };

  const formatCoinValue = (amount, coin) => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "";
    const txt = Number.isInteger(n) ? String(n) : String(n);
    const c = normStr(coin);
    return c ? `${txt} ${c}` : txt;
  };

  const rows = Object.entries(misc).map(([key, data]) => {
    const cat = catalog?.[key] ?? null;

    const name = normStr(cat?.name ?? data?.name ?? key);

    // Current behavior: enforce at least 1 for display stability
    const quantity = Math.max(1, clampNonNegInt(data?.quantity ?? 1, 1));

    const category = normStr(cat?.group ?? cat?.category ?? "");
    const hasRank = supportsRank(cat);
    const rank = hasRank ? normStr(data?.rank ?? "") : "";

    // Current behavior: rarity/value pulled from actor first, then catalog, then defaults
    const rarity = normStr(data?.rarity ?? cat?.rarity ?? "common") || "common";
    const baseValue = toNumberNonNeg(data?.value ?? cat?.value ?? 1, 1);

    const rule = getRule(rarity);
    const coin = normStr(rule?.coin ?? "");
    const mult = toNumberNonNeg(rule?.mult ?? 1, 1);

    const perUnitValue = baseValue * mult;
    const totalValueNum = perUnitValue * quantity;

    const displayValue = formatCoinValue(perUnitValue, coin);
    const displayTotalValue = formatCoinValue(totalValueNum, coin);

    const missingFromCatalog = !cat;

    const row = {
      key,
      name,
      category,
      quantity,
      hasRank,
      rank,

      rarity,
      value: baseValue,

      displayValue,
      totalValue: displayTotalValue,

      _coin: coin,
      _mult: mult,
      _baseValue: baseValue,
      _perUnitValue: perUnitValue,
      _totalValue: totalValueNum,

      missingFromCatalog
    };

    if (debug) {
      // Source tracing without changing any behavior.
      // NOTE: We do not persist these; they are derived-only.
      const fromActor = {
        name: data?.name != null,
        quantity: data?.quantity != null,
        rank: data?.rank != null,
        rarity: data?.rarity != null,
        value: data?.value != null
      };

      const fromCatalog = {
        present: !!cat,
        name: cat?.name != null,
        group: cat?.group != null || cat?.category != null,
        rarity: cat?.rarity != null,
        value: cat?.value != null,
        hasRank: cat?.hasRank === true
      };

      row._debug = {
        fromActor,
        fromCatalog,
        applied: {
          rarity,
          baseValue,
          coin,
          mult
        }
      };
    }

    return row;
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));

  return { rows };
}
