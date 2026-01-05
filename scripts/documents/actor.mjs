// HWFWM-main/scripts/documents/actor.mjs

import { RANK_BASE_ATTRIBUTES } from "../../config/ranks.mjs";

export class HwfwmActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();

    const system = this.system ?? {};
    system.attributes = system.attributes ?? {};

    // Adjust in one place if your "Num" scaling changes later.
    // Current assumption: each Num point adds +2 to the attribute total.
    const NUM_TO_TOTAL = 2;

    const attrs = ["power", "speed", "spirit", "recovery"];

    for (const a of attrs) {
      const node = (system.attributes[a] = system.attributes[a] ?? {});

      const rankKey = String(node.rankKey ?? "normal");
      const base = Number(RANK_BASE_ATTRIBUTES?.[rankKey] ?? 0);

      const num = Number(node.num ?? 0);
      const mod = Number(node.mod ?? 0);

      // Derived outputs (do not directly edit in the sheet)
      node.base = base;
      node.total = base + (num * NUM_TO_TOTAL) + mod;
    }
  }
}
