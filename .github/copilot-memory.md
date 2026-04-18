# KwintBaseHarmony — Copilot Workflow Notes

## BMad / _outputs context
- `_outputs/` contains brainstorming sessions, implementation specs, and planning artifacts
- Always check `_outputs/implementation-artifacts/` for specs relevant to the current milestone
- `_outputs/planning-artifacts/` contains phase-level plans — read and keep in sync with `DEVELOPMENT_PLAN.md`
- When a milestone completes or new milestones are planned, update BOTH `DEVELOPMENT_PLAN.md` AND the matching file in `_outputs/planning-artifacts/`
- `DEVELOPMENT_PLAN.md` is the authoritative source-of-truth for phase/milestone status

## Ask before acting
- If requirements are ambiguous (e.g. how a puzzle mechanic should work, what "readable" means for notation, what the acceptance criteria are) — ASK the user before implementing
- Prefer one focused question over guessing

## PR & Merge Pattern (always do this at end of a milestone/feature)
1. Update `DEVELOPMENT_PLAN.md` with milestone status + deliverables table
2. Update the matching planning-artifact file in `_outputs/planning-artifacts/` to reflect current milestone numbering and status
3. `git checkout -b feature/<branch-name>`
4. `git add -A && git commit -m "..."`
5. `git push -u origin <branch-name>`
6. `gh pr create --title "..." --body "..." --base main`
7. **STOP — ask user to review the PR before merging**
8. After user confirms: `gh pr merge <number> --merge --delete-branch`

## PRs merged so far
- PR #37 — Bug fixes (getPuzzleLayers, /complete body, time/attempts tracking, Back to Puzzle button)
- PR #38 — Milestone 5.1 Auth MVP (JWT, login/register pages, nav widget)
- PR #39 — Milestone 5.2 Auth Enforcement (RequireAuthorization, TestAuthHandler, 54/54 tests, 5 pre-existing bug fixes)
