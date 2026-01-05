// HWFWM/scripts/documents/actor.mjs

import {
  RANK_BASE_ATTRIBUTES,
  RANK_TIER_VALUE,
  RANK_RESOURCE_MULTIPLIER,
  RANK_PACE_MOD,
  RANK_TRAUMA
} from "../../config/ranks.mjs";

export class HwfwmActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = this.system ?? {};

    // Ensure expected branches exist
    system.attributes = system.attributes ?? {};
    system.resources = system.resources ?? {};
    system.details = system.details ?? {};

    // Adjust in one place if your "Num" scaling changes later.
    // Current assumption: each Num point adds +2 to the attribute total.
    const NUM_TO_TOTAL = 2;

    const attrs = ["power", "speed", "spirit", "recovery"];

    // -----------------------------
    // 1) Attribute totals
    // -----------------------------
    for (const a of attrs) {
      const node = (system.attributes[a] = system.attributes[a] ?? {});

      const rankKey = String(node.rankKey ?? "normal");
      const base = Number(RANK_BASE_ATTRIBUTES?.[rankKey] ?? 0);

      const num = Number.isFinite(Number(node.num)) ? Number(node.num) : 0;
      const mod = Number.isFinite(Number(node.mod)) ? Number(node.mod) : 0;

      // Derived outputs (do not directly edit in the sheet)
      node.base = base;
      node.total = base + (num * NUM_TO_TOTAL) + mod;
    }

    // -----------------------------
    // 2) Derived CHARACTER rank
    // -----------------------------
    const powerRank = String(system.attributes?.power?.rankKey ?? "normal");
    const speedRank = String(system.attributes?.speed?.rankKey ?? "normal");
    const spiritRank = String(system.attributes?.spirit?.rankKey ?? "normal");
    const recoveryRank = String(system.attributes?.recovery?.rankKey ?? "normal");

    const tierTotal =
      (Number(RANK_TIER_VALUE?.[powerRank] ?? 0)) +
      (Number(RANK_TIER_VALUE?.[speedRank] ?? 0)) +
      (Number(RANK_TIER_VALUE?.[spiritRank] ?? 0)) +
      (Number(RANK_TIER_VALUE?.[recoveryRank] ?? 0));

    const derivedRankKey =
      tierTotal >= 20 ? "diamond" :
      tierTotal >= 16 ? "gold" :
      tierTotal >= 12 ? "silver" :
      tierTotal >= 8  ? "bronze" :
      tierTotal >= 4  ? "iron" :
                        "normal";

    // Store for UI consumption (header/overview)
    system.details.rankKey = derivedRankKey;
    system.details.rankTierTotal = tierTotal;

    // -----------------------------
    // 3) Derived Resources (max)
    // -----------------------------
    const mult = Number(RANK_RESOURCE_MULTIPLIER?.[derivedRankKey] ?? 1);

    // Ensure resource objects exist (preserve current values)
    system.resources.lifeForce = system.resources.lifeForce ?? { value: 0, max: 0 };
    system.resources.mana = system.resources.mana ?? { value: 0, max: 0 };
    system.resources.stamina = system.resources.stamina ?? { value: 0, max: 0 };
    system.resources.pace = system.resources.pace ?? { value: 0 };
    system.resources.trauma = system.resources.trauma ?? { value: 0, max: 0 };

    const powerTotal = Number(system.attributes?.power?.total ?? 0);
    const speedTotal = Number(system.attributes?.speed?.total ?? 0);
    const spiritTotal = Number(system.attributes?.spirit?.total ?? 0);
    const recoveryTotal = Number(system.attributes?.recovery?.total ?? 0);

    // These are intentionally simple and easy to change later.
    system.resources.lifeForce.max = Math.floor(powerTotal * mult);
    system.resources.mana.max = Math.floor(spiritTotal * mult);
    system.resources.stamina.max = Math.floor(recoveryTotal * mult);

    // Pace: base from Speed.total (placeholder formula) + rank pace mod
    const paceMod = Number(RANK_PACE_MOD?.[derivedRankKey] ?? 0);
    system.resources.pace.value = Math.floor(speedTotal / 10) + paceMod;

    // Trauma: rank-based max (current value remains player editable for now)
    system.resources.trauma.max = Number(RANK_TRAUMA?.[derivedRankKey] ?? system.resources.trauma.max ?? 0);

    // Optional clamping: keep current values from exceeding max if you want.
    // (Leaving OFF for now since you said current values are player-editable for now.)
    // system.resources.lifeForce.value = Math.min(system.resources.lifeForce.value, system.resources.lifeForce.max);
    // system.resources.mana.value = Math.min(system.resources.mana.value, system.resources.mana.max);
    // system.resources.stamina.value = Math.min(system.resources.stamina.value, system.resources.stamina.max);
    // system.resources.trauma.value = Math.min(system.resources.trauma.value, system.resources.trauma.max);
  }
}
