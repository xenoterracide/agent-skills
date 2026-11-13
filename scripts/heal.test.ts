// SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { rmSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { HOOKS_PATH, makeFixture, readLog, runHeal } from "./heal-helpers";
import type { Fixture, FixtureSetup } from "./heal-helpers";

const withFixture = (setup: FixtureSetup, body: (fixture: Fixture) => void): void => {
  const fixture = makeFixture(setup);
  try {
    body(fixture);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
};

const skipsToolsWithoutMarkers = (): void => {
  withFixture({}, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "git")).toBe(HOOKS_PATH);
    for (const tool of ["asdf", "pnpm", "uv", "npm", "corepack"]) {
      expect(readLog(fixture, tool), `${tool} must not run`).toBeUndefined();
    }
  });
};

const installsToolVersions = (): void => {
  withFixture({ markers: [".tool-versions"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "asdf")).toBe("install");
  });
};

const enablesCorepackWithoutNpm = (): void => {
  withFixture({ markers: ["package.json"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "corepack")).toMatch(/enable --install-directory/);
    expect(readLog(fixture, "npm")).toBeUndefined();
  });
};

const installsCorepackThroughNpm = (): void => {
  withFixture(
    { tools: ["asdf", "pnpm", "uv", "npm", "git"], markers: ["package.json", ".tool-versions"] },
    (fixture) => {
      const result = runHeal(fixture);
      expect(result.status).toBe(0);
      expect(readLog(fixture, "npm")).toBe("install --global corepack");
      expect(readLog(fixture, "asdf")).toMatch(/reshim nodejs/);
    },
  );
};

const installsPnpmFrozen = (): void => {
  withFixture({ markers: ["package.json", "pnpm-lock.yaml"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "pnpm")).toBe("install --frozen-lockfile --reporter=silent");
    expect(readLog(fixture, "uv")).toBeUndefined();
  });
};

const installsPnpmUnfrozen = (): void => {
  withFixture({ markers: ["package.json"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "pnpm")).toBe("install --reporter=silent");
  });
};

const skipsPnpmWithoutPackageJson = (): void => {
  withFixture({ markers: ["pnpm-lock.yaml"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "pnpm")).toBeUndefined();
  });
};

const syncsUvFrozen = (): void => {
  withFixture({ markers: ["pyproject.toml", "uv.lock"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "uv")).toBe("sync --frozen --quiet");
    expect(readLog(fixture, "pnpm")).toBeUndefined();
  });
};

const syncsUvUnfrozen = (): void => {
  withFixture({ markers: ["pyproject.toml"] }, (fixture) => {
    const result = runHeal(fixture);
    expect(result.status).toBe(0);
    expect(readLog(fixture, "uv")).toBe("sync --quiet");
  });
};

describe("marker gating", () => {
  it("no markers: only the hooksPath config runs", skipsToolsWithoutMarkers);
  it("asdf install runs when .tool-versions exists", installsToolVersions);
  it("corepack present: enable runs, npm never called", enablesCorepackWithoutNpm);
  it("corepack absent: npm installs it and asdf reshims", installsCorepackThroughNpm);
  it("pnpm install gated by package.json, frozen by the lockfile", installsPnpmFrozen);
  it("package.json without a lockfile installs unfrozen", installsPnpmUnfrozen);
  it("a lockfile without package.json does not install", skipsPnpmWithoutPackageJson);
  it("uv sync gated by pyproject.toml, frozen by uv.lock", syncsUvFrozen);
  it("pyproject.toml without uv.lock syncs unfrozen", syncsUvUnfrozen);
});

const warnsWhenAsdfMissing = (): void => {
  withFixture(
    { tools: ["pnpm", "uv", "npm", "corepack", "git"], markers: [".tool-versions", "package.json", "pnpm-lock.yaml"] },
    (fixture) => {
      const result = runHeal(fixture);
      expect(result.status).toBe(0);
      expect(result.stderr.toString()).toMatch(/asdf/);
      expect(readLog(fixture, "pnpm")).toBe("install --frozen-lockfile --reporter=silent");
    },
  );
};

const healsPastAFailedStep = (): void => {
  withFixture(
    { failing: { pnpm: "1" }, markers: ["package.json", "pnpm-lock.yaml", "pyproject.toml", "uv.lock"] },
    (fixture) => {
      const result = runHeal(fixture);
      expect(result.status).toBe(0);
      expect(result.stderr.toString()).toMatch(/pnpm/);
      expect(readLog(fixture, "uv")).toBe("sync --frozen --quiet");
      expect(readLog(fixture, "git")).toBe(HOOKS_PATH);
    },
  );
};

describe("failure tolerance", () => {
  it("a missing asdf warns and the rest still heals", warnsWhenAsdfMissing);
  it("a failed step does not stop the rest", healsPastAFailedStep);
});
