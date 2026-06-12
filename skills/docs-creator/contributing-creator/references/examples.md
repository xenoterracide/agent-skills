<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# CONTRIBUTING.md Examples by Ecosystem

Use these as starting points for the `Build, Test, and Lint` section.

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

````markdown
## Setup

```bash
./gradlew
```

## Build, Test, and Lint

```bash
./gradlew build
./gradlew test
./gradlew check
```
````

## Maven / Java

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
