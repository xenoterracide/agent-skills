<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Hemingway: Code

Write code the way Hemingway wrote prose. Short. Concrete. Every line earns its
place.

## The rules

1. **Short methods.** One job per method. Split anything that does two things.
2. **Concrete names.** Name things for what they are. `findById`, not
   `process`. `User`, not `Data`.
3. **Imperative names.** Methods do things. `pay()`, not `paymentIsProcessed()`.
4. **Name the role, not the relationship.** `UserFactory` names a role — keep
   it. `UserServiceImpl` names a relationship — name it for what it is. Drop
   `Abstract`/`Base` when they restate the type system. Keep a modifier only
   when the clean name is taken: two `Parser` classes means one keeps a
   qualifier.
5. **No boilerplate.** Don't write what the language or library already gives
   you.
6. **YAGNI.** Delete dead code. Cut lines that don't earn their place.
7. **Concrete types.** Prefer concrete types over `Object` or
   `Map<String, Object>`.

## Why

Terse code is easier to read, test, and change. Every line you don't write is a
line you don't maintain.
