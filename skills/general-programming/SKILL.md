---
name: general-programming
description: General programming principles and best practices that apply across all languages and tasks. This skill is always consumed first. Use for all coding tasks to ensure consistent quality and robustness.
# SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
#
# SPDX-License-Identifier: CC-BY-NC-SA-4.0
---

# General Programming Principles

These principles apply to all programming tasks regardless of language or framework.

## Rule 1: Never Ignore Errors

**This is the most important rule.** Errors must never be silently ignored. Always handle errors explicitly by either:

1. **Rethrowing** - Let the error propagate up the call stack if it cannot be handled at the current level
2. **Logging** - Log the error with sufficient context before continuing or aborting

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

## Rule 2: Always Run Tests

Before considering any task complete, run the relevant tests. Tests provide confidence that changes work correctly and don't break existing functionality.

### Testing Philosophy: Prefer Sociable and Integration Tests

We follow the **testing trophy** approach, which values sociable and integration tests over solitary unit tests with mocks.

**Key Concepts (from Martin Fowler)**

- **Sociable Tests**: Tests that use real collaborating objects. Coined by Jay Fields, these tests let the unit under test interact with real dependencies, assuming they work correctly (and usually they have their own tests). See: https://martinfowler.com/bliki/UnitTest.html
- **Solitary Tests**: Tests where all collaborators are replaced with mocks/stubs. We avoid this style unless necessary.
- **Integration Tests**: Tests that verify independently developed units work correctly when connected. Prefer "narrow" integration tests that test one integration point at a time. See: https://martinfowler.com/bliki/IntegrationTest.html

**Sociable/Integration Tests (preferred)**
- Tests that use real collaborating objects, not mocks
- Prefer calling through public APIs rather than testing internals
- Exercise the code paths users will actually trigger
- Tests the actual behavior of the system as it will run in production
- Narrow integration tests test one integration point at a time with test doubles for external services

**When to Use Test Doubles (exceptions)**
- External services you don't control (use stubs/fakes, not mocks)
- Non-deterministic behavior (random, time, etc.)
- Extremely slow operations that would make tests impractical
- Infrastructure you can't easily run locally

**Note on "Mock" MVC**: MockMvc is not a mock in the Mockito sense - it's more of a stub or fake that stands in for the HTTP layer while still exercising real controllers.

**Further Reading:**
- Martin Fowler on test shapes and terminology: https://martinfowler.com/articles/2021-test-shapes.html
- Practical Test Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html

### Anti-patterns

**Over-mocked unit tests:**
```java
// BAD - testing mocks, not real behavior
@Test
void processOrder() {
    var mockRepo = mock(OrderRepo.class);
    var mockNotifier = mock(Notifier.class);
    var service = new OrderService(mockRepo, mockNotifier);
    
    when(mockRepo.find(any())).thenReturn(fakeOrder);
    
    service.process(orderId);
    
    verify(mockNotifier).send(any());  // Did we call a mock? Who knows if it works for real
}
```

**Testing implementation details or internal state:**
```java
// BAD - testing internal state, not observable behavior
@Test
void parserSetsStateCorrectly() {
    var parser = new Parser();
    parser.parse("input");
    assertThat(parser.getTokenCount()).isEqualTo(3);  // Internal detail that may change
}
```

**Testing trivial code:**
```java
// BAD - don't test getters/setters or trivial code
@Test
void getterReturnsValue() {
    var person = new Person("Alice");
    assertThat(person.getName()).isEqualTo("Alice");  // No logic to test
}
```

### Correct Approaches

**Sociable test with real collaborators:**
```java
// GOOD - tests real behavior with real objects
@Test
void processOrderSendsNotification() {
    var database = new TestDatabase();
    var emailClient = new FakeEmailClient();  // Fake, not mock - has real behavior
    var service = new OrderService(database, emailClient);
    
    service.process(orderId);
    
    assertTrue(emailClient.wasNotified(customerEmail));  // Verify real outcome
}
```

**Integration test through public API:**
```java
// GOOD - test the actual workflow users experience
@Test
void checkoutFlow() {
    var app = new Application(testConfig);
    
    var result = app.checkout(CreateOrderRequest.builder()
        .item("book")
        .quantity(2)
        .build());
    
    assertThat(result.status()).isEqualTo(OrderStatus.CONFIRMED);
    assertThat(result.confirmationNumber()).isNotNull();
}
```

## Rule 3: SOLID Design and Polymorphic Behavior

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
    method.pay(amount);  // Polymorphic dispatch
}
```

If you follow these principles, your code will naturally be composable, clear, and aligned with the domain.

## Rule 4: Do Not Assume Synchronized State

**Your local repository state may be stale.** The operator may merge PRs, change branches, or modify files outside your session. Never assume:

### Git/Repository Assumptions (Dangerous)

**Do not assume:**
- Your local `develop` (or default branch) is current with `origin`
- Files haven't changed since you last read them
- Branches you created are still valid (PRs may have been merged/closed)
- Your working directory is clean or as you left it

### Workspace Assumptions (Dangerous)

**Do not assume exclusive access to:**
- The filesystem (other processes/agents may modify files)
- Environment variables (may change between invocations)
- Network ports (may be in use by other services)
- Running processes (state may not be what you expect)

### Correct Approaches

**Verify git state at session start:**
```bash
# Always check if local HEAD is behind origin
git fetch origin
git status

# Pull latest before starting work
git pull origin develop
```

**Don't assume file state persists:**
```java
// BAD - assumes file hasn't changed since last read
private Config cachedConfig;  // May be stale

// GOOD - read fresh when needed
public Config getConfig() {
    return ConfigLoader.load("config.json");  // Always current
}
```

**Explicitly verify external state:**
```bash
# Check if port is available before using
if ! lsof -i :8080 > /dev/null 2>&1; then
    start_server_on_port 8080
else
    echo "Port 8080 is already in use"
fi
```

**When uncertain, verify** rather than assuming state is as you left it.

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
