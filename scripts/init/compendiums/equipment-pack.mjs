// scripts/init/compendiums/equipment-pack.mjs

export async function bootstrapEquipmentPackFolders({
  systemId = "hwfwm-system",
  packName = "equipment"
} = {}) {
  if (!game?.user?.isGM) return;

  const packId = `${systemId}.${packName}`;
  const pack = game.packs.get(packId);

  if (!pack) {
    console.warn(`[${systemId}] Equipment folders: pack not found: ${packId}`);
    return;
  }

  if (pack.documentName !== "Item") {
    console.warn(
      `[${systemId}] Equipment folders: ${packId} is not an Item compendium (documentName=${pack.documentName})`
    );
    return;
  }

  if (pack.locked) {
    console.warn(`[${systemId}] Equipment folders: pack is locked: ${packId}`);
    return;
  }

  const weapons = await ensureFolder(pack, "Weapons", null);
  const armor = await ensureFolder(pack, "Armor", null);

  await ensureFolder(pack, "Melee Weapons", weapons.id);
  await ensureFolder(pack, "Ranged Weapons", weapons.id);

  await ensureFolder(pack, "Light Armor", armor.id);
  await ensureFolder(pack, "Medium Armor", armor.id);
  await ensureFolder(pack, "Heavy Armor", armor.id);

  console.log(`[${systemId}] Equipment folders: ensured folder tree in ${packId}`);
}

async function ensureFolder(pack, name, parentId) {
  const existing = game.folders.find(
    (f) =>
      f.pack === pack.collection &&
      f.type === pack.documentName &&
      f.name === name &&
      (f.folder?.id ?? null) === (parentId ?? null)
  );
  if (existing) return existing;

  return Folder.create({
    name,
    type: pack.documentName,
    folder: parentId ?? null,
    pack: pack.collection,
    sorting: "a"
  });
}
