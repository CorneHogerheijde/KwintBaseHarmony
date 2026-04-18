# KwintBaseHarmony — Copilot Workflow Notes

## BMad / _outputs context
- `_outputs/` contains brainstorming sessions, implementation specs, and planning artifacts
- Always check `_outputs/implementation-artifacts/` for specs relevant to the current milestone
- `DEVELOPMENT_PLAN.md` is the source-of-truth for phase/milestone status

## PR & Merge Pattern (always do this at end of a milestone/feature)
1. Update `DEVELOPMENT_PLAN.md` with milestone status + deliverables table
2. `git checkout -b feature/<branch-name>`
3. `git add -A && git commit -m "..."`
4. `git push -u origin <branch-name>`
5. `gh pr create --title "..." --body "..." --base main`
6. **STOP — ask user to review the PR before merging**
7. After user confirms: `gh pr merge <number> --merge --delete-branch`

## PRs merged so far
- PR #37 — Bug fixes (getPuzzleLayers, /complete body, time/attempts tracking, Back to Puzzle button)
- PR #38 — Milestone 5.1 Auth MVP (JWT, login/register pages, nav widget)
