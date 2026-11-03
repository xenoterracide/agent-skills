// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { format, resolveConfig } from "prettier";

/**
 * Generates the OpenCode skill catalog (`index.json`) consumed by the
 * OpenCode V2 `skills` array, either as a local directory or an HTTP base URL.
 *
 * Catalog format: the base URL serves `index.json`:
 *   { "skills": [{ "name", "version", "files": [...] }] }
 * Each entry's files are downloaded from `<base>/<name>/<file>`.
 */
const root = join(import.meta.dirname, "..");
const skillsDir = join(root, "skills");
const indexFile = join(skillsDir, "index.json");
const pluginManifest = JSON.parse(readFileSync(join(root, ".kimi-plugin", "plugin.json"), "utf8"));
const version = pluginManifest.version;

export function listSkillFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "tests") continue;
      files.push(...listSkillFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

export async function formatIndex(index) {
  // resolveConfig loads .prettierrc.cjs; a bare format() call would use
  // default printWidth 80 and diverge from the CLI-formatted file.
  const config = await resolveConfig(indexFile);
  return format(`${JSON.stringify(index, null, 2)}\n`, { ...config, filepath: indexFile });
}

async function main() {
  const skills = [];
  for (const name of readdirSync(skillsDir).sort()) {
    const dir = join(skillsDir, name);
    if (!statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, "SKILL.md"))) continue;
    const files = listSkillFiles(dir)
      .map((file) => relative(dir, file))
      .sort();
    skills.push({ name, version, files });
  }

  const index = { skills };
  const output = await formatIndex(index);

  if (process.argv.includes("--check")) {
    if (readFileSync(indexFile, "utf8") !== output) {
      console.error(`skill catalog ${relative(root, indexFile)} is out of date — run \`pnpm skills:catalog\``);
      process.exit(1);
    }
    console.log(`skill catalog is up to date (${skills.length} skills, version ${version})`);
  } else {
    writeFileSync(indexFile, output);
    console.log(`wrote ${relative(root, indexFile)} (${skills.length} skills, version ${version})`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
