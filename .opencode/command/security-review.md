---
description: Review uncommitted changes for security issues.
agent: security-reviewer
---

Review the current uncommitted changes for security issues before they are
committed. Run `git status` and `git diff` (including new files) and analyze
them against the security conventions in AGENTS.md. Cover auth/authorization,
identity-from-session, secrets/PII, validation, audit logging, rate limiting,
CSRF, and any new code that extends the mock layers instead of the real API.
Report every finding with `file:line` references and a severity.
