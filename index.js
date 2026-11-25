// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: MIT

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ID = "xenoterracide-agent-skills";
const INSTALL_GIT_ALIASES_TOOL = "install_git_aliases";

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

export function buildInstallOffer({ missing, conflicts }) {
  const lines = ["Install git aliases:"];

  if (missing.length > 0) {
    lines.push("Missing:", ...missing.map(({ name, value }) => `  ${name} = ${value}`));
  }
  if (conflicts.length > 0) {
    lines.push(
      "Conflicts:",
      ...conflicts.map(({ name, current, curated }) => `  ${name} = current "${current}", curated "${curated}"`),
    );
  }

  lines.push(
    "",
    "Ask for confirmation before calling `install_git_aliases`.",
    "Overwriting an existing alias requires separate confirmation that names the alias and accepts its curated value.",
    "To stop these offers, call `install_git_aliases` with `dismiss: true` and `confirm: true`.",
  );

  return lines.join("\n");
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function fingerprint(value) {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

export function curatedFingerprint() {
  return fingerprint(CURATED_GIT_ALIASES);
}

export function offerFingerprint(state) {
  return fingerprint(state);
}

export function dismissalKey(state) {
  return `gitAliases.dismissed.${curatedFingerprint()}.${offerFingerprint(state)}`;
}

function findCuratedAlias(name) {
  return CURATED_GIT_ALIASES.find((alias) => alias.name === name);
}

function installContent(written, failed, skipped) {
  const lines = [written.length > 0 ? `Installed git aliases: ${written.join(", ")}` : "No aliases installed."];
  if (failed.length > 0) lines.push(`Failed to install: ${failed.join(", ")}`);
  if (skipped.length > 0) lines.push(`Skipped conflicts: ${skipped.join(", ")}`);
  return lines.join("\n");
}

async function executeInstallAliases(ctx, aliases, options, input) {
  const target = input?.target ?? "global";
  if (target !== "global") throw new Error(`Unsupported git config target: ${target}`);
  if (input?.confirm !== true) throw new Error("Explicit confirmation is required");
  if (aliases === undefined) throw new Error("Git aliases could not be read; installs are unavailable");

  const state = classifyAliases(aliases);
  if (input?.dismiss === true) {
    if (typeof ctx.storage?.set === "function") await ctx.storage.set(dismissalKey(state), true);
    return { content: "Git alias install offers dismissed for this alias set." };
  }

  const requested = input.aliases ?? [];
  const overwrites = input.overwrite ?? [];
  if (!Array.isArray(requested) || !Array.isArray(overwrites)) {
    throw new Error("aliases and overwrite must be arrays");
  }

  const conflicts = new Map(state.conflicts.map((conflict) => [conflict.name, conflict]));
  const missing = new Set(state.missing.map((alias) => alias.name));
  const accepted = new Map();
  const skipped = [];

  for (const name of requested) {
    if (typeof name !== "string") throw new Error("Alias names must be strings");
    const curated = findCuratedAlias(name);
    if (!curated) throw new Error(`Unknown curated git alias: ${name}`);
    if (conflicts.has(name)) {
      skipped.push(`${name} (provide a confirmed overwrite to replace it)`);
      continue;
    }
    if (missing.has(name)) accepted.set(name, curated.value);
  }

  for (const entry of overwrites) {
    if (typeof entry?.name !== "string" || typeof entry.value !== "string") {
      throw new Error("Overwrite entries must name an alias and provide a value");
    }
    const curated = findCuratedAlias(entry.name);
    if (!curated) throw new Error(`Unknown curated git alias: ${entry.name}`);
    if (entry.value !== curated.value)
      throw new Error(`Overwrite value for ${entry.name} must match the curated value`);
    if (!conflicts.has(entry.name)) throw new Error(`Git alias ${entry.name} has no conflict to overwrite`);
    if (requested.includes(entry.name)) throw new Error(`Git alias ${entry.name} is both installed and overwritten`);
    accepted.set(entry.name, curated.value);
  }

  const write = options.gitAliases?.writer ?? defaultGitAliasRunner;
  const written = [];
  const failed = [];
  for (const [name, value] of accepted) {
    let result;
    try {
      result = write(["config", "--global", `alias.${name}`, value]);
    } catch (error) {
      failed.push(`${name} (${error.message})`);
      continue;
    }
    if (result?.status === 0) written.push(name);
    else failed.push(`${name} (${result?.stderr ?? `status ${result?.status}`})`);
  }

  return { content: installContent(written, failed, skipped) };
}

async function registerInstallTool(ctx, aliases, options) {
  if (typeof ctx?.tool?.transform !== "function") return;

  try {
    await ctx.tool.transform((editor) => {
      if (editor.get(INSTALL_GIT_ALIASES_TOOL)) return;
      editor.add({
        name: INSTALL_GIT_ALIASES_TOOL,
        description: "Install curated git aliases into global git config after explicit confirmation.",
        input: {
          type: "object",
          properties: {
            confirm: { type: "boolean" },
            aliases: { type: "array", items: { type: "string" } },
            overwrite: {
              type: "array",
              items: {
                type: "object",
                properties: { name: { type: "string" }, value: { type: "string" } },
                required: ["name", "value"],
                additionalProperties: false,
              },
            },
            dismiss: { type: "boolean" },
            target: { type: "string", enum: ["global"] },
          },
          additionalProperties: false,
        },
        execute: (input) => executeInstallAliases(ctx, aliases, options, input),
      });
    });
  } catch (error) {
    warn("install tool registration failed", error);
  }
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

export async function registerSessionInit(ctx, aliases, { offer = true } = {}) {
  const readSucceeded = aliases !== undefined;
  const aliasBlock = readSucceeded ? buildAliasBlock(aliases) : "";
  const state = readSucceeded ? classifyAliases(aliases) : undefined;
  const canOffer = readSucceeded && offer && (state.missing.length > 0 || state.conflicts.length > 0);

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

      const blocks = [aliasBlock];
      if (canOffer) {
        const key = dismissalKey(state);
        const dismissed = typeof ctx.storage?.get === "function" && Boolean(await ctx.storage.get(key));
        if (!dismissed) blocks.push(buildInstallOffer(state));
      }

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

    let aliases;
    if (options.sessionInit !== false) {
      if (typeof ctx?.session?.hook === "function") {
        try {
          aliases = readGitAliases(options.gitAliases?.runner ?? defaultGitAliasRunner);
        } catch (error) {
          warn("failed to load git aliases", error);
        }

        try {
          await registerSessionInit(ctx, aliases, { offer: options.gitAliases?.offer !== false });
        } catch (error) {
          warn("session bootstrap registration failed", error);
        }
      }

      await registerInstallTool(ctx, aliases, options);
    }
  },
};
