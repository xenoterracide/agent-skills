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

```python
# BAD - exception is silently lost
try:
    risky_operation()
except:
    pass
```

```javascript
// BAD - error is silently lost
try {
    riskyOperation();
} catch (e) {
    // do nothing
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

```python
# GOOD - reraise to let caller handle
try:
    risky_operation()
except IOError as e:
    raise ApplicationError("Failed to process file") from e
```

**Log when you need to continue:**
```java
// GOOD - log with context before continuing
try {
    optionalCleanup();
} catch (Exception e) {
    logger.warn("Cleanup failed for resource {}, continuing anyway", resourceId, e);
}
```

```python
# GOOD - log with context before continuing
try:
    optional_cleanup()
except Exception as e:
    logger.warning(f"Cleanup failed for resource {resource_id}, continuing anyway: {e}")
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

We follow the **testing trophy** approach, which values integration-style testing over isolated unit testing:

**Sociable Tests (preferred)**
- Tests that use real collaborating objects, not mocks
- Named by Martin Fowler: tests are "sociable" when they interact with real dependencies
- Only mock when absolutely necessary (external services, non-deterministic behavior)
- Tests the actual behavior of the system as it will run in production

**Integration Tests (preferred)**
- Test real workflows end-to-end using real objects
- Verify components work together correctly
- Prefer calling through public APIs rather than testing internals
- Exercise the code paths users will actually trigger

**When to Mock (exceptions)**
- External services you don't control
- Non-deterministic behavior (random, time, etc.)
- Extremely slow operations that would make tests impractical
- Infrastructure you can't easily run locally

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

**Testing implementation details:**
```java
// BAD - testing internal state, not behavior
@Test
void parserSetsStateCorrectly() {
    var parser = new Parser();
    parser.parse("input");
    assertEquals(3, parser.getTokenCount());  // Internal detail that may change
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
    
    assertEquals(OrderStatus.CONFIRMED, result.status());
    assertNotNull(result.confirmationNumber());
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

**Encapsulate behavior so it's polymorphic** - let the unit decide how to act rather than orchestrating externally:

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

## Rule 4: Do Not Assume Shared State or Identity

**You may not share a workspace with the operator, and you may not be the same user.** Never make assumptions about:

### Workspace Assumptions (Dangerous)

**Do not assume exclusive access to:**
- The filesystem (other processes/agents may modify files)
- Environment variables (may change between invocations)
- Network ports (may be in use by other services)
- Running processes (state may not be what you expect)

**Do not assume you know the full context:**
- Files may have been modified since you last read them
- External services may have different state than when last checked
- Configuration may differ between environments

### User Identity Assumptions (Dangerous)

**Do not assume:**
- You are running as the same user as the operator
- You have the same permissions as the operator
- Your home directory is the operator's home directory
- Your SSH keys, git config, or credentials are the operator's
- Your shell environment matches the operator's

### Correct Approaches

**Explicitly verify state:**
```bash
# Check if port is available before using
if ! lsof -i :8080 > /dev/null 2>&1; then
    start_server_on_port 8080
else
    echo "Port 8080 is already in use"
fi
```

**Don't assume file state persists:**
```python
# BAD - assumes file hasn't changed since last read
with open('config.json') as f:
    config = json.load(f)  # May be stale

# GOOD - read fresh when needed
def get_config():
    with open('config.json') as f:
        return json.load(f)  # Always current
```

**Check user context:**
```bash
# Know who you're running as
CURRENT_USER=$(whoami)
CURRENT_HOME=$HOME

echo "Running as: $CURRENT_USER"
echo "Home directory: $CURRENT_HOME"
```

**When uncertain, ask or verify** rather than assuming shared state or identity.

---

SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
