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

  // v13 packs are often locked; unlock so we can create folders.
  if (pack.locked) {
    console.warn(`[${systemId}] Equipment folders: pack is locked, attempting to unlock: ${packId}`);
    try {
      await pack.configure({ locked: false });
      console.log(`[${systemId}] Equipment folders: pack unlocked: ${packId}`);
    } catch (err) {
      console.error(`[${systemId}] Equipment folders: failed to unlock pack ${packId}`, err);
      return;
    }
  }

  // Create/ensure the locked folder structure
  const weapons = await ensureFolder(pack, "Weapons", null);
  const armor = await ensureFolder(pack, "Armor", null);

  const melee = await ensureFolder(pack, "Melee Weapons", weapons.id);
  const ranged = await ensureFolder(pack, "Ranged Weapons", weapons.id);

  const light = await ensureFolder(pack, "Light Armor", armor.id);
  const medium = await ensureFolder(pack, "Medium Armor", armor.id);
  const heavy = await ensureFolder(pack, "Heavy Armor", armor.id);

  console.log(
    `[${systemId}] Equipment folders: ensured folder tree in ${packId}`,
    {
      weapons: weapons?.id,
      melee: melee?.id,
      ranged: ranged?.id,
      armor: armor?.id,
      light: light?.id,
      medium: medium?.id,
      heavy: heavy?.id
    }
  );
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
    type: pack.documentName, // "Item"
    folder: parentId ?? null,
    pack: pack.collection,
    sorting: "a"
  });
}
