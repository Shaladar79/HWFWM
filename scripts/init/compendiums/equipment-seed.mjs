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
