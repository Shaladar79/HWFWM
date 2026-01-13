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

  // NOTE:
  // Compendium "locked" is about document write operations inside the pack.
  // Folder documents are separate and can be created without trying to configure the pack.
  // Also, pack.configure({locked:false}) may be restricted depending on permissions/modules.
  // So we avoid "unlock attempts" here and just ensure the folder tree.

  const weapons = await ensureFolder(pack, "Weapons", null);
  const armor = await ensureFolder(pack, "Armor", null);

  const melee = await ensureFolder(pack, "Melee Weapons", weapons.id);
  const ranged = await ensureFolder(pack, "Ranged Weapons", weapons.id);

  const light = await ensureFolder(pack, "Light Armor", armor.id);
  const medium = await ensureFolder(pack, "Medium Armor", armor.id);
  const heavy = await ensureFolder(pack, "Heavy Armor", armor.id);

  console.log(`[${systemId}] Equipment folders: ensured folder tree in ${packId}`, {
    weapons: weapons?.id,
    melee: melee?.id,
    ranged: ranged?.id,
    armor: armor?.id,
    light: light?.id,
    medium: medium?.id,
    heavy: heavy?.id,
    packCollection: pack.collection
  });
}

function getFolderCollection() {
  // v13-safe: prefer canonical collection API.
  return game?.collections?.get?.("Folder") ?? game?.folders ?? null;
}

async function ensureFolder(pack, name, parentId) {
  const folders = getFolderCollection();
  if (!folders) {
    throw new Error("Folder collection is unavailable (game.collections.get('Folder') returned null).");
  }

  const existing = Array.from(folders.values()).find((f) => {
    const fParentId = f.folder?.id ?? f.folder ?? null;
    return (
      f.pack === pack.collection &&
      f.type === pack.documentName &&
      f.name === name &&
      (fParentId ?? null) === (parentId ?? null)
    );
  });

  if (existing) return existing;

  const created = await Folder.create({
    name,
    type: pack.documentName, // "Item"
    folder: parentId ?? null,
    pack: pack.collection,
    sorting: "a"
  });

  console.log(
    `[${pack.metadata?.system ?? "system"}] Equipment folders: created "${name}" (parent=${parentId ?? "null"}) in pack=${pack.collection}`
  );

  return created;
}
