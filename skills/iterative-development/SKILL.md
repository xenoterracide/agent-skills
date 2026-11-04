---
name: iterative-development
description: |
  Use when starting new features, scoping or refining designs, or when the
  domain model needs to evolve — the model feels wrong or too complex, a
  concept seems missing, or the language no longer fits the code.
license: CC-BY-NC-SA-4.0
metadata:
  copyright: Caleb Cushing
---

<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Iterative Development

Guidance for iterative development combining Craig Larman's RUP approach with
Eric Evans' whirlpool design from Domain-Driven Design.

## Core Principles

1. **Timebox iterations.** 2-6 weeks maximum. Each iteration ships
   executable, tested code — a vertical slice, demonstrable to stakeholders.
   The code is the design; working software validates architecture better
   than diagrams.
2. **Drive by risk.** Address the highest-risk items first — unknown
   technology, poorly understood domain concepts, unclear requirements. Each
   iteration should reduce overall project risk.
3. **Start simple, refine through the whirlpool.** Begin with a simple model.
   Each iteration: challenge assumptions, distill the ubiquitous language,
   refactor toward deeper insight. Ubiquitous language, bounded contexts,
   aggregates, and domain events evolve as understanding grows.
4. **Let requirements emerge.** Requirements are not fully knowable upfront.
   Build to learn, adapt to feedback, make reversible decisions early.

## Iteration Rhythm

- **Start:** select goals by risk, value, and learning. Identify the walking
  skeleton — the thinnest end-to-end slice. If it cannot be demonstrated, it
  is too big.
- **During:** build working software test-first. Refactor continuously —
  rename as language evolves, extract concepts as they emerge. Capture new
  domain language.
- **End:** demonstrate working software. Gather feedback. Reflect — what was
  wrong, what simplified, what grew complex. Adjust priorities.

## Anti-Patterns

- **Big design up front** — designing the complete domain model before code.
  The model will be wrong; let it evolve.
- **Analysis paralysis** — endless modeling without working code. Model in
  code; working software reveals flaws that diagrams hide.
- **Premature abstraction** — extracting frameworks before the pattern is
  proven. Wait for three instances.
- **Ignoring the whirlpool** — keeping the initial model when deeper insight
  is available. Refactor aggressively as understanding grows.

## AI Role: Facilitator, Not the Coder

Guide the user through analysis before code. Ask questions. Challenge
assumptions. Do not jump to implementation.

### Establish Context

New feature: What problem are we solving? Who are the actors? What is the
simplest scenario that shows value? What are the biggest unknowns?

Extending existing code: What behavior is new? Does it fit the current model
or stretch it? New language, or existing terms?

### Define the First Iteration

Agree on the walking skeleton, the risks that drive the iteration, the goal,
and what is explicitly out of scope. Document it: "This iteration will
`[goal]`, demonstrating `[scenario]`, while deferring `[out-of-scope items]`."

### Check the Language

Before coding: What is this concept called? Are terms consistent with the
codebase? Should existing concepts be renamed? If the language is unclear,
the model is unclear — do not proceed.

### Transition to Code

Code when the walking skeleton is agreed, the language is documented, the
out-of-scope list is explicit, and the user says to build. Start with the
first test or scenario.

### Whirlpool Moments

Watch for signals the model needs refinement:

- User: "this feels complicated" → is a concept missing? "we also need…" →
  is this in scope? "that's not quite right" → stop; what did we get wrong
  about the domain?
- Code: complex conditionals → missing aggregate or value object; many null
  checks → missing concept; comments explaining business rules → make it
  explicit in the model.
- Model: language diverged from code, new scenarios strain the model,
  transaction boundaries feel forced, invariants grow complex — refactor
  aggressively.

### Jumping to Code

❌ User: "I need to handle order fulfillment" → AI writes the
OrderFulfillmentService.

✅ Same request → AI asks: what is the simplest fulfillment scenario? Who
are the actors? What does "fulfilled" mean in this domain?

## Integration

- **use-case-creator** — use cases evolve; update them as understanding grows
- **testing** — tests capture and protect domain understanding
- **coding-standards** — refactoring supports iteration
