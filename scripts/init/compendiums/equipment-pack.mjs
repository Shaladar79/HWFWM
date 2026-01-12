// scripts/init/compendiums/equipment-pack.mjs
//
// Equipment Pack Folder Bootstrap (Foundry v13 / V2-safe)
// - Creates ONLY the required folder hierarchy inside the equipment compendium.
// - Idempotent (safe to run multiple times)
// - Non-destructive (never deletes/renames anything)
//
// Pack: hwfwm-system.equipment
// Folders (authoritative):
//   Weapons
//     - Melee Weapons
//     - Ranged Weapons
//   Armor
//     - Light Armor
//     - Medium Armor
//     - Heavy Armor

const SYSTEM_ID = "hwfwm-system";
const PACK_NAME = "equipment";
const PACK_KEY = `${SYSTEM_ID}.${PACK_NAME}`;

/**
 * Attempt to load compendium folders in a v13-safe way.
 * Different Foundry versions/patches expose slightly different helpers,
 * so we probe a couple of options.
 */
async function loadPackFolders(pack) {
  // Most common: pack.folders is a collection-like object.
  if (pack?.folders) {
    // Some builds expose getDocuments; some already have contents.
    if (typeof pack.folders.getDocuments === "function") {
      return await pack.folders.getDocuments();
    }
    if (Array.isArray(pack.folders.contents)) {
      return pack.folders.contents;
    }
    if (Array.isArray(pack.folders)) {
      return pack.folders;
    }
  }

  // Fallback: if folders are not directly accessible, return empty and rely on create-by-name attempts.
  return [];
}

function findFolderByName(folders, name, parentId) {
  return folders.find((f) => {
    const sameName = (f?.name ?? "") === name;
    const fParentId = f?.folder?.id ?? f?.folder ?? null;
    const sameParent = (fParentId ?? null) === (parentId ?? null);
    return sameName && sameParent;
  });
}

/**
 * Create or resolve a folder by (name + parent).
 * Uses Folder documents inside the compendium pack (not world folders).
 */
async function ensureFolder(pack, allFolders, name, parentId = null) {
  const existing = findFolderByName(allFolders, name, parentId);
  if (existing) return existing;

  // NOTE: Compendium folder docs are created via Folder.create with { pack: pack.collection }.
  // Folder "type" should match the compendium document type: "Item".
  const data = {
    name,
    type: "Item",
    sorting: "a"
  };

  // Parent pointer key can be either `folder` (id) or `folder` object depending on internals;
  // use id string for stability.
  if (parentId) data.folder = parentId;

  const created = await Folder.create(data, { pack: pack.collection });
  if (created) allFolders.push(created);
  return created;
}

/**
 * Ensure the Equipment compendium exists and has the authoritative folder structure.
 */
export async function ensureEquipmentPackFolders() {
  const pack = game.packs.get(PACK_KEY);

  if (!pack) {
    console.warn(`[HWFWM] Equipment pack not found: ${PACK_KEY}. Did system.json define it?`);
    return;
  }

  // If the pack is locked, we cannot create folders.
  if (pack.locked) {
    console.warn(
      `[HWFWM] Equipment pack is locked (${PACK_KEY}). Unlock the compendium to allow folder creation.`
    );
    return;
  }

  // Load known folders (best-effort).
  const folders = await loadPackFolders(pack);

  // Authoritative hierarchy
  const weapons = await ensureFolder(pack, folders, "Weapons", null);
  await ensureFolder(pack, folders, "Melee Weapons", weapons.id);
  await ensureFolder(pack, folders, "Ranged Weapons", weapons.id);

  const armor = await ensureFolder(pack, folders, "Armor", null);
  await ensureFolder(pack, folders, "Light Armor", armor.id);
  await ensureFolder(pack, folders, "Medium Armor", armor.id);
  await ensureFolder(pack, folders, "Heavy Armor", armor.id);

  console.log(`[HWFWM] Equipment compendium folders ensured for ${PACK_KEY}.`);
}

/**
 * Call this from your system entrypoint (system.mjs) once.
 * Kept as a function to avoid side effects on import.
 */
export function registerEquipmentPackFolderBootstrap() {
  Hooks.once("ready", () => {
    // Fire-and-forget is acceptable here; failures are logged and non-fatal.
    ensureEquipmentPackFolders().catch((err) => {
      console.error(`[HWFWM] Failed to ensure Equipment pack folders for ${PACK_KEY}:`, err);
    });
  });
}
