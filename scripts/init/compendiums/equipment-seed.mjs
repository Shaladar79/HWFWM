// scripts/init/compendiums/equipment-seed.mjs
//
// Equipment Compendium Seeder (Foundry v13)
// - Idempotent: safe to run multiple times
// - Non-destructive: does NOT overwrite user-modified fields (except folder placement for matched/managed items)
// - Deterministic identity: flags.<systemId>.seedKey + seedVersion
//
// Seeds Item documents of type "equipment" into pack: <systemId>.equipment
// Places items into compendium folders (Weapons/Melee, Weapons/Ranged, Armor/Light/Medium/Heavy)
//
// IMPORTANT:
// - This file must NOT create world folders.
// - Folder operations are hard-scoped to folders whose `pack === pack.collection`.

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

  // Do NOT attempt to unlock/configure packs here.
  // If the compendium is locked, we cannot create/update Item docs (that’s expected).
  if (pack.locked) {
    console.warn(`[${systemId}] Equipment seed: pack is locked; skipping item writes: ${packId}`);
    return;
  }

  // Ensure folder hierarchy (compendium folders are Folder docs with pack=<pack.collection>)
  // This is safe and does NOT create world folders because ensureFolder is hard-scoped.
  const folderIdsByPath = await ensureEquipmentFolders(pack, systemId);

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

async function ensureEquipmentFolders(pack, systemId) {
  const rootWeapons = await ensureFolder(pack, "Weapons", null, systemId);
  const rootArmor = await ensureFolder(pack, "Armor", null, systemId);

  const melee = await ensureFolder(pack, "Melee Weapons", rootWeapons.id, systemId);
  const ranged = await ensureFolder(pack, "Ranged Weapons", rootWeapons.id, systemId);

  const light = await ensureFolder(pack, "Light Armor", rootArmor.id, systemId);
  const medium = await ensureFolder(pack, "Medium Armor", rootArmor.id, systemId);
  const heavy = await ensureFolder(pack, "Heavy Armor", rootArmor.id, systemId);

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

function getParentId(folder) {
  return (
    folder?.folder?.id ??
    folder?.folder ??
    folder?.parent?.id ??
    folder?.parent ??
    null
  );
}

async function ensureFolder(pack, name, parentId, systemId) {
  const folders = game?.folders;
  if (!folders) throw new Error("game.folders is unavailable.");

  // CRITICAL: Only consider folders that belong to THIS compendium pack.
  const existing = Array.from(folders).find((f) => {
    if (f.pack !== pack.collection) return false;
    if (f.type !== pack.documentName) return false;
    if (f.name !== name) return false;

    const fParentId = getParentId(f);
    return (fParentId ?? null) === (parentId ?? null);
  });

  if (existing) return existing;

  const created = await Folder.create({
    name,
    type: pack.documentName,      // "Item"
    folder: parentId ?? null,     // parent folder id
    pack: pack.collection,        // e.g. "hwfwm-system.equipment"
    sorting: "a"
  });

  console.log(
    `[${systemId}] Equipment folders: created "${name}" (parent=${parentId ?? "null"}) in pack=${pack.collection}`
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

  const currentFolderId = doc.folder?.id ?? doc.folder ?? null;

  // We matched this doc to a seed row (by seedKey or name), so folder placement is authoritative.
  const desiredFolderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;
  if (desiredFolderId && currentFolderId !== desiredFolderId) {
    patch.folder = desiredFolderId;
    changed = true;
  }

  // Seed identity flags: safe to add
  const existingSeedKey = getProperty(doc, `flags.${systemId}.seedKey`);
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

  // Minimal system fields: only fill if missing
  const currentRankKey = getProperty(doc, "system.rankKey");
  if (!currentRankKey && getProperty(seed, "system.rankKey")) {
    patch.system = patch.system ?? {};
    patch.system.rankKey = seed.system.rankKey;
    changed = true;
  }

  // Weapon classification (fill missing only)
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

  // Armor classification (fill missing only)
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

  // Description: only set if empty and seed provides one
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

    const cFolderId = c.folder?.id ?? c.folder ?? null;
    if (!cFolderId || !desiredFolderId || cFolderId === desiredFolderId) return c;
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
