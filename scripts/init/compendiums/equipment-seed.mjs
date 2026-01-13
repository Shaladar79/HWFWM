// scripts/init/compendiums/equipment-seed.mjs
//
// Equipment Compendium Seeder (Foundry v13)
// - Idempotent: safe to run multiple times
// - Non-destructive: does NOT overwrite user-modified fields (except folder placement for managed items)
// - Deterministic identity: flags.<systemId>.seedKey + seedVersion
//
// Seeds Item documents of type "equipment" into pack: <systemId>.equipment
// Places items into compendium folders (Weapons/Melee, Weapons/Ranged, Armor/Light/Medium/Heavy)

const SYSTEM_ID = "hwfwm-system";
const SEED_VERSION = 1;

/* -------------------------------------------- */
/* Seed Catalog                                  */
/* -------------------------------------------- */
function buildSeedCatalog() {
  /** @type {Array<{seedKey:string, name:string, system:any, description?:string, folderPath:string[]}>} */
  const entries = [];

  const weapon = (category, name, seedKeySuffix, description = "") => ({
    seedKey: `weapon.${category}.${seedKeySuffix}`,
    name,
    system: {
      rankKey: "normal",
      weapon: {
        category, // "melee" | "ranged"
        weaponType: ""
      }
    },
    description,
    folderPath: ["Weapons", category === "melee" ? "Melee Weapons" : "Ranged Weapons"]
  });

  const armor = (armorType, name, seedKeySuffix, description = "") => ({
    seedKey: `armor.${armorType}.${seedKeySuffix}`,
    name,
    system: {
      rankKey: "normal",
      armor: {
        armorType, // "light" | "medium" | "heavy"
        armorClassKey: ""
      }
    },
    description,
    folderPath: ["Armor", capitalize(armorType) + " Armor"]
  });

  // Weapons: Melee
  entries.push(
    weapon("melee", "Dagger", "dagger"),
    weapon("melee", "Shortsword", "shortsword"),
    weapon("melee", "Longsword", "longsword"),
    weapon("melee", "Greatsword", "greatsword"),
    weapon("melee", "Axe", "axe"),
    weapon("melee", "Great Axe", "great-axe"),
    weapon("melee", "Mace", "mace"),
    weapon("melee", "Warhammer", "warhammer"),
    weapon("melee", "Spear", "spear"),
    weapon("melee", "Halberd", "halberd"),
    weapon("melee", "Lance", "lance"),
    weapon("melee", "Staff", "staff")
  );

  // Weapons: Ranged
  entries.push(
    weapon("ranged", "Sling", "sling"),
    weapon("ranged", "Shortbow", "shortbow"),
    weapon("ranged", "Longbow", "longbow"),
    weapon("ranged", "Crossbow", "crossbow"),
    weapon("ranged", "Hand Crossbow", "hand-crossbow"),
    weapon("ranged", "Throwing Knife", "throwing-knife"),
    weapon("ranged", "Javelin", "javelin")
  );

  // Armor: Light
  entries.push(
    armor("light", "Padded Armor", "padded"),
    armor("light", "Robe", "robe"),
    armor("light", "Combat Robe", "combat-robe")
  );

  // Armor: Medium
  entries.push(
    armor("medium", "Leather Armor", "leather"),
    armor("medium", "Studded Leather", "studded-leather"),
    armor("medium", "Hide Armor", "hide"),
    armor("medium", "Chain Shirt", "chain-shirt"),
    armor("medium", "Chain Mail", "chain-mail")
  );

  // Armor: Heavy
  entries.push(
    armor("heavy", "Ring Mail", "ring-mail"),
    armor("heavy", "Scale Mail", "scale-mail"),
    armor("heavy", "Breastplate", "breastplate"),
    armor("heavy", "Splint Armor", "splint"),
    armor("heavy", "Half Plate", "half-plate"),
    armor("heavy", "Plate Armor", "plate")
  );

  return entries;
}

/* -------------------------------------------- */
/* Public entry point                            */
/* -------------------------------------------- */
export async function seedEquipmentCompendium({
  packName = "equipment",
  seedVersion = SEED_VERSION,
  systemId = SYSTEM_ID
} = {}) {
  if (!game?.user?.isGM) return;

  const packId = `${systemId}.${packName}`;
  const pack = game.packs.get(packId);

  console.log(`[${systemId}] Equipment seed: starting (pack=${packId}, seedVersion=${seedVersion})`);

  if (!pack) {
    console.warn(`[${systemId}] Equipment seed: pack not found: ${packId}`);
    return;
  }

  if (pack.documentName !== "Item") {
    console.warn(
      `[${systemId}] Equipment seed: pack ${packId} is not an Item compendium (documentName=${pack.documentName})`
    );
    return;
  }

  if (pack.locked) {
    console.warn(`[${systemId}] Equipment seed: pack is locked: ${packId}`);
    return;
  }

  const folderIdsByPath = await ensureEquipmentFolders(pack);

  // Build lookup of existing docs by seedKey and name
  const index = await pack.getIndex({
    fields: ["name", "folder", `flags.${systemId}.seedKey`]
  });

  /** @type {Map<string, any>} */
  const bySeedKey = new Map();
  /** @type {Map<string, any[]>} */
  const byName = new Map();

  for (const e of index) {
    const k = getProperty(e, `flags.${systemId}.seedKey`);
    if (k) bySeedKey.set(k, e);

    const n = (e.name ?? "").trim().toLowerCase();
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n).push(e);
  }

  const catalog = buildSeedCatalog();

  const toCreate = [];
  const toUpdate = [];

  for (const seed of catalog) {
    const existingIndexEntry =
      bySeedKey.get(seed.seedKey) ?? findBestNameMatch(byName, seed, folderIdsByPath, systemId);

    if (!existingIndexEntry) {
      toCreate.push(buildCreateData(seed, folderIdsByPath, systemId, seedVersion));
      continue;
    }

    const doc = await getPackDocument(pack, existingIndexEntry._id);
    if (!doc) continue;

    const patch = buildNonDestructivePatch(doc, seed, folderIdsByPath, systemId, seedVersion);
    if (patch) {
      patch._id = doc.id;
      toUpdate.push(patch);
    }
  }

  console.log(
    `[${systemId}] Equipment seed plan: create=${toCreate.length} update=${toUpdate.length} (pack=${packId})`
  );

  if (toCreate.length) {
    await Item.createDocuments(toCreate, { pack: pack.collection, keepId: false });
    console.log(`[${systemId}] Equipment seed: created ${toCreate.length} items in ${packId}`);
  }

  if (toUpdate.length) {
    await Item.updateDocuments(toUpdate, { pack: pack.collection });
    console.log(`[${systemId}] Equipment seed: updated ${toUpdate.length} items in ${packId}`);
  }

  if (!toCreate.length && !toUpdate.length) {
    console.log(`[${systemId}] Equipment seed: no changes needed for ${packId}`);
  }
}

/* -------------------------------------------- */
/* Folder helpers (compendium folders)           */
/* -------------------------------------------- */

function getFolderCollection() {
  // Prefer the canonical collection API.
  // In v13, game.collections.get("Folder") is reliable.
  return game?.collections?.get?.("Folder") ?? game?.folders ?? null;
}

async function ensureEquipmentFolders(pack) {
  const rootWeapons = await ensureFolder(pack, "Weapons", null);
  const rootArmor = await ensureFolder(pack, "Armor", null);

  const melee = await ensureFolder(pack, "Melee Weapons", rootWeapons.id);
  const ranged = await ensureFolder(pack, "Ranged Weapons", rootWeapons.id);

  const light = await ensureFolder(pack, "Light Armor", rootArmor.id);
  const medium = await ensureFolder(pack, "Medium Armor", rootArmor.id);
  const heavy = await ensureFolder(pack, "Heavy Armor", rootArmor.id);

  const map = new Map();
  map.set(pathKey(["Weapons"]), rootWeapons.id);
  map.set(pathKey(["Weapons", "Melee Weapons"]), melee.id);
  map.set(pathKey(["Weapons", "Ranged Weapons"]), ranged.id);

  map.set(pathKey(["Armor"]), rootArmor.id);
  map.set(pathKey(["Armor", "Light Armor"]), light.id);
  map.set(pathKey(["Armor", "Medium Armor"]), medium.id);
  map.set(pathKey(["Armor", "Heavy Armor"]), heavy.id);

  return map;
}

async function ensureFolder(pack, name, parentId) {
  const folders = getFolderCollection();
  if (!folders) {
    throw new Error("Folder collection is unavailable (game.collections.get('Folder') returned null).");
  }

  // Only look at folders that belong to THIS compendium pack.
  // IMPORTANT: use pack.collection (e.g. "hwfwm-system.equipment"), not packId.
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
    type: pack.documentName,
    folder: parentId ?? null,
    pack: pack.collection,
    sorting: "a"
  });

  console.log(
    `[${SYSTEM_ID}] Equipment folders: created "${name}" (parent=${parentId ?? "null"}) in pack=${pack.collection}`
  );

  return created;
}

/* -------------------------------------------- */
/* Create / Update helpers                       */
/* -------------------------------------------- */

function buildCreateData(seed, folderIdsByPath, systemId, seedVersion) {
  const folderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;

  const flags = {
    [systemId]: {
      seedKey: seed.seedKey,
      seedVersion
    }
  };

  const system = duplicate(seed.system ?? {});
  const desc = (seed.description ?? "").trim();
  if (desc) system.description = desc;

  return {
    name: seed.name,
    type: "equipment",
    folder: folderId,
    system,
    flags
  };
}

function buildNonDestructivePatch(doc, seed, folderIdsByPath, systemId, seedVersion) {
  const patch = {};
  let changed = false;

  const existingSeedKey = getProperty(doc, `flags.${systemId}.seedKey`);
  const shouldManage = true; // we matched this doc to a seed row; manage folder + identity safely

  const desiredFolderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;
  if (shouldManage && desiredFolderId && doc.folder?.id !== desiredFolderId) {
    patch.folder = desiredFolderId;
    changed = true;
  }

  if (!existingSeedKey) {
    patch.flags = patch.flags ?? {};
    patch.flags[systemId] = {
      ...(getProperty(doc, `flags.${systemId}`) ?? {}),
      seedKey: seed.seedKey,
      seedVersion
    };
    changed = true;
  } else {
    const existingVersion = getProperty(doc, `flags.${systemId}.seedVersion`);
    if (!existingVersion) {
      patch.flags = patch.flags ?? {};
      patch.flags[systemId] = {
        ...(getProperty(doc, `flags.${systemId}`) ?? {}),
        seedVersion
      };
      changed = true;
    }
  }

  const currentRankKey = getProperty(doc, "system.rankKey");
  if (!currentRankKey && getProperty(seed, "system.rankKey")) {
    patch.system = patch.system ?? {};
    patch.system.rankKey = seed.system.rankKey;
    changed = true;
  }

  const seedWeaponCategory = getProperty(seed, "system.weapon.category");
  if (seedWeaponCategory) {
    const curWeaponCategory = getProperty(doc, "system.weapon.category");
    if (!curWeaponCategory) {
      patch.system = patch.system ?? {};
      patch.system.weapon = patch.system.weapon ?? {};
      patch.system.weapon.category = seedWeaponCategory;
      changed = true;
    }
  }

  const seedArmorType = getProperty(seed, "system.armor.armorType");
  if (seedArmorType) {
    const curArmorType = getProperty(doc, "system.armor.armorType");
    if (!curArmorType) {
      patch.system = patch.system ?? {};
      patch.system.armor = patch.system.armor ?? {};
      patch.system.armor.armorType = seedArmorType;
      changed = true;
    }
  }

  const seedDesc = (seed.description ?? "").trim();
  const curDesc = (getProperty(doc, "system.description") ?? "").trim();
  if (!curDesc && seedDesc) {
    patch.system = patch.system ?? {};
    patch.system.description = seedDesc;
    changed = true;
  }

  return changed ? patch : null;
}

function findBestNameMatch(byName, seed, folderIdsByPath, systemId) {
  const n = seed.name.trim().toLowerCase();
  const candidates = byName.get(n);
  if (!candidates?.length) return null;

  const desiredFolderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;

  for (const c of candidates) {
    const hasSeed = !!getProperty(c, `flags.${systemId}.seedKey`);
    if (hasSeed) continue;

    const cFolder = c.folder ?? null;
    if (!cFolder || !desiredFolderId || cFolder === desiredFolderId) return c;
  }

  return null;
}

/* -------------------------------------------- */
/* Utilities                                     */
/* -------------------------------------------- */

function pathKey(parts) {
  return parts.join(" / ");
}

function capitalize(s) {
  return (s ?? "").charAt(0).toUpperCase() + (s ?? "").slice(1);
}

function getProperty(obj, path) {
  try {
    return foundry.utils.getProperty(obj, path);
  } catch {
    return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
  }
}

function duplicate(data) {
  try {
    return foundry.utils.duplicate(data);
  } catch {
    return structuredClone(data);
  }
}

async function getPackDocument(pack, id) {
  if (typeof pack.getDocument === "function") {
    const doc = await pack.getDocument(id);
    if (doc) return doc;
  }
  if (typeof pack.getDocuments === "function") {
    const docs = await pack.getDocuments({ _id: id });
    return docs?.[0] ?? null;
  }
  return null;
}
