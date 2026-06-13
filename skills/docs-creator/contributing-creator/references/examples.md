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

See the `gradle` skill for lifecycle task details. Common commands:

````markdown
## Setup

```bash
./gradlew
```

## Build, Test, and Lint

```bash
./gradlew testClasses
./gradlew check --console plain
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
