// scripts/init/compendiums/talents-seed.mjs
//
// Talents Compendium Seeder (Foundry v13)
// - Idempotent
// - Non-destructive (does not overwrite user changes; only fills missing fields)
// - Uses flags.<systemId>.seedKey + seedVersion for deterministic identity
//
// Seeds Item documents of type "talent" into pack: <systemId>.talents

const SYSTEM_ID = "hwfwm-system";
const SEED_VERSION = 1;

/* -------------------------------------------- */
/* Seed Catalog                                  */
/* -------------------------------------------- */
function buildSeedCatalog() {
  /** @type {Array<{seedKey:string, name:string, system:any, description?:string, folderPath:string[]}>} */
  const entries = [];

  const talent = (group, name, seedKeySuffix, description = "") => ({
    seedKey: `talent.${group}.${seedKeySuffix}`,
    name,
    system: {
      // keep minimal; your talent sheet can evolve without reseeding
      rankKey: "normal",
      groupKey: group // optional field; safe if your template ignores it
    },
    description,
    folderPath: ["Talents", capitalize(group)]
  });

  // Minimal starter talents (replace/expand later)
  entries.push(
    talent("combat", "Weapon Training", "weapon-training", "Basic proficiency with weapons."),
    talent("combat", "Defensive Footwork", "defensive-footwork", "Improved positioning and guards."),
    talent("utility", "Keen Senses", "keen-senses", "Heightened perception and awareness."),
    talent("utility", "Athletic Conditioning", "athletic-conditioning", "General physical conditioning."),
    talent("crafting", "Basic Crafting", "basic-crafting", "Foundational crafting techniques."),
    talent("magic", "Mana Sensitivity", "mana-sensitivity", "Sense ambient magical energy.")
  );

  return entries;
}

/* -------------------------------------------- */
/* Public entry point                            */
/* -------------------------------------------- */
export async function seedTalentsCompendium({
  packName = "talents",
  seedVersion = SEED_VERSION,
  systemId = SYSTEM_ID
} = {}) {
  if (!game?.user?.isGM) return;

  const packId = `${systemId}.${packName}`;
  const pack = game.packs.get(packId);

  console.log(`[${systemId}] Talents seed: starting (pack=${packId}, seedVersion=${seedVersion})`);

  if (!pack) {
    console.warn(`[${systemId}] Talents seed: pack not found: ${packId}`);
    return;
  }

  if (pack.documentName !== "Item") {
    console.warn(
      `[${systemId}] Talents seed: pack ${packId} is not an Item compendium (documentName=${pack.documentName})`
    );
    return;
  }

  // If locked, attempt unlock so we can create/update docs.
  if (pack.locked) {
    console.warn(`[${systemId}] Talents seed: pack is locked, attempting to unlock: ${packId}`);
    try {
      await pack.configure({ locked: false });
      console.log(`[${systemId}] Talents seed: pack unlocked: ${packId}`);
    } catch (err) {
      console.error(`[${systemId}] Talents seed: failed to unlock pack ${packId}`, err);
      return;
    }
  }

  const folderIdsByPath = await ensureTalentsFolders(pack);

  const index = await pack.getIndex({
    fields: ["name", "folder", `flags.${systemId}.seedKey`]
  });

  const bySeedKey = new Map();
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
    const desiredFolderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;

    const existingIndexEntry =
      bySeedKey.get(seed.seedKey) ??
      findBestNameMatch(byName, seed, desiredFolderId, systemId);

    if (!existingIndexEntry) {
      toCreate.push(buildCreateData(seed, desiredFolderId, systemId, seedVersion));
      continue;
    }

    const doc = await getPackDocument(pack, existingIndexEntry._id);
    if (!doc) continue;

    const patch = buildNonDestructivePatch(doc, seed, desiredFolderId, systemId, seedVersion);
    if (patch) {
      patch._id = doc.id;
      toUpdate.push(patch);
    }
  }

  console.log(
    `[${systemId}] Talents seed plan: create=${toCreate.length} update=${toUpdate.length} (pack=${packId})`
  );

  if (toCreate.length) {
    await Item.createDocuments(toCreate, { pack: pack.collection, keepId: false });
    console.log(`[${systemId}] Talents seed: created ${toCreate.length} items in ${packId}`);
  }

  if (toUpdate.length) {
    await Item.updateDocuments(toUpdate, { pack: pack.collection });
    console.log(`[${systemId}] Talents seed: updated ${toUpdate.length} items in ${packId}`);
  }

  if (!toCreate.length && !toUpdate.length) {
    console.log(`[${systemId}] Talents seed: no changes needed for ${packId}`);
  }
}

/* -------------------------------------------- */
/* Folder helpers (compendium-only)              */
/* -------------------------------------------- */

function getFolderCollection() {
  // v13-safe: prefer canonical collection API.
  return game?.collections?.get?.("Folder") ?? game?.folders ?? null;
}

function getFolderId(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value?.id ?? null;
}

async function ensureTalentsFolders(pack) {
  const root = await ensureFolder(pack, "Talents", null);

  const combat = await ensureFolder(pack, "Combat", root.id);
  const utility = await ensureFolder(pack, "Utility", root.id);
  const crafting = await ensureFolder(pack, "Crafting", root.id);
  const magic = await ensureFolder(pack, "Magic", root.id);

  const map = new Map();
  map.set(pathKey(["Talents"]), root.id);
  map.set(pathKey(["Talents", "Combat"]), combat.id);
  map.set(pathKey(["Talents", "Utility"]), utility.id);
  map.set(pathKey(["Talents", "Crafting"]), crafting.id);
  map.set(pathKey(["Talents", "Magic"]), magic.id);

  return map;
}

async function ensureFolder(pack, name, parentId) {
  const folders = getFolderCollection();
  if (!folders) {
    throw new Error("Folder collection is unavailable (game.collections.get('Folder') returned null).");
  }

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
    `[${SYSTEM_ID}] Talents folders: created "${name}" (parent=${parentId ?? "null"}) in pack=${pack.collection}`
  );

  return created;
}

/* -------------------------------------------- */
/* Create / Update helpers                       */
/* -------------------------------------------- */

function buildCreateData(seed, desiredFolderId, systemId, seedVersion) {
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
    type: "talent",
    folder: desiredFolderId,
    system,
    flags
  };
}

function buildNonDestructivePatch(doc, seed, desiredFolderId, systemId, seedVersion) {
  const patch = {};
  let changed = false;

  // Folder placement is authoritative for matched seed rows
  const currentFolderId = getFolderId(doc.folder);
  if (desiredFolderId && currentFolderId !== desiredFolderId) {
    patch.folder = desiredFolderId;
    changed = true;
  }

  // Seed identity flags: safe to add/update seedVersion
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

  // Minimal system fields: fill missing only
  const curRankKey = getProperty(doc, "system.rankKey");
  if (!curRankKey && getProperty(seed, "system.rankKey")) {
    patch.system = patch.system ?? {};
    patch.system.rankKey = seed.system.rankKey;
    changed = true;
  }

  const curGroupKey = getProperty(doc, "system.groupKey");
  const seedGroupKey = getProperty(seed, "system.groupKey");
  if (!curGroupKey && seedGroupKey) {
    patch.system = patch.system ?? {};
    patch.system.groupKey = seedGroupKey;
    changed = true;
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

/**
 * Safer name fallback:
 * - only adopt by-name items that do NOT already have a seedKey
 * - prefer items already in the desired folder
 * - allow items with no folder (common for early manual entries)
 */
function findBestNameMatch(byName, seed, desiredFolderId, systemId) {
  const n = seed.name.trim().toLowerCase();
  const candidates = byName.get(n);
  if (!candidates?.length) return null;

  let best = null;

  for (const c of candidates) {
    const hasSeed = !!getProperty(c, `flags.${systemId}.seedKey`);
    if (hasSeed) continue;

    const cFolderId = getFolderId(c.folder);
    if (desiredFolderId && cFolderId === desiredFolderId) return c;

    if (!best && (!cFolderId || !desiredFolderId)) best = c;
  }

  return best;
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
