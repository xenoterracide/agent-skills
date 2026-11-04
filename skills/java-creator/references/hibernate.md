<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Hibernate

The JPA metamodel generator and its constants for tests.

## Setup

Add the `org.hibernate.orm:hibernate-jpamodelgen` annotation processor. The
processor generates a `<Entity>_` class per JPA entity: the JPA canonical
metamodel attributes, plus a `String` constant per attribute. For a `User`
entity with `getName()`, `User_.NAME` is `"name"`.

## Assert with the constants

Use the constants with AssertJ `hasFieldOrPropertyWithValue`. When the
assertion fails, the error message includes the field name (e.g., "expected
field/property 'name' value"), unlike plain boolean checks that only say
"expected:<true> but was:<false>".

```java
import com.example.User_;

assertThat(user).hasFieldOrPropertyWithValue(User_.NAME, "Alice").hasFieldOrPropertyWithValue(User_.AGE, 30);
```
