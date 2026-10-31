// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ID = "xenoterracide-agent-skills";

export const DEFAULT_SKILLS_DIRECTORY = fileURLToPath(new URL("./skills/", import.meta.url));

function warn(message, error) {
  if (error === undefined) console.warn(`[${PLUGIN_ID}] ${message}`);
  else console.warn(`[${PLUGIN_ID}] ${message}`, error);
}

export function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: source };

  const data = {};
  const lines = match[1].split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const entry = lines[index].match(/^([A-Za-z0-9_-]+):[ \t]*(.*)$/);
    if (!entry) continue;

    const [, key, rawValue] = entry;
    if (/^[|>][+-]?$/.test(rawValue.trim())) {
      const collected = [];
      while (index + 1 < lines.length) {
        const next = lines[index + 1];
        if (next !== "" && !/^\s/.test(next)) break;
        collected.push(next.trim());
        index += 1;
      }
      data[key] = collected.join(" ").trim();
    } else {
      data[key] = rawValue.trim().replace(/^(['"])([\s\S]*)\1$/, "$2");
    }
  }

  return { data, body: match[2] };
}

export function parseSkillFile(filePath, source) {
  if (!source.startsWith("---")) return undefined;

  const { data, body } = parseFrontmatter(source);
  if (!data.name) return undefined;

  return {
    id: basename(dirname(filePath)),
    name: data.name,
    description: data.description ?? "",
    path: filePath,
    content: body,
  };
}

export async function registerSkills(ctx, skillsDirectory = DEFAULT_SKILLS_DIRECTORY) {
  const entries = readdirSync(skillsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .sort((left, right) => left.name.localeCompare(right.name));

  const skills = [];
  for (const entry of entries) {
    const skillPath = join(skillsDirectory, entry.name, "SKILL.md");
    try {
      const skill = parseSkillFile(skillPath, readFileSync(skillPath, "utf8"));
      if (skill) skills.push(skill);
      else warn(`skipping malformed skill: ${skillPath}`);
    } catch (error) {
      warn(`skipping unreadable skill: ${skillPath}`, error);
    }
  }

  await ctx.skill.transform((editor) => {
    for (const skill of skills) {
      try {
        if (editor.get(skill.id)) continue;
        editor.add(skill);
      } catch (error) {
        warn(`skill "${skill.id}" rejected by OpenCode`, error);
      }
    }
  });
}

export default {
  id: PLUGIN_ID,
  async setup(ctx) {
    if (typeof ctx?.skill?.transform === "function") {
      try {
        await registerSkills(ctx);
      } catch (error) {
        warn("skill registration failed", error);
      }
    } else {
      warn("OpenCode V2 skill API unavailable; skills not registered");
    }
  },
};
