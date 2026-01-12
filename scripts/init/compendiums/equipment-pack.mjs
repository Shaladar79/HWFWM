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
  const rootArmor = await ensureFolder(pack, "Armor", n
