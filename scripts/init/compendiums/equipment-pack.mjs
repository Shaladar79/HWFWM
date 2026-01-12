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
 * v13-safe way to get an array of all compendium packs.
 * game.packs is a Foundry Collection; the reliable property is .contents.
 */
function getAllPacks() {
  if (game.packs?.contents) return game.packs.contents;
  // Fallback if contents isn't present for some reason
  if (typeof game.packs?.values === "function") return Array.from(game.packs.values());
  // Last resort
  return [];
}

/**
 * Resolve the compendium pack robustly.
 */
function resolveEquipmentPack() {
  // 1) Fast path: expected collection key.
  const direct = game.packs.get(EXPECTED_PACK_KEY);
  if (direct) return direct;

  const packs = getAllPacks();

  // 2) Metadata-based match (preferred).
  let pack = packs.find((p) => {
    const m = p?.metadata ?? {};
    const pkg =
      m.system ??
      m.packageName ??
      m.package ??
      m.packageId ??
      m.id ??
      null;

    return m.name === PACK_NAME && m.type === "Item" && pkg === SYSTEM_ID;
  });

  if (pack) return pack;

  // 3) Fallback: match by name+type and collection suffix.
  pack = packs.find((p) => {
    const m = p?.metadata ?? {};
    return m.name === PACK_NAME && m.type === "Item" && (p.collection ?? "").endsWith(`.${PACK_NAME}`);
  });

  return pack ?? null;
}

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

  const data = { name, type: "Item", sorting: "a" };
  if (parentId) data.folder = parentId;

  const created = await Folder.create(data, { pack: pack.collection });
  if (created) allFolders.push(created);
  return created;
}

export async function ensureEquipmentPackFolders() {
  const pack = resolveEquipmentPack();

  if (!pack) {
    const keys = getAllPacks().map((p) => p.collection).sort();
    console.warn(
      `[HWFWM] Equipment pack not found. Expected key: ${EXPECTED_PACK_KEY}. ` +
        `Known packs (${keys.length}):`,
      keys
    );
    console.warn(
      `[HWFWM] Verify: (1) system.json has packs[] entry name="${PACK_NAME}" type="Item" system="${SYSTEM_ID}", ` +
        `(2) the file packs/${PACK_NAME}.db exists in the installed system folder.`
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
