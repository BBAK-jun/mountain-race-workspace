---
name: pr-create
description: Draft a pull request for the mountain race workspace. Use when turning the current branch diff into a reviewable PR title and body that covers apps/web, apps/api, docs, Cursor config, CI, deployment, verification, and remaining risk.
---

# PR Create

## Use this skill when

- Opening a GitHub pull request from a finished branch
- Turning a mixed diff into a concise reviewer-facing summary
- Writing PRs that touch app code, docs, `.cursor`, CI, or deployment files

## Workflow

1. Inspect the branch before writing:
   - `git status --short`
   - `git diff --stat <base>...HEAD`
   - `git diff --name-only <base>...HEAD`
2. Group the diff by repository surface:
   - `apps/web`
   - `apps/api`
   - `docs`
   - `.cursor`
   - `.github` and root tooling files
3. Choose a PR title that matches existing history:
   - Prefer `type(scope): summary`
   - Examples: `feat(web): add race result shell`, `chore(cursor): add pr-create skill`
   - Use the primary surface as `scope`; omit the scope only when the change is truly cross-cutting
4. Fill `.github/PULL_REQUEST_TEMPLATE.md` with facts from the diff:
   - what changed
   - why it changed
   - which surfaces were touched
   - which checks actually ran
   - what remains risky or unverified
5. If product behavior, route flow, API contract, or deployment assumptions changed, mention the matching docs update or explain why no docs change was needed.
6. If UI changed, attach screenshot or demo evidence. If no visual artifact is available, say that explicitly.
7. Remove vague filler before publishing. The reviewer should understand the branch in one pass.

## Guardrails

- Do not claim validation you did not run.
- Do not paste the raw commit log or full diff into the PR body.
- Do not hide skipped checks behind `N/A`; say what was skipped and why.
- Do not treat `.cursor` or workflow changes as invisible tooling noise; explain how they affect contributors or release flow.

## Done when

- The PR title matches the dominant change.
- The body mirrors `.github/PULL_REQUEST_TEMPLATE.md`.
- Verification and remaining risk are both explicit.
