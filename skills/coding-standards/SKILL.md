---
name: coding-standards
description: |
  Use when writing or modifying code in any language, including scripts,
  tests, and build files. When a domain skill applies, such as `java-creator`
  or `gradle-creator`, load that skill first; this skill still applies
  alongside it.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Coding Standards

These standards apply to all programming tasks regardless of language or framework.

## Required Companion Skills

Load these skills whenever this skill applies:

- **`hemingway`** — for terse, concrete code style

## Rule 1: SOLID Design and Polymorphic Behavior

Design code that follows SOLID principles with a focus on polymorphic behavior:

### Single Responsibility

- Each unit (class, function, module) has one reason to change
- Let your domain language define responsibilities
- Build units around single responsibilities derived from the domain

### Open/Closed Principle

- Open for extension, closed for modification
- Use polymorphism to add behavior without changing existing code

### Liskov Substitution

- Subtypes must be substitutable for their base types
- Polymorphic behavior should be predictable

### Interface Segregation

- Prefer small, focused interfaces over large, general ones
- Clients shouldn't depend on methods they don't use

### Dependency Inversion

- Depend on abstractions, not concrete implementations
- This enables the polymorphic behavior that makes systems flexible

### Polymorphic Behavior is Key

**Encapsulate behavior so it's polymorphic** - let the unit decide how to act rather than orchestrating externally.

**Polymorphism takes many forms:**

- Traditional inheritance and interfaces
- Lambdas and functional programming (passing behavior as data)
- Strategy patterns and dependency injection

```java
// BAD - external orchestration with conditionals
public void processPayment(PaymentType type, Amount amount) {
  if (type == PaymentType.CREDIT_CARD) {
    processCreditCard(amount);
  } else if (type == PaymentType.PAYPAL) {
    processPayPal(amount);
  } else if (type == PaymentType.BANK_TRANSFER) {
    processBankTransfer(amount);
  }
}
```

```java
// GOOD - polymorphic behavior, each type decides how to act
public interface PaymentMethod {
  void pay(Amount amount);
}

public class CreditCardPayment implements PaymentMethod {

  @Override
  public void pay(Amount amount) {
    // Credit card specific implementation
  }
}

// Usage - no conditionals, behavior is encapsulated
public void processPayment(PaymentMethod method, Amount amount) {
  method.pay(amount); // Polymorphic dispatch
}
```

If you follow these principles, your code will naturally be composable, clear, and aligned with the domain.

## Rule 2: Prefer Immutability

Prefer immutable objects and data structures where immutability doesn't reduce comprehension.

**Benefits:**

- Thread safety without synchronization
- Predictable behavior - no surprise state changes
- Easier to reason about code
- Fewer defensive copies needed

**Examples:**

```java
// GOOD - immutable record
public record Person(String name, int age) {}

// GOOD - immutable collections
var items = List.of("a", "b", "c"); // Cannot be modified

// GOOD - builder pattern for complex immutables
var config = Config.builder().timeout(Duration.ofSeconds(30)).retries(3).build();
```

**Avoid setters** - Instead of anemic data objects with getters/setters, prefer domain-driven design with rich behavior:

```java
// BAD - anemic object with setter
person.setStatus("APPROVED");

// GOOD - tell, don't ask
person.approve();
```

**When mutability is acceptable:**

- Performance-critical code where immutability causes measurable overhead
- Accumulators/builders during object construction
- Cases where it significantly reduces comprehension

## Rule 3: Never Ignore Errors

Errors must never be silently ignored. Handle each explicitly:

1. **Recover** - Handle it and continue, when recovery is possible
2. **Rethrow** - Let the error propagate up the call stack if it cannot be handled at the current level
3. **Logging** - Log the error with sufficient context before continuing or aborting

### Anti-patterns (Never Do This)

**Empty catch blocks:**

```java
// BAD - exception is silently lost
try {
  riskyOperation();
} catch (Exception e) {
  // ignored
}
```

### Correct Approaches

**Rethrow when you cannot handle it:**

```java
// GOOD - rethrow to let caller handle
try {
  riskyOperation();
} catch (IOException e) {
  throw new ApplicationException("Failed to process file", e);
}
```

**Log when you need to continue:**

```java
// GOOD - log with context before continuing
try {
  optionalCleanup();
} catch (Exception e) {
  log.warn("Cleanup failed for resource {}, continuing anyway", resourceId, e);
}
```

### Error Handling Decision Tree

1. **Can you recover from this error?**
   - Yes → Handle it and continue
   - No → Go to step 2

2. **Should the caller know about this error?**
   - Yes → Rethrow (possibly wrapped with more context)
   - No → Go to step 3

3. **Is this an optional/non-critical operation?**
   - Yes → Log at appropriate level and continue
   - No → Log and terminate/rethrow

## Rule 4: Use Existing Libraries and Frameworks

Check for an existing library, dependency, or framework before writing new code. Prefer existing code over your own, even for trivial functions.

This covers tools and infrastructure, not just code. Do not write your own test runner, CLI parser, config loader, or formatter when a maintained one exists. Use the library.

## Rule 5: Code Quality Standards

### Testing

Before considering any task complete, run the relevant tests. See the `testing`
skill for test philosophy, patterns, and anti-patterns.

### Coverage Requirements

- **Maintain high test coverage** (90%+ target)
- Trivial code (getters/setters) should be exercised by other tests
- If trivial code isn't covered, question whether it's needed
- Coverage is a signal, not the goal - focus on meaningful tests

### Static Analysis

Tools like Checkstyle, SpotBugs, Error Prone, and others exist to catch issues early.

**The Rule:**

| Issue Found               | Action                                        |
| ------------------------- | --------------------------------------------- |
| Violation reported        | **Fix it** - don't suppress blindly           |
| Fix would make code worse | Suppress **at the source** with justification |

### Suppression Philosophy

Suppress static analysis warnings **only when:**

1. **The "fix" would make the code less clear or more complex**
2. **You understand why the warning is a false positive in this context**
3. **There's no cleaner alternative**

**Suppress at the closest point to the issue:**

```java
// GOOD - suppression is right at the source, with explanation
@SuppressWarnings("NullAway") // Factory method ensures non-null via validation
public static User create(String email) {
  // ... validation logic ...
  return new User(email); // NullAway can't see validation
}
```

```java
// BAD - global suppression or far from source
// In some distant config file:
// checkstyle.ignore = ["MethodLength"]
```

### Self-Review Before Submitting

Self-review the diff before creating or updating a PR — see the
`git-workflow` pull-request reference for the steps.

**Don't waste reviewer time on issues you could have caught yourself.**

## Rule 6: Let the Pre-Commit Hook Format and Annotate

When the repository's pre-commit hook runs lint-staged (see
`.lintstagedrc.cjs`), a request for formatting or license headers is a
request to commit: stage the file and commit. lint-staged runs
`prettier --write`, `shfmt`, and `reuse annotate` on staged files and
restages them. Report that the commit did it.

Never do the hook's job by hand:

- Never write a license or copyright header into file content. Not to "make
  sure it's there", not because neighboring files carry headers, not to
  match the repo's style. `reuse annotate` stamps headers on commit; a
  hand-written one guesses the license the config already knows.
- Never run `prettier`, `shfmt`, or `reuse` — not `--write`, not `--check`,
  not `lint`, not to verify. The hook's run at commit is the verification;
  CI checks the tree again.
- Never commit with `--no-verify`; it skips the hook.

Run what the hook cannot fix — typecheck, tests, and lint rules without an
autofix — through the repository's gate: one script, any name, whose body
chains whatever that repo needs (`prettier --check && ./mvnw verify`,
`./gradlew check`). One round trip covers it; run a leg alone only when
diagnosing a gate failure. CI may split the same checks into separate jobs —
its packaging choice, not the agent's.

File types with no lint-staged glob still need headers by hand. Check the
globs in `.lintstagedrc.cjs` before writing one.

A commit that leaves a file unformatted or headerless means the hook did not
run: missing, bypassed, or not installed. Report that. Do not hand-fix the
file to work around a broken hook.
