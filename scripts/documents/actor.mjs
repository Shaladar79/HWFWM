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
    system.defense = system.defense ?? { base: 0, mod: 0, total: 0 };

    const toNum = (v, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const clamp = (v, min, max) => {
      const n = toNum(v, min);
      return Math.min(Math.max(n, min), max);
    };

    const coerceBool = (v) =>
      v === true || v === 1 || v === "1" || v === "true" || v === "yes" || v === "on";

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
    // Today: uses node.status.* and ALSO exposes node.attributePct (applied after derived rank is known)
    const resolveRoleByRankBonuses = (rKey, rankKey) => {
      const node = getRoleByRankNode(rKey, rankKey);
      const status = node?.status ?? {};
      const attributePct = node?.attributePct ?? {};
      return {
        node,
        attributePct: {
          power: toNum(attributePct.power, 0),
          speed: toNum(attributePct.speed, 0),
          spirit: toNum(attributePct.spirit, 0),
          recovery: toNum(attributePct.recovery, 0)
        },
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
    //    (Includes Race/Role/Background attribute adjustments)
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
        roleByRankPct: 0, // will be applied after derived rank is computed
        equipmentFlat: 0, // will be applied after equipment is aggregated
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
    // 2b) Apply ROLE_BY_RANK attributePct (direct additive %)
    // -----------------------------
    const roleByRank = resolveRoleByRankBonuses(roleKey, derivedRankKey);
    system._derived.roleByRank = roleByRank?.node ?? null; // exposed for UI/debugging if desired

    for (const a of attrs) {
      const node = system.attributes?.[a];
      if (!node) continue;

      const bonus = toNum(roleByRank?.attributePct?.[a], 0);
      if (!bonus) continue;

      node.total = toNum(node.total, 0) + bonus;

      node._derived = node._derived ?? {};
      node._derived.modBreakdown = node._derived.modBreakdown ?? {};
      node._derived.modBreakdown.roleByRankPct = bonus;
    }

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
    };

    // -----------------------------
    // 3b) Granted specialties (background only for now)
    // -----------------------------
    const grantedByBackground = Array.isArray(BACKGROUND_GRANTED_SPECIALTIES?.[backgroundKey])
      ? BACKGROUND_GRANTED_SPECIALTIES[backgroundKey]
      : [];

    system._derived.specialtiesGranted = system._derived.specialtiesGranted ?? {};
    system._derived.specialtiesGranted.background = grantedByBackground;

    for (const key of grantedByBackground) {
      if (!key) continue;
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

    system.resources.pace = system.resources.pace ?? { value: 0 };
    system.resources.reaction = system.resources.reaction ?? { value: 0 };
    system.resources.shielding = system.resources.shielding ?? { value: 0 };
    system.resources.armor = system.resources.armor ?? { value: 0, max: 0 };
    system.resources.naturalArmor ??= 0;

    const lfPre = BASE_RESOURCE_NORMAL + raceAdj.lifeForce + roleAdj.lifeForce + backgroundAdj.lifeForce;
    const manaPre = BASE_RESOURCE_NORMAL + raceAdj.mana + roleAdj.mana + backgroundAdj.mana;
    const stamPre = BASE_RESOURCE_NORMAL + raceAdj.stamina + roleAdj.stamina + backgroundAdj.stamina;

    let lfMax = Math.max(0, Math.round(lfPre * mult));
    let manaMax = Math.max(0, Math.round(manaPre * mult));
    let stamMax = Math.max(0, Math.round(stamPre * mult));

    system.resources.trauma.max = Math.max(0, toNum(RANK_TRAUMA?.[derivedRankKey], 0));

    system.resources.lifeForce.value = Math.min(toNum(system.resources.lifeForce.value, 0), lfMax);
    system.resources.mana.value = Math.min(toNum(system.resources.mana.value, 0), manaMax);
    system.resources.stamina.value = Math.min(toNum(system.resources.stamina.value, 0), stamMax);
    system.resources.trauma.value = Math.min(
      toNum(system.resources.trauma.value, 0),
      system.resources.trauma.max
    );

    // -----------------------------
    // 4b) Recovery rates + Natural Armor (derived, read-only surfaces)
    // -----------------------------
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

    let naturalArmor =
      raceAdj.naturalArmor +
      roleAdj.naturalArmor +
      backgroundAdj.naturalArmor +
      toNum(roleByRank?.status?.naturalArmor, 0);

    system.resources.mana.recovery = Math.max(0, Math.round(manaRec));
    system.resources.stamina.recovery = Math.max(0, Math.round(staminaRec));
    system.resources.lifeForce.recovery = Math.max(0, Math.round(lifeForceRec));
    system.resources.naturalArmor = Math.max(0, Math.round(naturalArmor));

    system._derived.recovery = {
      mana: system.resources.mana.recovery,
      stamina: system.resources.stamina.recovery,
      lifeForce: system.resources.lifeForce.recovery,
      naturalArmor: system.resources.naturalArmor
    };

    // -----------------------------
    // 5) Pace (race + rank + role-by-rank pace hook)
    // -----------------------------
    const paceRank = toNum(RANK_PACE_MOD?.[derivedRankKey], 0);
    system.resources.pace.value = Math.max(0, paceRank + raceAdj.pace + rolePaceBonus);

    // -----------------------------
    // 6) Equipment Integration (TEST-READY)
    // -----------------------------
    const allItems = Array.isArray(this.items?.contents) ? this.items.contents : [];
    const equippedEquipment = allItems.filter((it) => {
      if (!it || it.type !== "equipment") return false;
      return coerceBool(it.system?.equipped);
    });

    const eqWeapons = [];
    const eqArmors = [];
    const eqMisc = [];

    const eqAttrFlat = { power: 0, speed: 0, spirit: 0, recovery: 0 };

    const eqResPct = { lifeForce: 0, mana: 0, stamina: 0 };
    const eqResFlat = {
      lifeForce: 0,
      mana: 0,
      stamina: 0,
      trauma: 0,
      pace: 0,
      reaction: 0,
      defense: 0,
      naturalArmor: 0
    };

    let eqArmorTotal = 0;
    let eqMiscArmor = 0;

    const packSummary = (it) => ({
      id: it.id,
      uuid: it.uuid,
      name: it.name,
      type: String(it.system?.type ?? ""),
      itemRank: String(it.system?.itemRank ?? ""),
      img: it.img
    });

    for (const it of equippedEquipment) {
      const s = it.system ?? {};
      const eqType = String(s.type ?? "");

      if (eqType === "weapon") {
        eqWeapons.push({
          ...packSummary(it),
          weaponType: String(s.weapon?.weaponType ?? ""),
          damagePerSuccess: toNum(s.weapon?.totalDamagePerSuccess ?? s.weapon?.damagePerSuccess ?? 0, 0),
          actionCost: toNum(s.weapon?.totalActionCost ?? s.weapon?.actionCost ?? 0, 0)
        });
      } else if (eqType === "armor") {
        const armorVal = toNum(s.armor?.totalArmor ?? s.armor?.value ?? 0, 0);
        eqArmorTotal += armorVal;

        eqArmors.push({
          ...packSummary(it),
          armorType: String(s.armor?.armorType ?? ""),
          armorName: String(s.armor?.armorName ?? ""),
          totalArmor: armorVal
        });
      } else {
        const miscArmor = toNum(s.misc?.armor ?? 0, 0);
        eqMiscArmor += miscArmor;

        eqMisc.push({
          ...packSummary(it),
          miscArmor
        });
      }

      const adj = s.adjustments ?? {};
      const adjAttrs = adj.attributes ?? {};
      eqAttrFlat.power += toNum(adjAttrs.power?.flat ?? 0, 0);
      eqAttrFlat.speed += toNum(adjAttrs.speed?.flat ?? 0, 0);
      eqAttrFlat.spirit += toNum(adjAttrs.spirit?.flat ?? 0, 0);
      eqAttrFlat.recovery += toNum(adjAttrs.recovery?.flat ?? 0, 0);

      const adjRes = adj.resources ?? {};
      eqResPct.lifeForce += toNum(adjRes.lifeForce?.pct ?? 0, 0);
      eqResFlat.lifeForce += toNum(adjRes.lifeForce?.flat ?? 0, 0);

      eqResPct.mana += toNum(adjRes.mana?.pct ?? 0, 0);
      eqResFlat.mana += toNum(adjRes.mana?.flat ?? 0, 0);

      eqResPct.stamina += toNum(adjRes.stamina?.pct ?? 0, 0);
      eqResFlat.stamina += toNum(adjRes.stamina?.flat ?? 0, 0);

      eqResFlat.trauma += toNum(adjRes.trauma?.flat ?? 0, 0);
      eqResFlat.pace += toNum(adjRes.pace?.flat ?? 0, 0);
      eqResFlat.reaction += toNum(adjRes.reaction?.flat ?? 0, 0);
      eqResFlat.defense += toNum(adjRes.defense?.flat ?? 0, 0);
      eqResFlat.naturalArmor += toNum(adjRes.naturalArmor?.flat ?? 0, 0);
    }

    // 6a) Apply equipment flat attribute adjustments
    for (const a of attrs) {
      const node = system.attributes?.[a];
      if (!node) continue;

      const add = toNum(eqAttrFlat[a], 0);
      if (!add) continue;

      node.total = toNum(node.total, 0) + add;

      node._derived = node._derived ?? {};
      node._derived.modBreakdown = node._derived.modBreakdown ?? {};
      node._derived.modBreakdown.equipmentFlat = add;
    }

    // 6b) Apply equipment resource adjustments
    const applyPctFlatToMax = (baseMax, pct, flat) => {
      const m = toNum(baseMax, 0);
      const p = toNum(pct, 0);
      const f = toNum(flat, 0);
      const scaled = m * (1 + (p / 100));
      return Math.max(0, Math.round(scaled + f));
    };

    lfMax = applyPctFlatToMax(lfMax, eqResPct.lifeForce, eqResFlat.lifeForce);
    manaMax = applyPctFlatToMax(manaMax, eqResPct.mana, eqResFlat.mana);
    stamMax = applyPctFlatToMax(stamMax, eqResPct.stamina, eqResFlat.stamina);

    system.resources.lifeForce.max = lfMax;
    system.resources.mana.max = manaMax;
    system.resources.stamina.max = stamMax;

    system.resources.lifeForce.value = clamp(system.resources.lifeForce.value, 0, lfMax);
    system.resources.mana.value = clamp(system.resources.mana.value, 0, manaMax);
    system.resources.stamina.value = clamp(system.resources.stamina.value, 0, stamMax);

    system.resources.trauma.max = Math.max(
      0,
      toNum(RANK_TRAUMA?.[derivedRankKey], 0) + toNum(eqResFlat.trauma, 0)
    );
    system.resources.trauma.value = clamp(system.resources.trauma.value, 0, system.resources.trauma.max);

    system.resources.pace.value = Math.max(0, toNum(system.resources.pace.value, 0) + toNum(eqResFlat.pace, 0));

    // IMPORTANT: do NOT overwrite reaction.value (it is editable on the sheet).
    // We only record equipment contribution for now.
    system.resources.reaction._derived = system.resources.reaction._derived ?? {};
    system.resources.reaction._derived.equipmentFlat = toNum(eqResFlat.reaction, 0);

    system.resources.naturalArmor = Math.max(
      0,
      toNum(system.resources.naturalArmor, 0) + toNum(eqResFlat.naturalArmor, 0)
    );

    // 6c) Armor total (equipped armor + misc armor)
    const armorMax = Math.max(0, Math.round(eqArmorTotal + eqMiscArmor));
    system.resources.armor.max = armorMax;
    system.resources.armor.value = clamp(system.resources.armor.value, 0, armorMax);

    // 6d) Defense wiring (NO STACKING): base + manual + equipment
    const defenseBase = toNum(system.defense.base, 0);
    const defenseManualMod = toNum(system.defense.mod, 0);
    const defenseEquipFlat = toNum(eqResFlat.defense, 0);

    system.defense.base = defenseBase; // keep normalized
    system.defense.mod = defenseManualMod; // DO NOT overwrite with derived
    system.defense.total = defenseBase + defenseManualMod + defenseEquipFlat;

    system.defense._derived = system.defense._derived ?? {};
    system.defense._derived.modBreakdown = {
      base: defenseBase,
      manual: defenseManualMod,
      equipmentFlat: defenseEquipFlat
    };

    // 6e) Store a debug snapshot for rapid testing/verification
    system._derived.equipment = {
      equippedCount: equippedEquipment.length,
      weapons: eqWeapons,
      armors: eqArmors,
      misc: eqMisc,
      totals: {
        armorFromArmorItems: Math.round(eqArmorTotal),
        armorFromMisc: Math.round(eqMiscArmor),
        armorMax: system.resources.armor.max,
        defenseFlat: Math.round(defenseEquipFlat),
        naturalArmorFlat: Math.round(eqResFlat.naturalArmor),
        paceFlat: Math.round(eqResFlat.pace),
        reactionFlat: Math.round(eqResFlat.reaction),
        resourcePct: {
          lifeForce: Math.round(eqResPct.lifeForce),
          mana: Math.round(eqResPct.mana),
          stamina: Math.round(eqResPct.stamina)
        },
        resourceFlat: {
          lifeForce: Math.round(eqResFlat.lifeForce),
          mana: Math.round(eqResFlat.mana),
          stamina: Math.round(eqResFlat.stamina)
        },
        attrFlat: {
          power: Math.round(eqAttrFlat.power),
          speed: Math.round(eqAttrFlat.speed),
          spirit: Math.round(eqAttrFlat.spirit),
          recovery: Math.round(eqAttrFlat.recovery)
        }
      }
    };

    void backgroundKey;
  }
}
