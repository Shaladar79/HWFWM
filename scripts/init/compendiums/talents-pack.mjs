// scripts/init/compendiums/talents-pack.mjs
//
// Talents compendium folder bootstrap (Foundry v13)
// Creates ONLY compendium folders (Folder docs with pack=<pack.collection>)
// Does NOT create world folders.

export async function bootstrapTalentsPackFolders({
  systemId = "hwfwm-system",
  packName = "talents"
} = {}) {
  if (!game?.user?.isGM) return;

  const packId = `${systemId}.${packName}`;
  const pack = game.packs.get(packId);

  if (!pack) {
    console.warn(`[${systemId}] Talents folders: pack not found: ${packId}`);
    return;
  }

  if (pack.documentName !== "Item") {
    console.warn(
      `[${systemId}] Talents folders: ${packId} is not an Item compendium (documentName=${pack.documentName})`
    );
    return;
  }

  // Simple starter structure you can expand later
  const root = await ensureFolder(pack, "Talents", null);
  const combat = await ensureFolder(pack, "Combat", root.id);
  const utility = await ensureFolder(pack, "Utility", root.id);
  const crafting = await ensureFolder(pack, "Crafting", root.id);
  const magic = await ensureFolder(pack, "Magic", root.id);

  console.log(`[${systemId}] Talents folders: ensured folder tree in ${packId}`, {
    root: root?.id,
    combat: combat?.id,
    utility: utility?.id,
    crafting: crafting?.id,
    magic: magic?.id,
    packCollection: pack.collection
  });
}

function getParentId(folder) {
  return folder?.folder?.id ?? folder?.folder ?? folder?.parent?.id ?? folder?.parent ?? null;
}

async function ensureFolder(pack, name, parentId) {
  const folders = game?.folders;
  if (!folders) throw new Error("game.folders is unavailable.");

  // CRITICAL: only match folders that belong to THIS compendium
  const existing = Array.from(folders).find((f) => {
    if (f.pack !== pack.collection) return false;
    if (f.type !== pack.documentName) return false;
    if (f.name !== name) return false;
    return (getParentId(f) ?? null) === (parentId ?? null);
  });

  if (existing) return existing;

  return Folder.create({
    name,
    type: pack.documentName, // "Item"
    folder: parentId ?? null,
    pack: pack.collection,
    sorting: "a"
  });
}
