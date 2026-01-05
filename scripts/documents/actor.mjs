// scripts/documents/actor.mjs

import {
  RANK_BASE_ATTRIBUTES,
  RANK_TIER_VALUE,
  RANK_RESOURCE_MULTIPLIER,
  RANK_TRAUMA,
  RANK_PACE_MOD // ✅ ADD
} from "../../config/ranks.mjs";

export class HwfwmActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = (this.system ?? {});
    system.attributes = system.attributes ?? {};
    system.resources = system.resources ?? {};

    // -----------------------------
    // 1) Attributes derived math
    // -----------------------------
    const NUM_TO_TOTAL = 2;
    const attrs = ["power", "speed", "spirit", "recovery"];

    for (const a of attrs) {
      const node = (system.attributes[a] = system.attributes[a] ?? {});
      const rankKey = String(node.rankKey ?? "normal");
      const base = Number(RANK_BASE_ATTRIBUTES?.[rankKey] ?? 0);

      const num = Number(node.num ?? 0);
      const mod = Number(node.mod ?? 0);

      node.base = base;
      node.total = base + (num * NUM_TO_TOTAL) + mod;
    }

    // -----------------------------
    // 2) Derived character rank
    // -----------------------------
    const attrRankKeys = {
      power: system.attributes?.power?.rankKey ?? "normal",
      speed: system.attributes?.speed?.rankKey ?? "normal",
      spirit: system.attributes?.spirit?.rankKey ?? "normal",
      recovery: system.attributes?.recovery?.rankKey ?? "normal"
    };

    const tierTotal =
      (RANK_TIER_VALUE[attrRankKeys.power] ?? 0) +
      (RANK_TIER_VALUE[attrRankKeys.speed] ?? 0) +
      (RANK_TIER_VALUE[attrRankKeys.spirit] ?? 0) +
      (RANK_TIER_VALUE[attrRankKeys.recovery] ?? 0);

    const deriveRankKeyFromTierTotal = (total) => {
      const t = Number(total) || 0;
      if (t >= 20) return "diamond";
      if (t >= 16) return "gold";
      if (t >= 12) return "silver";
      if (t >= 8) return "bronze";
      if (t >= 4) return "iron";
      return "normal";
    };

    const derivedRankKey = deriveRankKeyFromTierTotal(tierTotal);

    system._derived = system._derived ?? {};
    system._derived.rankKey = derivedRankKey;
    system._derived.rankTierTotal = tierTotal;

    // -----------------------------
    // 3) Resources max (baseline 10)
    // -----------------------------
    const BASE_RESOURCE_NORMAL = 10;
    const mult = Number(RANK_RESOURCE_MULTIPLIER?.[derivedRankKey] ?? 1);

    system.resources.lifeForce = system.resources.lifeForce ?? { value: 0, max: 0 };
    system.resources.mana = system.resources.mana ?? { value: 0, max: 0 };
    system.resources.stamina = system.resources.stamina ?? { value: 0, max: 0 };
    system.resources.trauma = system.resources.trauma ?? { value: 0, max: 0 };

    const maxBase = Math.round(BASE_RESOURCE_NORMAL * mult);

    system.resources.lifeForce.max = maxBase;
    system.resources.mana.max = maxBase;
    system.resources.stamina.max = maxBase;

    system.resources.trauma.max = Number(RANK_TRAUMA?.[derivedRankKey] ?? 0);

    system.resources.lifeForce.value = Math.min(Number(system.resources.lifeForce.value ?? 0), system.resources.lifeForce.max);
    system.resources.mana.value = Math.min(Number(system.resources.mana.value ?? 0), system.resources.mana.max);
    system.resources.stamina.value = Math.min(Number(system.resources.stamina.value ?? 0), system.resources.stamina.max);
    system.resources.trauma.value = Math.min(Number(system.resources.trauma.value ?? 0), system.resources.trauma.max);

    // -----------------------------
    // 4) Pace (rank-only for now)
    // -----------------------------
    system.resources.pace = system.resources.pace ?? { value: 0 };

    // Until race mods are added: pace is ONLY rank pace mod
    system.resources.pace.value = Number(RANK_PACE_MOD?.[derivedRankKey] ?? 0);
  }
}
