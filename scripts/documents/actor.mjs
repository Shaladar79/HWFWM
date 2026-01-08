// scripts/documents/actor.mjs

import {
  RANK_BASE_ATTRIBUTES,
  RANK_TIER_VALUE,
  RANK_RESOURCE_MULTIPLIER,
  RANK_TRAUMA,
  RANK_PACE_MOD,
  RANK_BASE_RECOVERY // ✅ NEW import
} from "../../config/ranks.mjs";

import { RACE_ADJUSTMENTS } from "../../config/races.mjs";
import { ROLE_ADJUSTMENTS, ROLE_BY_RANK } from "../../config/roles.mjs"; // ✅ add ROLE_BY_RANK
import { BACKGROUND_ADJUSTMENTS, BACKGROUND_GRANTED_SPECIALTIES } from "../../config/backgrounds.mjs"; // ✅ wire background baseline + granted specialties

export class HwfwmActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = (this.system ?? {});
    system.attributes = system.attributes ?? {};
    system.resources = system.resources ?? {};
    system.details = system.details ?? {};
    system.specialties = system.specialties ?? {}; // ✅ ensure exists (manual + granted merge surface)

    const toNum = (v, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    // ---------------------------------------------
    // Resolve Race / Role / Background RAW nodes early
    // (so attribute totals can include their mods)
    // ---------------------------------------------
    const raceKey = String(system.details?.raceKey ?? "outworlder");
    const roleKey = String(system.details?.roleKey ?? "");
    const backgroundKey = String(system.details?.backgroundKey ?? "");

    const raceAdjRaw =
      RACE_ADJUSTMENTS?.[raceKey] ?? RACE_ADJUSTMENTS?.outworlder ?? {};
    const roleAdjRaw = ROLE_ADJUSTMENTS?.[roleKey] ?? {};
    const backgroundAdjRaw = BACKGROUND_ADJUSTMENTS?.[backgroundKey] ?? {};

    /**
     * Flexible attribute-mod resolver.
     * Supports these common shapes without requiring schema changes:
     *  - adj.attributes.power
     *  - adj.attributeMods.power
     *  - adj.power
     *  - adj.powerMod
     */
    const getAttrAdj = (adjRaw, attrKey) => {
      if (!adjRaw || !attrKey) return 0;

      const fromAttributes = adjRaw?.attributes?.[attrKey];
      if (fromAttributes !== undefined) return toNum(fromAttributes, 0);

      const fromAttributeMods = adjRaw?.attributeMods?.[attrKey];
      if (fromAttributeMods !== undefined) return toNum(fromAttributeMods, 0);

      const direct = adjRaw?.[attrKey];
      if (direct !== undefined) return toNum(direct, 0);

      const suffixed = adjRaw?.[`${attrKey}Mod`];
      if (suffixed !== undefined) return toNum(suffixed, 0);

      return 0;
    };

    const getRoleByRankNode = (rKey, rankKey) => {
      if (!rKey || !rankKey) return null;
      return ROLE_BY_RANK?.[rKey]?.[rankKey] ?? null;
    };

    // Placeholder-ready resolver:
    // Today: only uses node.status.pace
    // Later: extend to other status fields (reaction, shielding, etc.) and/or attributePct unlocks
    const resolveRoleByRankBonuses = (rKey, rankKey) => {
      const node = getRoleByRankNode(rKey, rankKey);
      const status = node?.status ?? {};
      return {
        node,
        status: {
          pace: toNum(status.pace, 0),

          // placeholder-ready surfaces for recovery + natural armor.
          // These will remain 0 unless ROLE_BY_RANK provides them.
          manaRecovery: toNum(status.manaRecovery, 0),
          staminaRecovery: toNum(status.staminaRecovery, 0),
          lifeForceRecovery: toNum(status.lifeForceRecovery, 0),
          naturalArmor: toNum(status.naturalArmor, 0)
        }
      };
    };

    // -----------------------------
    // 1) Attributes derived math
    //    (NOW includes Race/Role/Background attribute adjustments)
    // -----------------------------
    const NUM_TO_TOTAL = 2;
    const attrs = ["power", "speed", "spirit", "recovery"];

    for (const a of attrs) {
      const node = (system.attributes[a] = system.attributes[a] ?? {});
      const rankKey = String(node.rankKey ?? "normal");
      const base = toNum(RANK_BASE_ATTRIBUTES?.[rankKey], 0);
      const num = toNum(node.num, 0);

      // Manual mod entered on the sheet
      const manualMod = toNum(node.mod, 0);

      // Derived mods from config (read-only, deterministic)
      const raceMod = getAttrAdj(raceAdjRaw, a);
      const roleMod = getAttrAdj(roleAdjRaw, a);
      const backgroundMod = getAttrAdj(backgroundAdjRaw, a);

      const derivedModTotal = raceMod + roleMod + backgroundMod;

      node.base = base;

      // Preserve node.mod as the user-editable/manual value.
      // Add derived breakdown for visibility/debugging without persisting new schema.
      node._derived = node._derived ?? {};
      node._derived.modBreakdown = {
        manual: manualMod,
        race: raceMod,
        role: roleMod,
        background: backgroundMod,
        derivedTotal: derivedModTotal
      };

      node.total = base + (num * NUM_TO_TOTAL) + manualMod + derivedModTotal;
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
      const t = toNum(total, 0);
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
    // 3) Resolve adjustments (numeric resource deltas)
    // -----------------------------
    const raceAdj = {
      lifeForce: toNum(raceAdjRaw.lifeForce, 0),
      mana: toNum(raceAdjRaw.mana, 0),
      stamina: toNum(raceAdjRaw.stamina, 0),
      pace: toNum(raceAdjRaw.pace, 0),

      // optional, config-driven recovery + natural armor contributions
      manaRecovery: toNum(raceAdjRaw.manaRecovery, 0),
      staminaRecovery: toNum(raceAdjRaw.staminaRecovery, 0),
      lifeForceRecovery: toNum(raceAdjRaw.lifeForceRecovery, 0),
      naturalArmor: toNum(raceAdjRaw.naturalArmor, 0)
    };

    const roleAdj = {
      lifeForce: toNum(roleAdjRaw.lifeForce, 0),
      mana: toNum(roleAdjRaw.mana, 0),
      stamina: toNum(roleAdjRaw.stamina, 0),

      // optional, config-driven recovery + natural armor contributions
      manaRecovery: toNum(roleAdjRaw.manaRecovery, 0),
      staminaRecovery: toNum(roleAdjRaw.staminaRecovery, 0),
      lifeForceRecovery: toNum(roleAdjRaw.lifeForceRecovery, 0),
      naturalArmor: toNum(roleAdjRaw.naturalArmor, 0)
    };

    // Role-by-rank hook (clean placeholder surface)
    const roleByRank = resolveRoleByRankBonuses(roleKey, derivedRankKey);
    system._derived.roleByRank = roleByRank?.node ?? null; // exposed for UI/debugging if desired
    const rolePaceBonus = roleByRank.status.pace;

    // Background baseline adjustments (no by-rank behavior)
    const backgroundAdj = {
      lifeForce: toNum(backgroundAdjRaw.lifeForce, 0),
      mana: toNum(backgroundAdjRaw.mana, 0),
      stamina: toNum(backgroundAdjRaw.stamina, 0),

      // optional, config-driven recovery + natural armor contributions
      manaRecovery: toNum(backgroundAdjRaw.manaRecovery, 0),
      staminaRecovery: toNum(backgroundAdjRaw.staminaRecovery, 0),
      lifeForceRecovery: toNum(backgroundAdjRaw.lifeForceRecovery, 0),
      naturalArmor: toNum(backgroundAdjRaw.naturalArmor, 0)
      // pace: intentionally not supported for backgrounds per current decisions
    };

    // -----------------------------
    // 3b) Granted specialties (background only for now)
    // -----------------------------
    const grantedByBackground = Array.isArray(BACKGROUND_GRANTED_SPECIALTIES?.[backgroundKey])
      ? BACKGROUND_GRANTED_SPECIALTIES[backgroundKey]
      : [];

    // Expose the granted keys for UI/debugging
    system._derived.specialtiesGranted = system._derived.specialtiesGranted ?? {};
    system._derived.specialtiesGranted.background = grantedByBackground;

    // Materialize granted specialties into system.specialties for a single coherent source.
    // IMPORTANT: this is derived-only (not persisted) unless explicitly saved via actor.update elsewhere.
    for (const key of grantedByBackground) {
      if (!key) continue;

      // Do not override a manually-owned specialty entry (the manual one wins)
      if (system.specialties?.[key]) continue;

      system.specialties[key] = {
        key,
        score: 0,
        source: "background",
        granted: true,
        _derivedOnly: true
      };
    }

    // -----------------------------
    // 4) Resources max: (base + adjustments) THEN multiply
    // -----------------------------
    const BASE_RESOURCE_NORMAL = 10;
    const mult = toNum(RANK_RESOURCE_MULTIPLIER?.[derivedRankKey], 1);

    system.resources.lifeForce = system.resources.lifeForce ?? { value: 0, max: 0 };
    system.resources.mana = system.resources.mana ?? { value: 0, max: 0 };
    system.resources.stamina = system.resources.stamina ?? { value: 0, max: 0 };
    system.resources.trauma = system.resources.trauma ?? { value: 0, max: 0 };

    const lfPre = BASE_RESOURCE_NORMAL + raceAdj.lifeForce + roleAdj.lifeForce + backgroundAdj.lifeForce;
    const manaPre = BASE_RESOURCE_NORMAL + raceAdj.mana + roleAdj.mana + backgroundAdj.mana;
    const stamPre = BASE_RESOURCE_NORMAL + raceAdj.stamina + roleAdj.stamina + backgroundAdj.stamina;

    const lfMax = Math.max(0, Math.round(lfPre * mult));
    const manaMax = Math.max(0, Math.round(manaPre * mult));
    const stamMax = Math.max(0, Math.round(stamPre * mult));

    system.resources.lifeForce.max = lfMax;
    system.resources.mana.max = manaMax;
    system.resources.stamina.max = stamMax;

    system.resources.trauma.max = Math.max(0, toNum(RANK_TRAUMA?.[derivedRankKey], 0));

    system.resources.lifeForce.value = Math.min(toNum(system.resources.lifeForce.value, 0), lfMax);
    system.resources.mana.value = Math.min(toNum(system.resources.mana.value, 0), manaMax);
    system.resources.stamina.value = Math.min(toNum(system.resources.stamina.value, 0), stamMax);
    system.resources.trauma.value = Math.min(toNum(system.resources.trauma.value, 0), system.resources.trauma.max);

    // -----------------------------
    // 4b) Recovery rates + Natural Armor (derived, read-only surfaces)
    // -----------------------------
    // Displayed in resources.hbs as read-only values:
    //  - system.resources.mana.recovery
    //  - system.resources.stamina.recovery
    //  - system.resources.lifeForce.recovery
    //  - system.resources.naturalArmor
    //
    // Wiring rules:
    //  - Start with rank baseline (RANK_BASE_RECOVERY)
    //  - Add contributions from Race + Role + Background + Role-by-rank placeholders.
    //  - No balance pass; correctness/visibility only.

    // Ensure nested keys exist
    system.resources.mana = system.resources.mana ?? { value: 0, max: 0 };
    system.resources.stamina = system.resources.stamina ?? { value: 0, max: 0 };
    system.resources.lifeForce = system.resources.lifeForce ?? { value: 0, max: 0 };

    const baseRec = RANK_BASE_RECOVERY?.[derivedRankKey] ?? {};
    const baseManaRec = toNum(baseRec.mana, 0);
    const baseStaminaRec = toNum(baseRec.stamina, 0);
    const baseLifeForceRec = toNum(baseRec.lifeForce, 0);

    const manaRec =
      baseManaRec +
      raceAdj.manaRecovery +
      roleAdj.manaRecovery +
      backgroundAdj.manaRecovery +
      toNum(roleByRank?.status?.manaRecovery, 0);

    const staminaRec =
      baseStaminaRec +
      raceAdj.staminaRecovery +
      roleAdj.staminaRecovery +
      backgroundAdj.staminaRecovery +
      toNum(roleByRank?.status?.staminaRecovery, 0);

    const lifeForceRec =
      baseLifeForceRec +
      raceAdj.lifeForceRecovery +
      roleAdj.lifeForceRecovery +
      backgroundAdj.lifeForceRecovery +
      toNum(roleByRank?.status?.lifeForceRecovery, 0);

    const naturalArmor =
      raceAdj.naturalArmor +
      roleAdj.naturalArmor +
      backgroundAdj.naturalArmor +
      toNum(roleByRank?.status?.naturalArmor, 0);

    // Write derived read-only display values
    system.resources.mana.recovery = Math.max(0, Math.round(manaRec));
    system.resources.stamina.recovery = Math.max(0, Math.round(staminaRec));
    system.resources.lifeForce.recovery = Math.max(0, Math.round(lifeForceRec));
    system.resources.naturalArmor = Math.max(0, Math.round(naturalArmor));

    // Expose computed totals for debug/verification if desired (non-authoritative)
    system._derived.recovery = {
      mana: system.resources.mana.recovery,
      stamina: system.resources.stamina.recovery,
      lifeForce: system.resources.lifeForce.recovery,
      naturalArmor: system.resources.naturalArmor
    };

    // -----------------------------
    // 5) Pace (race + rank + role-by-rank pace hook)
    // -----------------------------
    system.resources.pace = system.resources.pace ?? { value: 0 };

    const paceRank = toNum(RANK_PACE_MOD?.[derivedRankKey], 0);
    system.resources.pace.value = Math.max(0, paceRank + raceAdj.pace + rolePaceBonus);

    void backgroundKey;
  }
}
