// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { format } from "prettier";

/**
 * Generates the OpenCode skill catalog (`index.json`) consumed via
 * `skills.urls` in opencode.json.
 *
 * Catalog format (opencode 1.18.x): base URL serves `index.json`:
 *   { "skills": [{ "name", "version", "files": [...] }] }
 * Each entry's files are downloaded from `<base>/<name>/<file>`.
 */
const root = join(import.meta.dirname, "..");
const skillsDir = join(root, "skills");
const indexFile = join(skillsDir, "index.json");
const pluginManifest = JSON.parse(readFileSync(join(root, ".kimi-plugin", "plugin.json"), "utf8"));
const version = pluginManifest.version;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const skills = [];
for (const name of readdirSync(skillsDir).sort()) {
  const dir = join(skillsDir, name);
  if (!statSync(dir).isDirectory()) continue;
  if (!existsSync(join(dir, "SKILL.md"))) continue;
  const files = walk(dir)
    .map((file) => relative(dir, file))
    .filter((file) => file !== "index.json")
    .sort();
  skills.push({ name, version, files });
}

const index = { skills };
const output = await format(`${JSON.stringify(index, null, 2)}\n`, { filepath: indexFile });

if (process.argv.includes("--check")) {
  if (readFileSync(indexFile, "utf8") !== output) {
    console.error(`skill catalog ${relative(root, indexFile)} is out of date — run \`yarn skills:catalog\``);
    process.exit(1);
  }
  console.log(`skill catalog is up to date (${skills.length} skills, version ${version})`);
} else {
  writeFileSync(indexFile, output);
  console.log(`wrote ${relative(root, indexFile)} (${skills.length} skills, version ${version})`);
}
