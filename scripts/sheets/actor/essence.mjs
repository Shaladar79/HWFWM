export function computeEssenceUI(sheet, systemData) {
  const attrs = sheet.constructor.ESSENCE_ATTRS;
  const ess = systemData?.essences ?? {};
  const picked = attrs.map((a) => (ess?.[`${a}Key`] ?? "").trim()).filter(Boolean);

  const unique = Array.from(new Set(picked));
  const uniqueCount = unique.length;
  const confluenceUnlocked = uniqueCount === 3;

  const confluenceSlot =
    confluenceUnlocked
      ? attrs.find((a) => !(ess?.[`${a}Key`] ?? "").trim()) ?? null
      : null;

  return { attrs, selectedEssenceKeys: unique, uniqueCount, confluenceUnlocked, confluenceSlot };
}

export async function handleEssenceSelectChange(sheet, target) {
  if (!(target instanceof HTMLSelectElement)) return false;

  const name = target.getAttribute("name") ?? "";
  const isEssence = name.startsWith("system.essences.") && name.endsWith("Key");
  const isConfluence = name.startsWith("system.confluenceEssences.") && name.endsWith("Key");
  if (!isEssence && !isConfluence) return false;

  const attrs = sheet.constructor.ESSENCE_ATTRS;
  const attr = attrs.find((a) => name.includes(`.${a}Key`));
  if (!attr) return true;

  const systemNow = sheet.document?.system ?? {};
  const uiNow = computeEssenceUI(sheet, systemNow);

  const revertSelect = () => {
    if (isEssence) target.value = systemNow?.essences?.[`${attr}Key`] ?? "";
    if (isConfluence) target.value = systemNow?.confluenceEssences?.[`${attr}Key`] ?? "";
  };

  if (isEssence) {
    const newKey = (target.value ?? "").trim();
    const ess = foundry.utils.deepClone(systemNow?.essences ?? {});
    ess[`${attr}Key`] = newKey;

    const picked = attrs.map((a) => (ess?.[`${a}Key`] ?? "").trim()).filter(Boolean);
    const unique = new Set(picked);

    if (picked.length !== unique.size) {
      ui.notifications?.warn("You cannot select the same Essence more than once.");
      revertSelect();
      return true;
    }

    if (unique.size > 3) {
      ui.notifications?.warn("Only three Essences may be selected. The remaining slot is reserved for a Confluence Essence.");
      revertSelect();
      return true;
    }

    const updateData = { [`system.essences.${attr}Key`]: newKey };

    // clear confluence if dropped below 3
    if (unique.size < 3) {
      updateData["system.confluenceEssences.powerKey"] = "";
      updateData["system.confluenceEssences.speedKey"] = "";
      updateData["system.confluenceEssences.spiritKey"] = "";
      updateData["system.confluenceEssences.recoveryKey"] = "";
    }

    await sheet.document.update(updateData);
    return true;
  }

  // confluence
  if (!uiNow.confluenceUnlocked) {
    ui.notifications?.warn("Select three unique Essences before choosing a Confluence Essence.");
    revertSelect();
    return true;
  }

  if (uiNow.confluenceSlot !== attr) {
    ui.notifications?.warn("Confluence Essence can only be selected in the remaining unassigned slot.");
    revertSelect();
    return true;
  }

  const newKey = (target.value ?? "").trim();
  await sheet.document.update({ [`system.confluenceEssences.${attr}Key`]: newKey });
  return true;
}
