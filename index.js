// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ID = "xenoterracide-agent-skills";

export const DEFAULT_SKILLS_DIRECTORY = fileURLToPath(new URL("./skills/", import.meta.url));

export const JAVADOCS_MCP_URL = "https://www.javadocs.dev/mcp";

export const BOOTSTRAP_MARKER = "xenoterracide-agent-skills/using-xenoterracide-agent-skills";

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

export async function registerJavadocs(ctx) {
  await ctx.mcp.transform((editor) => {
    if (editor.get("javadocs")) return;
    editor.set("javadocs", { type: "remote", url: JAVADOCS_MCP_URL });
  });
}

export function buildSessionBootstrap() {
  return [
    "<EXTREMELY_IMPORTANT>",
    BOOTSTRAP_MARKER,
    "At the start of this session, before taking any other action, invoke the `using-xenoterracide-agent-skills` skill and follow its instructions.",
    "</EXTREMELY_IMPORTANT>",
  ].join("\n");
}

async function isChildSession(ctx, sessionID) {
  if (typeof ctx.session?.get !== "function") return false;

  const session = await ctx.session.get({ sessionID });
  return Boolean(session?.parentID);
}

export async function registerSessionInit(ctx) {
  await ctx.session.hook("context", async (event) => {
    try {
      if (!Array.isArray(event?.messages)) return;

      const hasMarker = event.messages.some(
        (message) =>
          Array.isArray(message?.content) &&
          message.content.some(
            (part) => part?.type === "text" && typeof part.text === "string" && part.text.includes(BOOTSTRAP_MARKER),
          ),
      );
      if (hasMarker) return;
      if (await isChildSession(ctx, event.sessionID)) return;

      const firstUserMessage = event.messages.find((message) => message?.role === "user");
      if (!firstUserMessage) {
        event.messages.push({ role: "user", content: [{ type: "text", text: buildSessionBootstrap() }] });
        return;
      }

      if (typeof firstUserMessage.content === "string") {
        firstUserMessage.content = [{ type: "text", text: firstUserMessage.content }];
      } else if (!Array.isArray(firstUserMessage.content)) {
        firstUserMessage.content = [];
      }
      firstUserMessage.content.unshift({ type: "text", text: buildSessionBootstrap() });
    } catch (error) {
      warn("session bootstrap failed", error);
    }
  });
}

export default {
  id: PLUGIN_ID,
  async setup(ctx) {
    const options = ctx?.options ?? {};

    if (typeof ctx?.skill?.transform === "function") {
      try {
        await registerSkills(ctx);
      } catch (error) {
        warn("skill registration failed", error);
      }
    } else {
      warn("OpenCode V2 skill API unavailable; skills not registered");
    }

    if (options.javadocs !== false && typeof ctx?.mcp?.transform === "function") {
      try {
        await registerJavadocs(ctx);
      } catch (error) {
        warn("javadocs MCP registration failed", error);
      }
    }

    if (options.sessionInit !== false && typeof ctx?.session?.hook === "function") {
      try {
        await registerSessionInit(ctx);
      } catch (error) {
        warn("session bootstrap registration failed", error);
      }
    }
  },
};
