---
name: iterative-development
description: |
  Apply iterative development principles combining Craig Larman's RUP process
  and Eric Evans' whirlpool design. Use when starting new features, refining
  existing code, or when the domain model needs to evolve. Guides short
  timeboxed iterations, risk-driven development, and continuous refactoring
  toward deeper insight.
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Iterative Development

Guidance for iterative development combining Craig Larman's RUP approach with
Eric Evans' whirlpool design from Domain-Driven Design.

## Core Principles

### 1. Short Timeboxed Iterations

Work in iterations of 2-6 weeks maximum. Each iteration must produce:

- **Executable, tested code** - Not just design documents
- **Vertical slices** - Working features end-to-end
- **Demonstrable progress** - Can be shown to stakeholders

> "The code is the design." - The best way to validate architecture is working
> software.

### 2. Risk-Driven Development

Address highest-risk items early:

- **Technical risks** - Unknown technologies, integrations, performance
- **Domain complexity** - Core domain concepts that are poorly understood
- **Requirements uncertainty** - Areas where business needs are unclear

Each iteration should reduce overall project risk.

### 3. Start Simple, Refine Through Whirlpool

Follow Eric Evans' whirlpool model - start with a simple model and refine it
through iterations:

```
        Deeper
        Insight
           ↑
   ┌───────┴───────┐
   │   Refactor    │
   │   Toward      │
   │   Deeper      │
   │   Insight     │
   └───────┬───────┘
           ↓
   ┌───────┴───────┐
   │ Distill       │
   │ Ubiquitous    │
   │ Language      │
   └───────┬───────┘
           ↓
   ┌───────┴───────┐
   │ Challenge     │
   │ Assumptions   │
   └───────┬───────┘
           ↓
   ┌───────┴───────┐
   │ Initial       │
   │ Model         │
   └───────────────┘
```

### 4. Refactoring Toward Deeper Insight

As understanding grows, refactor the model:

- **Ubiquitous language** evolves with the model
- **Bounded contexts** emerge and clarify
- **Aggregates** are refined as invariants are understood
- **Domain events** are discovered through scenario analysis

### 5. Requirements Emerge Through Feedback

Requirements are not fully knowable upfront:

- **Prototypes inform requirements** - Build to learn
- **User feedback drives priorities** - Adapt based on what works
- **Deferred commitment** - Make reversible decisions early

## Iteration Structure

### Start of Iteration

1. **Select goals** based on:
   - Risk reduction
   - Business value
   - Learning opportunities

2. **Plan minimally**:
   - What scenarios will work?
   - What experiments need to run?
   - What's the "walking skeleton"?

### During Iteration

1. **Build working software**:
   - Test-driven development
   - Vertical slices
   - Continuous integration

2. **Refactor continuously**:
   - Rename as language evolves
   - Extract concepts as they emerge
   - Simplify as understanding grows

3. **Capture learning**:
   - Update ubiquitous language
   - Document new domain insights
   - Note emerging bounded contexts

### End of Iteration

1. **Demonstrate working software**
2. **Gather feedback** from stakeholders
3. **Reflect on what was learned**:
   - What did we get wrong?
   - What simplified?
   - What became more complex?
4. **Adjust priorities** for next iteration

## Anti-Patterns

### Big Design Up Front

❌ Trying to design the complete domain model before writing code.

> The model will be wrong. Start simple and let it evolve.

### Analysis Paralysis

❌ Endless modeling sessions without working code.

> Model in code, not on whiteboards. Working software reveals flaws that
> diagrams hide.

### Premature Abstraction

❌ Extracting frameworks or abstractions before the pattern is proven.

> Wait for three instances before generalizing. Let the design emerge.

### Ignoring the Whirlpool

❌ Sticking with the initial model when deeper insight is available.

> Be willing to refactor aggressively as understanding grows.

## Practical Guidance

### When Starting a Feature

1. **What's the simplest thing that could work?**
2. **What risks need to be addressed?**
3. **What can we learn by building?**

### When the Model Feels Wrong

1. **Listen to the code** - Complexity smells indicate model problems
2. **Check the language** - Are terms being used consistently?
3. **Look for hidden concepts** - Is there a missing aggregate or value object?
4. **Consider splitting** - Should this be multiple bounded contexts?

### When to Refactor Aggressively

- Ubiquitous language has diverged from the code
- New business scenarios don't fit the current model
- Transaction boundaries feel forced
- Invariants are becoming complex

## Integration with Other Skills

- **use-case-creator** - Use cases evolve; update them as understanding grows
- **testing** - Tests capture and protect domain understanding
- **domain-driven-design** (if available) - Deep model refinement
- **general-programming** - Refactoring skills support iteration

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
