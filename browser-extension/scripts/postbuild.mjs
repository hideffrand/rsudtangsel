import { readdir, rename, readFile, writeFile, cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT = "out";
const TEXT_EXTS = new Set([".html", ".js", ".css", ".txt", ".json", ".map"]);

if (!existsSync(OUT)) {
  console.error(`"${OUT}" not found - run "npm run build:next" first.`);
  process.exit(1);
}

// Chrome refuses to load an unpacked extension if ANY file or directory
// anywhere in the tree starts with "_" (reserved for the system - see
// extensions/common/file_util.cc). Next.js's static export emits several:
// _next/, _buildManifest.js, _ssgManifest.js, _not-found/, _error-*.js,
// _app-*.js. Rename them all and rewrite every reference across the
// exported output, rather than special-casing just "_next".
await fixReservedNames(OUT);

await cp("manifest.json", `${OUT}/manifest.json`);
await mkdir(`${OUT}/icons`, { recursive: true });
await cp("public/icons", `${OUT}/icons`, { recursive: true });
// Background service worker is a tiny plain-JS file; copied as-is so the
// build never depends on a native esbuild binary (cross-platform hazard).
await cp("src/background.js", `${OUT}/background.js`);

console.log(`Extension assembled in ${OUT}/ — load it via chrome://extensions → Load unpacked.`);

async function fixReservedNames(root) {
  const entries = await collectUnderscoreEntries(root);
  if (entries.length === 0) return;

  // Rename deepest paths first so a parent dir rename never invalidates
  // a child path we still need to touch.
  entries.sort((a, b) => b.depth - a.depth);

  const replacements = []; // ordered [fromString, toString] pairs

  for (const e of entries) {
    if (e.oldName === "_next") {
      // Special-cased for a clearer name; every other reserved name just
      // has its leading underscore(s) stripped.
      const newFull = path.join(e.parentDir, "next-assets");
      await rename(e.full, newFull);
      replacements.push(["/_next/", "/next-assets/"]);
    } else {
      const newName = e.oldName.replace(/^_+/, "") || "asset";
      const newFull = path.join(e.parentDir, newName);
      await rename(e.full, newFull);
      replacements.push([e.oldName, newName]);
    }
  }

  await rewriteReferences(root, replacements);
}

async function collectUnderscoreEntries(dir, acc = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectUnderscoreEntries(full, acc);
    if (entry.name.startsWith("_")) {
      acc.push({ parentDir: dir, oldName: entry.name, full, depth: full.split(path.sep).length });
    }
  }
  return acc;
}

async function rewriteReferences(dir, replacements) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await rewriteReferences(full, replacements);
      continue;
    }
    if (!TEXT_EXTS.has(path.extname(entry.name))) continue;

    let content = await readFile(full, "utf8");
    let changed = false;
    for (const [from, to] of replacements) {
      if (content.includes(from)) {
        content = content.split(from).join(to);
        changed = true;
      }
    }
    if (changed) await writeFile(full, content);
  }
}
