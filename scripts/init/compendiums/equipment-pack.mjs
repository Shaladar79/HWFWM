export function registerEquipmentPackFolderBootstrap() {
  Hooks.once("ready", async () => {
    const pack = game.packs.get("hwfwm-system.equipment");
    if (!pack) return;

    if (pack.documentName !== "Item") return;

    // Root folders
    const weapons = await ensureFolder(pack, "Weapons", null);
    const armor = await ensureFolder(pack, "Armor", null);

    // Weapon subfolders
    await ensureFolder(pack, "Melee Weapons", weapons.id);
    await ensureFolder(pack, "Ranged Weapons", weapons.id);

    // Armor subfolders
    await ensureFolder(pack, "Light Armor", armor.id);
    await ensureFolder(pack, "Medium Armor", armor.id);
    await ensureFolder(pack, "Heavy Armor", armor.id);
  });
}

async function ensureFolder(pack, name, parentId) {
  const existing = game.folders.find(
    f =>
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
