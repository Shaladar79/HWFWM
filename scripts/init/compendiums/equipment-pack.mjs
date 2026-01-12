// scripts/init/compendiums/equipment-pack.mjs
//
// Equipment Pack Folder Bootstrap (Foundry v13 / V2-safe)
// - Creates ONLY the required folder hierarchy inside the equipment compendium.
// - Idempotent (safe to run multiple times)
// - Non-destructive (never deletes/renames anything)

const SYSTEM_ID = "hwfwm-system";
const PACK_NAME = "equipment";
const EXPECTED_PACK_KEY = `${SYSTEM_ID}.${PACK_NAME}`;

/**
 * Resolve the compendium pack robustly.
 * Some installs/environments can yield a collection key that doesn't match our expectation,
 * so we also locate by pack metadata.
 */
function resolveEquipmentPack() {
  // 1) Fast path: expected collection key.
  let pack = game.packs.get(EXPECTED_PACK_KEY);
  if (pack) return pack;

  // 2) Robust path: search by metadata.
  const packs = Array.from(game.packs ?? []);
  pack =
    packs.find((p) => {
      const m = p?.metadata ?? {};
      // Common v13 metadata fields we can rely on:
      // - m.name (pack name from system.json)
      // - m.type ("Item")
      // - m.system or m.packageName or m.package (varies by build)
      const pkg =
        m.system ??
        m.packageName ??
        m.package ??
        m.packageId ??
        m.id ??
        null;

      const isRightPackName = m.name === PACK_NAME;
      const isItemPack = m.type === "Item";
      const isOurSystem = pkg === SYSTEM_ID;

      return isRightPackName && isItemPack && isOurSystem;
    }) ??
    // 3) Fallback: if the pkg field isn't populated as expected, at least match pack name+type
    // AND the collection key ends with ".equipment".
    packs.find((p) => {
      const m = p?.metadata ?? {};
      return m.name === PACK_NAME && m.type === "Item" && (p.collection ?? "").endsWith(`.${PACK_NAME}`);
    });

  return pack ?? null;
}

/**
 * Attempt to load compendium folders in a v13-safe way.
 */
async function loadPackFolders(pack) {
  if (pack?.folders) {
    if (typeof pack.folders.getDocuments === "function") {
      return await pack.folders.getDocuments();
    }
    if (Array.isArray(pack.folders.contents)) return pack.folders.contents;
    if (Array.isArray(pack.folders)) return pack.folders;
  }
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

async function ensureFolder(pack, allFolders, name, parentId = null) {
  const existing = findFolderByName(allFolders, name, parentId);
  if (existing) return existing;

  const data = {
    name,
    type: "Item",
    sorting: "a"
  };
  if (parentId) data.folder = parentId;

  const created = await Folder.create(data, { pack: pack.collection });
  if (created) allFolders.push(created);
  return created;
}

export async function ensureEquipmentPackFolders() {
  const pack = resolveEquipmentPack();

  if (!pack) {
    const keys = Array.from(game.packs ?? []).map((p) => p.collection).sort();
    console.warn(
      `[HWFWM] Equipment pack not found. Expected key: ${EXPECTED_PACK_KEY}. ` +
        `Check system.json pack name/type/system and that packs/equipment.db exists. ` +
        `Known packs:`,
      keys
    );
    return;
  }

  if (pack.locked) {
    console.warn(
      `[HWFWM] Equipment pack is locked (${pack.collection}). Unlock the compendium to allow folder creation.`
    );
    return;
  }

  const folders = await loadPackFolders(pack);

  const weapons = await ensureFolder(pack, folders, "Weapons", null);
  await ensureFolder(pack, folders, "Melee Weapons", weapons.id);
  await ensureFolder(pack, folders, "Ranged Weapons", weapons.id);

  const armor = await ensureFolder(pack, folders, "Armor", null);
  await ensureFolder(pack, folders, "Light Armor", armor.id);
  await ensureFolder(pack, folders, "Medium Armor", armor.id);
  await ensureFolder(pack, folders, "Heavy Armor", armor.id);

  console.log(`[HWFWM] Equipment compendium folders ensured for ${pack.collection}.`);
}

export function registerEquipmentPackFolderBootstrap() {
  Hooks.once("ready", () => {
    ensureEquipmentPackFolders().catch((err) => {
      console.error(`[HWFWM] Failed to ensure Equipment pack folders:`, err);
    });
  });
}
