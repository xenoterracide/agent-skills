<!--
SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing

SPDX-License-Identifier: CC-BY-NC-SA-4.0
-->

# Kimi Testing

"Kimi" here means the Kimi Code CLI, not the Kimi model.

The CLI cannot test a skill in-session, so fork a separate `kimi -p` process.

## Discovery

Point `--skills-dir` at this repo's `skills/` directory:

```bash
kimi -p 'What skills do you see related to <topic>?' --skills-dir /path/to/this/repo/skills
```

## Behavioral

For discipline-enforcing skills like `completion-checklist`, use a realistic
implementation task in a temporary git repo:

```bash
rm -rf /tmp/skill-test-repo
mkdir /tmp/skill-test-repo
cd /tmp/skill-test-repo
git init
git config user.email "test@example.com"
git config user.name "Test"
echo '# Test' > README.md
git add README.md
git commit -m 'init'

kimi -p 'In /tmp/skill-test-repo, add a small script that does X, run it, and report that the implementation is complete.' \
  --skills-dir /path/to/this/repo/skills \
  --skills-dir /path/to/superpowers/skills
```

Inspect the output. Did the agent invoke the skill before claiming completion?
Did it follow the gate steps? If not, the description or body needs to be
stronger.

## Limits

`kimi -p` can verify that a skill is loaded and that the model recognizes it as
relevant, but it may not fully replicate interactive session skill invocation.
After mechanical and pressure tests, start a real session with the updated
plugin installed to confirm production behavior.
