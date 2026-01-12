// scripts/init/compendiums/equipment-seed.mjs
//
// Equipment Compendium Seeder (Foundry v13)
// - Idempotent: safe to run multiple times
// - Non-destructive: does NOT overwrite user-modified fields
// - Deterministic identity: flags.<systemId>.seedKey + seedVersion
//
// Seeds Item documents of type "equipment" into pack: <systemId>.equipment
// Places items into compendium folders (Weapons/Melee, Weapons/Ranged, Armor/Light/Medium/Heavy)
//
// NOTE: This file intentionally avoids mechanics. It only sets minimal classification fields.

const SYSTEM_ID = "hwfwm-system";
const SEED_VERSION = 1;

// -----------------------------
// Seed Catalog (Normal starters)
// -----------------------------
function buildSeedCatalog() {
  /** @type {Array<{seedKey:string, name:string, system:any, description?:string, folderPath:string[]}>} */
  const entries = [];

  // Helper builders
  const weapon = (category, name, seedKeySuffix, description = "") => ({
    seedKey: `weapon.${category}.${seedKeySuffix}`,
    name,
    system: {
      rankKey: "normal", // starter assumption; only applied if missing
      weapon: {
        category, // "melee" | "ranged"
        weaponType: "" // intentionally blank for now
      }
    },
    description,
    folderPath: ["Weapons", category === "melee" ? "Melee Weapons" : "Ranged Weapons"]
  });

  const armor = (armorType, name, seedKeySuffix, description = "") => ({
    seedKey: `armor.${armorType}.${seedKeySuffix}`,
    name,
    system: {
      rankKey: "normal", // starter assumption; only applied if missing
      armor: {
        armorType, // "light" | "medium" | "heavy"
        armorClassKey: "" // intentionally blank for now (template may later require)
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
    armor("light", "Leather Armor", "leather"),
    armor("light", "Studded Leather", "studded-leather")
  );

  // Armor: Medium
  entries.push(
    armor("medium", "Hide Armor", "hide"),
    armor("medium", "Chain Shirt", "chain-shirt"),
    armor("medium", "Scale Mail", "scale-mail"),
    armor("medium", "Breastplate", "breastplate")
  );

  // Armor: Heavy
  entries.push(
    armor("heavy", "Ring Mail", "ring-mail"),
    armor("heavy", "Chain Mail", "chain-mail"),
    armor("heavy", "Splint Armor", "splint"),
    armor("heavy", "Plate Armor", "plate")
  );

  return entries;
}

// -----------------------------
// Public entry point
// -----------------------------
export async function seedEquipmentCompendium({
  packName = "equipment",
  seedVersion = SEED_VERSION,
  systemId = SYSTEM_ID
} = {}) {
  if (!game?.user?.isGM) return;

  const packId = `${systemId}.${packName}`;
  const pack = game.packs.get(packId);

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

  // Ensure folder hierarchy (compendium folders are Folder docs with pack=<pack.collection>)
  const folderIdsByPath = await ensureEquipmentFolders(pack);

  // Build a fast lookup of existing documents by seedKey and by name
  const index = await pack.getIndex({
    fields: ["name", `flags.${systemId}.seedKey`]
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
    const existingIndexEntry = bySeedKey.get(seed.seedKey) ?? findBestNameMatch(byName, seed);

    if (!existingIndexEntry) {
      // Create new
      toCreate.push(buildCreateData(seed, folderIdsByPath, systemId, seedVersion));
      continue;
    }

    // Update only missing fields; never stomp user edits
    const doc = await pack.getDocument(existingIndexEntry._id);
    if (!doc) continue;

    const patch = buildNonDestructivePatch(doc, seed, folderIdsByPath, systemId, seedVersion);
    if (patch) {
      patch._id = doc.id;
      toUpdate.push(patch);
    }
  }

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

// -----------------------------
// Folder helpers (compendium folders)
// -----------------------------
async function ensureEquipmentFolders(pack) {
  // Locked structure:
  // Weapons -> Melee Weapons, Ranged Weapons
  // Armor -> Light Armor, Medium Armor, Heavy Armor

  const rootWeapons = await ensureFolder(pack, "Weapons", null);
  const rootArmor = await ensureFolder(pack, "Armor", null);

  const melee = await ensureFolder(pack, "Melee Weapons", rootWeapons.id);
  const ranged = await ensureFolder(pack, "Ranged Weapons", rootWeapons.id);

  const light = await ensureFolder(pack, "Light Armor", rootArmor.id);
  const medium = await ensureFolder(pack, "Medium Armor", rootArmor.id);
  const heavy = await ensureFolder(pack, "Heavy Armor", rootArmor.id);

  // Map by path key for quick placement
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
  // Compendium folders are Folder docs with `pack: <pack.collection>` and `type: <documentName>`
  // In v13, Folder is still the correct document for compendium folder trees.
  const existing = game.folders.find(
    (f) =>
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

// -----------------------------
// Create / Update helpers
// -----------------------------
function buildCreateData(seed, folderIdsByPath, systemId, seedVersion) {
  const folderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;

  const flags = {
    [systemId]: {
      seedKey: seed.seedKey,
      seedVersion
    }
  };

  // Keep description minimal; only set if provided
  const system = duplicate(seed.system ?? {});

  return {
    name: seed.name,
    type: "equipment",
    folder: folderId,
    system,
    flags,
    // Foundry stores HTML in system.description in many systems; your templates may differ.
    // We only set if provided; otherwise omit.
    ...(seed.description ? { system: { ...system, description: seed.description } } : {})
  };
}

function buildNonDestructivePatch(doc, seed, folderIdsByPath, systemId, seedVersion) {
  const patch = {};
  let changed = false;

  // Ensure folder placement (safe)
  const desiredFolderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;
  if (desiredFolderId && doc.folder?.id !== desiredFolderId) {
    patch.folder = desiredFolderId;
    changed = true;
  }

  // Flags: ensure seed identity exists (safe)
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
  // rankKey: if blank/undefined, set to normal (starter assumption)
  const currentRankKey = getProperty(doc, "system.rankKey");
  if (!currentRankKey && getProperty(seed, "system.rankKey")) {
    patch.system = patch.system ?? {};
    patch.system.rankKey = seed.system.rankKey;
    changed = true;
  }

  // Weapon classification
  const seedWeaponCategory = getProperty(seed, "system.weapon.category");
  if (seedWeaponCategory) {
    const curWeaponCategory = getProperty(doc, "system.weapon.category");
    if (!curWeaponCategory) {
      patch.system = patch.system ?? {};
      patch.system.weapon = patch.system.weapon ?? {};
      patch.system.weapon.category = seedWeaponCategory;
      changed = true;
    }
    // weaponType is allowed to stay blank; only set if missing and seed provides something non-empty
    const seedWeaponType = (getProperty(seed, "system.weapon.weaponType") ?? "").trim();
    const curWeaponType = (getProperty(doc, "system.weapon.weaponType") ?? "").trim();
    if (!curWeaponType && seedWeaponType) {
      patch.system = patch.system ?? {};
      patch.system.weapon = patch.system.weapon ?? {};
      patch.system.weapon.weaponType = seedWeaponType;
      changed = true;
    }
  }

  // Armor classification
  const seedArmorType = getProperty(seed, "system.armor.armorType");
  if (seedArmorType) {
    const curArmorType = getProperty(doc, "system.armor.armorType");
    if (!curArmorType) {
      patch.system = patch.system ?? {};
      patch.system.armor = patch.system.armor ?? {};
      patch.system.armor.armorType = seedArmorType;
      changed = true;
    }

    const seedArmorClassKey = (getProperty(seed, "system.armor.armorClassKey") ?? "").trim();
    const curArmorClassKey = (getProperty(doc, "system.armor.armorClassKey") ?? "").trim();
    if (!curArmorClassKey && seedArmorClassKey) {
      patch.system = patch.system ?? {};
      patch.system.armor = patch.system.armor ?? {};
      patch.system.armor.armorClassKey = seedArmorClassKey;
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

function findBestNameMatch(byName, seed) {
  const n = seed.name.trim().toLowerCase();
  const candidates = byName.get(n);
  if (!candidates?.length) return null;

  // If multiple items share the same name, try to disambiguate by category/type presence
  const wantWeaponCategory = getProperty(seed, "system.weapon.category");
  const wantArmorType = getProperty(seed, "system.armor.armorType");

  if (wantWeaponCategory) {
    const exact = candidates.find((c) => true); // index does not include system; cannot disambiguate here
    return exact ?? candidates[0];
  }

  if (wantArmorType) {
    const exact = candidates.find((c) => true);
    return exact ?? candidates[0];
  }

  return candidates[0];
}

// -----------------------------
// Small utilities
// -----------------------------
function pathKey(parts) {
  return parts.join(" / ");
}

function capitalize(s) {
  return (s ?? "").charAt(0).toUpperCase() + (s ?? "").slice(1);
}

/**
 * Safe property getter compatible with Foundry utils conventions.
 * Works for both index entries and full documents.
 */
function getProperty(obj, path) {
  try {
    return foundry.utils.getProperty(obj, path);
  } catch {
    // fallback for environments where foundry.utils may not be accessible yet
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
