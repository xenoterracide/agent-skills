---
name: gradle-creator
description: |
  Use when creating, modifying, or troubleshooting Gradle builds, build scripts,
  or Gradle project configuration. Invoke for tasks involving
  `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, dependency
  versions, lockfiles, plugins, wrapper, build tasks, dependency resolution,
  publishing, shadow JARs, or build failures in a Gradle project.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Gradle Skill

Guidance for working with Gradle build system.

## Required Companion Skills

Load these skills whenever this skill applies:

- **`coding-standards`** — before writing or modifying code
- **`completion-checklist`** — before claiming the change is done, complete,
  fixed, passing, or working

## Dependency Management

### Checking for Lockfiles

Look for these files to determine if dependency locking is enabled:

- `gradle.lockfile` (project dependencies)
- `buildscript-gradle.lockfile` (buildscript classpath)
- `*/gradle.lockfile` (module-specific)
- `*/buildscript-gradle.lockfile` (module-specific buildscript)

### Updating Dependencies

If dependency locking is enabled, update lockfiles after changing dependencies:

```bash
./gradlew dependencies --write-locks
```

To force refresh before updating:

```bash
./gradlew dependencies --refresh-dependencies --write-locks
```

### Analyzing Dependencies

When investigating dependency issues:

1. **Check lockfile diffs** - Review git changes to `*.lockfile` files
2. **Look for configuration changes** - Dependency updates may add/remove
   configurations
3. **Verify consistency** - Ensure all lockfiles are updated together

### Viewing Dependency Trees

```bash
./gradlew dependencies
./gradlew dependencies --configuration runtimeClasspath
```

## Common Build Tasks

Gradle lifecycle tasks do different amounts of work. Choose the cheapest task
that satisfies the goal:

| Task          | What it does                                            |
| ------------- | ------------------------------------------------------- |
| `testClasses` | Compiles main and test code                             |
| `assemble`    | Builds artifacts without running tests                  |
| `build`       | Compiles, tests, and packages everything                |
| `check`       | Runs tests and verification without producing artifacts |
| `test`        | Runs unit tests                                         |
| `clean`       | Deletes build outputs                                   |

```bash
./gradlew testClasses    # Cheap compile check
./gradlew assemble       # Build artifacts without tests
./gradlew build          # Full build and test
./gradlew check          # Verification only
./gradlew test           # Unit tests only
./gradlew clean          # Clean build outputs
```

### Machine-Readable Output

Use `--console plain` when parsing Gradle output programmatically or when
rich terminal output interferes with tool processing:

```bash
./gradlew check --console plain
```

## Shadow

Read `references/shadow.md` for fat-JAR configuration: the `minimize()` NPE
and its fix, include and exclude filters, relocation patterns, plugin
publishing, and locking interaction.
