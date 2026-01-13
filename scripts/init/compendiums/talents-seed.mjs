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

  if (pack.locked) {
    console.warn(`[${systemId}] Talents seed: pack is locked; skipping item writes: ${packId}`);
    return;
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
    const existingIndexEntry = bySeedKey.get(seed.seedKey) ?? findBestNameMatch(byName, seed, systemId);

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

/* ---------------- Folder helpers (compendium-only) ---------------- */

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

function getParentId(folder) {
  return folder?.folder?.id ?? folder?.folder ?? folder?.parent?.id ?? folder?.parent ?? null;
}

async function ensureFolder(pack, name, parentId) {
  const folders = game?.folders;
  if (!folders) throw new Error("game.folders is unavailable.");

  const existing = Array.from(folders).find((f) => {
    if (f.pack !== pack.collection) return false;
    if (f.type !== pack.documentName) return false;
    if (f.name !== name) return false;
    return (getParentId(f) ?? null) === (parentId ?? null);
  });

  if (existing) return existing;

  return Folder.create({
    name,
    type: pack.documentName,
    folder: parentId ?? null,
    pack: pack.collection,
    sorting: "a"
  });
}

/* ---------------- Create / Update helpers ---------------- */

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
    type: "talent",
    folder: folderId,
    system,
    flags
  };
}

function buildNonDestructivePatch(doc, seed, folderIdsByPath, systemId, seedVersion) {
  const patch = {};
  let changed = false;

  // Folder placement is authoritative for matched seed rows
  const currentFolderId = doc.folder?.id ?? doc.folder ?? null;
  const desiredFolderId = folderIdsByPath.get(pathKey(seed.folderPath)) ?? null;
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

function findBestNameMatch(byName, seed, systemId) {
  const n = seed.name.trim().toLowerCase();
  const candidates = byName.get(n);
  if (!candidates?.length) return null;

  // Only adopt by-name items that do NOT already have a seedKey
  for (const c of candidates) {
    const hasSeed = !!getProperty(c, `flags.${systemId}.seedKey`);
    if (!hasSeed) return c;
  }

  return null;
}

/* ---------------- Utilities ---------------- */

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
