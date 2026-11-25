// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ID = "xenoterracide-agent-skills";

export const DEFAULT_SKILLS_DIRECTORY = fileURLToPath(new URL("./skills/", import.meta.url));

export const JAVADOCS_MCP_URL = "https://www.javadocs.dev/mcp";

export const BOOTSTRAP_MARKER = "xenoterracide-agent-skills/using-xenoterracide-agent-skills";

export const CURATED_GIT_ALIASES = Object.freeze(
  [
    { name: "sync", value: "fetch --all --prune --quiet" },
    { name: "sp", value: "status --porcelain=v1 --branch" },
    { name: "last", value: "log -1 --oneline" },
    { name: "lg", value: "log --oneline --decorate" },
    { name: "ds", value: "diff --stat" },
    { name: "dc", value: "diff --check" },
    { name: "c", value: "!git add -A && git commit --quiet -F -" },
    { name: "p", value: "push --quiet" },
    { name: "pl", value: "pull --quiet --ff-only" },
    { name: "bd", value: "branch -D --quiet" },
    { name: "bc", value: "branch --show-current" },
    { name: "nb", value: "switch --quiet -c" },
    { name: "wtl", value: "worktree list" },
    { name: "wta", value: "worktree add --quiet" },
    { name: "wtr", value: "worktree remove" },
    { name: "wtp", value: "worktree prune" },
    {
      name: "mainwt",
      value: '!git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel',
    },
  ].map((alias) => Object.freeze(alias)),
);

function defaultGitAliasRunner(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

export function parseGitAliasOutput(stdout) {
  const aliases = new Map();

  for (const line of stdout.split(/\r?\n/)) {
    if (line.trim() === "") continue;

    const separator = line.indexOf(" ");
    if (!line.startsWith("alias.") || separator === -1) {
      throw new Error(`malformed git alias line: ${line}`);
    }

    aliases.set(line.slice("alias.".length, separator), line.slice(separator + 1));
  }

  return aliases;
}

export function readGitAliases(run = defaultGitAliasRunner) {
  let result;
  try {
    result = run(["config", "--get-regexp", "^alias\\."]);
  } catch (error) {
    warn("failed to read git aliases", error);
    return undefined;
  }

  if (result?.error) {
    warn("failed to read git aliases", result.error);
    return undefined;
  }

  if (result?.status === 0) {
    try {
      return parseGitAliasOutput(result.stdout ?? "");
    } catch (error) {
      warn("failed to parse git aliases", error);
      return undefined;
    }
  }

  if (result?.status === 1 && (result.stdout ?? "") === "") return new Map();

  warn("failed to read git aliases", result?.stderr ?? `git exited with status ${result?.status}`);
  return undefined;
}

export function buildAliasBlock(aliases) {
  const lines = [...aliases]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `alias.${name} ${value}`);
  if (lines.length === 0) return "";
  return `Git aliases:\n${lines.join("\n")}`;
}

export function classifyAliases(current) {
  const missing = [];
  const conflicts = [];

  for (const curated of CURATED_GIT_ALIASES) {
    if (!current.has(curated.name)) {
      missing.push(curated);
      continue;
    }

    const value = current.get(curated.name);
    if (value !== curated.value) {
      conflicts.push({ name: curated.name, current: value, curated: curated.value });
    }
  }

  return { missing, conflicts };
}

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

export const JAVA_PROJECT_MARKERS = [
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "mvnw",
  "mvnw.cmd",
  "gradlew",
  "gradlew.bat",
];

export function isJavaProject(directory) {
  if (!directory) return false;
  return JAVA_PROJECT_MARKERS.some((marker) => existsSync(join(directory, marker)));
}

export async function registerJavadocs(ctx, mode = "auto") {
  if (mode === "auto") {
    const directory = ctx.location?.directory;
    if (directory && !isJavaProject(directory)) return;
  }

  await ctx.mcp.transform((editor) => {
    if (editor.get("javadocs")) return;
    editor.set("javadocs", { type: "remote", url: JAVADOCS_MCP_URL });
  });
}

export function buildSessionBootstrap(blocks = []) {
  return [
    "<EXTREMELY_IMPORTANT>",
    BOOTSTRAP_MARKER,
    "At the start of this session, before taking any other action, invoke the `using-xenoterracide-agent-skills` skill and follow its instructions.",
    "</EXTREMELY_IMPORTANT>",
    ...blocks.filter((block) => typeof block === "string" && block.length > 0),
  ].join("\n");
}

async function isChildSession(ctx, sessionID) {
  if (typeof ctx.session?.get !== "function") return false;

  const session = await ctx.session.get({ sessionID });
  return Boolean(session?.parentID);
}

export async function registerSessionInit(ctx, aliases = new Map()) {
  const blocks = [buildAliasBlock(aliases)].filter((block) => block.length > 0);

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
        event.messages.push({ role: "user", content: [{ type: "text", text: buildSessionBootstrap(blocks) }] });
        return;
      }

      if (typeof firstUserMessage.content === "string") {
        firstUserMessage.content = [{ type: "text", text: firstUserMessage.content }];
      } else if (!Array.isArray(firstUserMessage.content)) {
        firstUserMessage.content = [];
      }
      firstUserMessage.content.unshift({ type: "text", text: buildSessionBootstrap(blocks) });
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
        await registerJavadocs(ctx, options.javadocs === true ? "always" : "auto");
      } catch (error) {
        warn("javadocs MCP registration failed", error);
      }
    }

    let aliases = new Map();
    if (options.sessionInit !== false && typeof ctx?.session?.hook === "function") {
      try {
        aliases = readGitAliases(options.gitAliases?.runner ?? defaultGitAliasRunner) ?? new Map();
      } catch (error) {
        warn("failed to load git aliases", error);
      }

      try {
        await registerSessionInit(ctx, aliases);
      } catch (error) {
        warn("session bootstrap registration failed", error);
      }
    }
  },
};
