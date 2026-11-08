// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCRIPT = join(import.meta.dirname, "..", "skills", "output-hygiene", "scripts", "gh-pr-wait.sh");

// The stub emulates what gh-with---jq emits: one queue entry per invocation,
// "exit|stdout". A successful render always prints the line — failed names,
// pending names, and the row count, tab separated — so "-" (no stdout) is a
// gh error. Missing lines repeat the last. The stub always writes "fake gh
// stderr" to stderr and appends its argv to $GHW_STATE/argv. Exit codes are
// recorded but carry no meaning in JSON mode.
const fakeGh = [
  "#!/bin/sh",
  'n=$(cat "$GHW_STATE/seq" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" >"$GHW_STATE/seq"',
  'entry=$(sed -n "${n}p" "$GHW_STATE/queue"); [ -n "$entry" ] || entry=$(tail -n 1 "$GHW_STATE/queue")',
  'echo "$@" >>"$GHW_STATE/argv"; echo "fake gh stderr" >&2',
  "code=${entry%%|*}; out=${entry#*|}",
  '[ "$out" != "-" ] && printf \'%s\n\' "$out"',
  'exit "$code"',
];

interface Stub {
  state: string;
  bin: string;
}

interface Run {
  status: number | null;
  stdout: string;
  stderr: string;
}

const makeStub = (queue: string[]): Stub => {
  const state = mkdtempSync(join(tmpdir(), "ghw-"));
  writeFileSync(join(state, "queue"), `${queue.join("\n")}\n`);
  const bin = join(state, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), `${fakeGh.join("\n")}\n`, { mode: 0o755 });
  return { state, bin };
};

const runScript = (stub: Stub, args: string[]): Run => {
  const result: SpawnSyncReturns<Buffer> = spawnSync(SCRIPT, args, {
    env: { ...process.env, PATH: `${stub.bin}:${process.env.PATH ?? ""}`, GHW_STATE: stub.state },
  });
  return {
    status: result.status,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  };
};

const callCount = (stub: Stub): number => Number(readFileSync(join(stub.state, "seq"), "utf8").trim());

const recordedArgv = (stub: Stub): string[] => readFileSync(join(stub.state, "argv"), "utf8").trimEnd().split("\n");

const withStub = <T>(queue: string[], args: string[], fn: (run: Run, stub: Stub) => T): T => {
  const stub = makeStub(queue);
  try {
    return fn(runScript(stub, args), stub);
  } finally {
    rmSync(stub.state, { recursive: true, force: true });
  }
};

describe("gh-pr-wait.sh", () => {
  it("passes after pending resolves", () => {
    withStub(["8|\tbuild\t1", "0|\t\t2"], ["--interval", "0"], ({ status, stdout }, stub) => {
      expect(status).toBe(0);
      expect(stdout).toBe("pass\n");
      expect(callCount(stub)).toBe(2);
    });
  });

  it("fails fast while other checks are pending", () => {
    withStub(["8|build\t\t1"], ["--interval", "0"], ({ status, stdout }, stub) => {
      expect(status).toBe(1);
      expect(stdout).toBe("fail: build\n");
      expect(callCount(stub)).toBe(1);
    });
  });

  it("counts cancelled checks as failures", () => {
    withStub(["8|canceled\t\t1"], ["--interval", "0"], ({ status, stdout }, stub) => {
      expect(status).toBe(1);
      expect(stdout).toBe("fail: canceled\n");
      expect(callCount(stub)).toBe(1);
    });
  });

  it("forwards gh errors to stderr", () => {
    withStub(["1|-"], ["--interval", "0"], ({ status, stderr }) => {
      expect(status).toBe(1);
      expect(stderr).toMatch(/fake gh stderr/);
    });
  });

  it("exits 2 with pending names on timeout", () => {
    withStub(["8|\tbuild\t1"], ["--interval", "0", "--timeout", "1"], ({ status, stdout }) => {
      expect(status).toBe(2);
      expect(stdout).toBe("pending after 0m: build\n");
    });
  });

  it("runs with no positional args and never forwards its own flags", () => {
    withStub(["0|\t\t2"], ["--interval", "0"], ({ status, stdout }, stub) => {
      expect(status).toBe(0);
      expect(stdout).toBe("pass\n");
      const line = recordedArgv(stub).at(-1) ?? "";
      expect(line.startsWith("pr checks --json name,bucket")).toBe(true);
      expect(line.includes("--interval")).toBe(false);
      expect(line.includes("--timeout")).toBe(false);
    });
  });

  it("derives failure from the rendered line, not gh's exit code", () => {
    withStub(["0|build\t\t1"], ["--interval", "0"], ({ status, stdout }, stub) => {
      expect(status).toBe(1);
      expect(stdout).toBe("fail: build\n");
      expect(callCount(stub)).toBe(1);
    });
  });

  it("separates multiple names with comma-space", () => {
    withStub(["0|build,lint\t\t2"], ["--interval", "0"], ({ status, stdout }) => {
      expect(status).toBe(1);
      expect(stdout).toBe("fail: build, lint\n");
    });
  });

  it("exits 64 with usage on a non-numeric interval", () => {
    withStub(["0|\t\t2"], ["--interval", "abc"], ({ status, stderr }) => {
      expect(status).toBe(64);
      expect(stderr).toMatch(/^usage:/);
    });
  });

  it("exits 64 with usage on a missing timeout value", () => {
    withStub(["0|\t\t2"], ["--timeout"], ({ status, stderr }) => {
      expect(status).toBe(64);
      expect(stderr).toMatch(/^usage:/);
    });
  });

  it("treats a runless head as pending, not pass", () => {
    withStub(["0|\t\t0"], ["--interval", "0", "--timeout", "1"], ({ status, stdout }) => {
      expect(status).toBe(2);
      expect(stdout).toBe("pending after 0m: no check runs yet\n");
    });
  });

  it("passes once checks appear on a runless head", () => {
    withStub(["0|\t\t0", "0|\t\t2"], ["--interval", "0"], ({ status, stdout }, stub) => {
      expect(status).toBe(0);
      expect(stdout).toBe("pass\n");
      expect(callCount(stub)).toBe(2);
    });
  });

  it("defaults the timeout to 600 seconds", () => {
    expect(readFileSync(SCRIPT, "utf8")).toMatch(/timeout=600\b/);
  });
});
