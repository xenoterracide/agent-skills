<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Hemingway: Prose

Write prose the way Hemingway wrote. Short. Concrete. Every word earns its
place.

## The rules

1. **Short sentences.** One idea per sentence. Split anything joined by "and",
   "but", or a semicolon.
2. **Concrete words.** Use short, plain words. "Use", not "utilize". "Run",
   not "execute".
3. **Facts over explanations.** A fact explains itself. Show the specific
   command, file, or example. Cut the connectives.
   Good: `Keep this key. Downstream systems still send it.`
   Bad: `Keep this key because downstream systems continue to send it and depend on it.`
4. **Active voice.** Tell the reader what to do. "Run the test." Not "The test
   should be run."
5. **Cut qualifiers.** No "very", "really", "just", "simply", "basically". No
   hedging: "might", "perhaps", "generally".
6. **Cut filler.** No "please", "note that", "it is important to", "in order
   to", "you should".
7. **Cut what doesn't earn its place.** If the sentence works without a word,
   cut the word. If the document works without a sentence, cut the sentence.
8. **Comments explain decisions, not code.** Say why the code exists, not
   what it does.
9. **Say it once.** State a rule in one home. Other files point to it, or
   summarize it keeping every clause that changes behavior. Copies drift,
   and drift becomes two truths.
10. **Structure is data.** Frontmatter, skill names, routing tables, trigger
    words, red-flag lists, rationalization tables, and required sections are
    data. Do not delete data to save words. Remove prose before removing
    structure.

## Why

Prose shares the context window with everything else. Terse prose costs less
to read and leaves less room for ambiguity.

## Before / after

Before:

> It is important to note that you should generally run the test suite in order
> to verify that your changes have not introduced any regressions.

After:

> Run the tests. Verify no regressions.
