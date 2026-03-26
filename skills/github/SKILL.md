---
name: github
description: Interact with GitHub - repositories, issues, pull requests. Prefer MCP tools when available, fall back to GitHub CLI `gh` if not.
# SPDX-FileCopyrightText: Copyright © 2026 Caleb Cushing
#
# SPDX-License-Identifier: CC-BY-NC-SA-4.0
---

## Tool Priority

1. **Prefer MCP tools** - Use GitHub MCP tools when available (e.g., `pull_request_read`, `issue_write`)
2. **Fall back to GitHub CLI** - Use `gh` command when MCP tools are unavailable
3. **Disable pagination** - Use `GH_PAGER=cat` with CLI commands

## Why MCP Over CLI

- More reliable structured responses (no parsing shell output)
- Built-in authentication handling
- Safer (no shell injection risks)
- Better error messages
