// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

export function stripAnsi(text: string): string {
  // ANSI escapes are control characters by definition.
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function detectSkills(output: string): string[] {
  return [...stripAnsi(output).matchAll(/→ Skill "([^"]+)"/g)].map((match) => match[1]);
}

export function detectReads(output: string): string[] {
  return [...stripAnsi(output).matchAll(/→ Read (.+)/g)].map((match) => match[1].trim());
}

// Tool invocations render with a marker prefix ($, →, ⚙, ✱, ←, ✓, ✗); the
// agent's prose does not. forbids scans these lines so a rule quoted in a
// refusal does not read as an invocation.
export function detectCommands(output: string): string[] {
  return stripAnsi(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[$→⚙✱←✓✗]/.test(line));
}

export function combineOutput(stdout: string | undefined, stderr: string | undefined): string {
  return `${stdout ?? ""}${stderr ?? ""}`;
}

export function transcript(output: string): string {
  const clean = stripAnsi(output);
  return clean.length > 2000 ? `…${clean.slice(-2000)}` : clean;
}

export function harnessError(output: string): string | undefined {
  return /Policy budget exceeded|rate limit(?: exceeded)?|free usage limit reached|insufficient (?:credits|quota)/i.exec(
    stripAnsi(output),
  )?.[0];
}
