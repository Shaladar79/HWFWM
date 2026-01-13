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

  // Ensure folder tree INSIDE the compendium pack.
  const weapons = await ensureCompendiumFolder(pack, "Weapons", null);
  const armor = await ensureCompendiumFolder(pack, "Armor", null);

  const melee = await ensureCompendiumFolder(pack, "Melee Weapons", weapons.id);
  const ranged = await ensureCompendiumFolder(pack, "Ranged Weapons", weapons.id);

  const light = await ensureCompendiumFolder(pack, "Light Armor", armor.id);
  const medium = await ensureCompendiumFolder(pack, "Medium Armor", armor.id);
  const heavy = await ensureCompendiumFolder(pack, "Heavy Armor", armor.id);

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

/**
 * IMPORTANT:
 * Prevent world-level folder pollution by ONLY considering folders that already belong
 * to this compendium pack (folder.pack === pack.collection).
 *
 * In v13, folder.parent / folder.folder differences can be confusing; we normalize parentId
 * using the safest checks.
 */
async function ensureCompendiumFolder(pack, name, parentId) {
  const existing = findExistingCompendiumFolder(pack, name, parentId);
  if (existing) return existing;

  const created = await Folder.create({
    name,
    type: pack.documentName, // "Item"
    folder: parentId ?? null, // parent folder id
    pack: pack.collection, // IMPORTANT: compendium collection, e.g. "hwfwm-system.equipment"
    sorting: "a"
  });

  console.log(
    `[${pack.metadata?.system ?? "system"}] Equipment folders: created "${name}" (parent=${parentId ?? "null"}) in pack=${pack.collection}`
  );

  return created;
}

function findExistingCompendiumFolder(pack, name, parentId) {
  // game.folders is the canonical in-memory collection.
  // The critical filter is f.pack === pack.collection, otherwise we can accidentally match/create world folders.
  const folders = game?.folders;
  if (!folders) return null;

  const wantedParent = parentId ?? null;

  for (const f of folders) {
    if (f.pack !== pack.collection) continue;
    if (f.type !== pack.documentName) continue;
    if (f.name !== name) continue;

    // Normalize parent id across versions/structures.
    const fParent =
      f.folder?.id ??
      f.folder ??
      f.parent?.id ??
      f.parent ??
      null;

    if ((fParent ?? null) === wantedParent) return f;
  }

  return null;
}
