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
  const root = await ensureCompendiumFolder(pack, "Talents", null);
  const combat = await ensureCompendiumFolder(pack, "Combat", root.id);
  const utility = await ensureCompendiumFolder(pack, "Utility", root.id);
  const crafting = await ensureCompendiumFolder(pack, "Crafting", root.id);
  const magic = await ensureCompendiumFolder(pack, "Magic", root.id);

  console.log(`[${systemId}] Talents folders: ensured folder tree in ${packId}`, {
    root: root?.id,
    combat: combat?.id,
    utility: utility?.id,
    crafting: crafting?.id,
    magic: magic?.id,
    packCollection: pack.collection
  });
}

/* -------------------------------------------- */
/* Folder helpers                                */
/* -------------------------------------------- */

function getFolderCollection() {
  // v13-safe: prefer canonical collection API.
  return game?.collections?.get?.("Folder") ?? game?.folders ?? null;
}

function getFolderId(value) {
  // v13: sometimes string id, sometimes Folder doc
  if (!value) return null;
  if (typeof value === "string") return value;
  return value?.id ?? null;
}

async function ensureCompendiumFolder(pack, name, parentId) {
  const folders = getFolderCollection();
  if (!folders) {
    throw new Error("Folder collection is unavailable (game.collections.get('Folder') returned null).");
  }

  // Only match folders that belong to THIS compendium pack.
  const existing = Array.from(folders.values()).find((f) => {
    const fParentId = getFolderId(f.folder);
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
    `[${pack.metadata?.system ?? "system"}] Talents folders: created "${name}" (parent=${parentId ?? "null"}) in pack=${pack.collection}`
  );

  return created;
}
