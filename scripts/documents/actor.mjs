// scripts/documents/actor.mjs

import {
  RANK_BASE_ATTRIBUTES,
  RANK_TIER_VALUE,
  RANK_RESOURCE_MULTIPLIER,
  RANK_TRAUMA,
  RANK_PACE_MOD
} from "../../config/ranks.mjs";

import { RACE_ADJUSTMENTS } from "../../config/races.mjs";

/**
 * Actor derived data engine for HWFWM.
 * Authoritative ordering:
 *  - Resources: (BASE + race + role + background) THEN multiply by rank multiplier
 *  - Trauma: rank-based
 *  - Pace: race base + rank pace mod (for now)
 */
export class HwfwmActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = (this.system ?? {});
    system.attributes = system.attributes ?? {};
    system.resources = system.resources ?? {};
    system.details = system.details ?? {};

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
    // 3) Resolve adjustments
    //    (race now; role/background ready for later)
    // -----------------------------
    const raceKey = String(system.details?.raceKey ?? "outworlder");
    const raceAdjRaw = RACE_ADJUSTMENTS?.[raceKey] ?? RACE_ADJUSTMENTS?.outworlder ?? {};
    const raceAdj = {
      lifeForce: Number(raceAdjRaw.lifeForce ?? 0),
      mana: Number(raceAdjRaw.mana ?? 0),
      stamina: Number(raceAdjRaw.stamina ?? 0),
      pace: Number(raceAdjRaw.pace ?? 0)
    };

    // Role adjustments placeholder (wire up once roles.mjs exports them)
    // Expected shape: { [roleKey]: { lifeForce, mana, stamina } }
    const roleKey = String(system.details?.roleKey ?? "");
    const roleAdj = {
      lifeForce: 0,
      mana: 0,
      stamina: 0
    };
    // Background adjustments placeholder (wire up later)
    const backgroundKey = String(system.details?.backgroundKey ?? "");
    const backgroundAdj = {
      lifeForce: 0,
      mana: 0,
      stamina: 0
    };

    // -----------------------------
    // 4) Resources max
    //    IMPORTANT: (base + adjustments) THEN multiply
    // -----------------------------
    const BASE_RESOURCE_NORMAL = 10;
    const mult = Number(RANK_RESOURCE_MULTIPLIER?.[derivedRankKey] ?? 1);

    system.resources.lifeForce = system.resources.lifeForce ?? { value: 0, max: 0 };
    system.resources.mana = system.resources.mana ?? { value: 0, max: 0 };
    system.resources.stamina = system.resources.stamina ?? { value: 0, max: 0 };
    system.resources.trauma = system.resources.trauma ?? { value: 0, max: 0 };

    const lfPre =
      BASE_RESOURCE_NORMAL +
      raceAdj.lifeForce +
      roleAdj.lifeForce +
      backgroundAdj.lifeForce;

    const manaPre =
      BASE_RESOURCE_NORMAL +
      raceAdj.mana +
      roleAdj.mana +
      backgroundAdj.mana;

    const stamPre =
      BASE_RESOURCE_NORMAL +
      raceAdj.stamina +
      roleAdj.stamina +
      backgroundAdj.stamina;

    const lfMax = Math.max(0, Math.round(lfPre * mult));
    const manaMax = Math.max(0, Math.round(manaPre * mult));
    const stamMax = Math.max(0, Math.round(stamPre * mult));

    system.resources.lifeForce.max = lfMax;
    system.resources.mana.max = manaMax;
    system.resources.stamina.max = stamMax;

    // Trauma max is rank-based (no multiplier)
    system.resources.trauma.max = Math.max(0, Number(RANK_TRAUMA?.[derivedRankKey] ?? 0));

    // Clamp current values
    system.resources.lifeForce.value = Math.min(Number(system.resources.lifeForce.value ?? 0), lfMax);
    system.resources.mana.value = Math.min(Number(system.resources.mana.value ?? 0), manaMax);
    system.resources.stamina.value = Math.min(Number(system.resources.stamina.value ?? 0), stamMax);
    system.resources.trauma.value = Math.min(
      Number(system.resources.trauma.value ?? 0),
      system.resources.trauma.max
    );

    // -----------------------------
    // 5) Pace (race + rank for now)
    // -----------------------------
    system.resources.pace = system.resources.pace ?? { value: 0 };

    const paceRank = Number(RANK_PACE_MOD?.[derivedRankKey] ?? 0);
    system.resources.pace.value = Math.max(0, paceRank + raceAdj.pace);

    // (Optional) prevent unused-var lint complaints if you add linting later
    void roleKey;
    void backgroundKey;
  }
}

