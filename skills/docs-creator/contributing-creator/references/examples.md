<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# CONTRIBUTING.md Examples by Ecosystem

Use these as starting points for the `Build, Test, and Lint` section.

Different tools combine compile, test, and verification differently. Use the
commands that match the project's tooling.

## Yarn / Node

````markdown
## Setup

```bash
yarn install
```

## Build, Test, and Lint

```bash
yarn build
yarn test
yarn lint
```
````

## Gradle / Kotlin or Java

Gradle lifecycle tasks do different amounts of work:

- `./gradlew testClasses` — compiles main and test code (cheap)
- `./gradlew assemble` — builds artifacts without running tests
- `./gradlew build` — compiles, tests, and packages everything
- `./gradlew check` — runs tests and verification without producing artifacts

````markdown
## Setup

```bash
./gradlew
```

## Build, Test, and Lint

```bash
./gradlew testClasses
./gradlew check
```
````

## Maven / Java

`mvn compile` compiles. `mvn test` compiles and runs unit tests. `mvn verify`
runs the full verification lifecycle including integration tests.

````markdown
## Setup

```bash
mvn verify -DskipTests
```

## Build, Test, and Lint

```bash
mvn compile
mvn test
mvn verify
```
````

## Python / uv

````markdown
## Setup

```bash
uv sync --frozen
```

## Build, Test, and Lint

```bash
uv run pytest
uv run ruff check .
```
````
