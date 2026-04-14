# Contributing to KwintBaseHarmony

Thank you for contributing! This document outlines the development workflow, standards, and expectations for all contributors.

## Code of Conduct

- Be respectful and inclusive
- Focus on the music education mission
- Provide constructive feedback
- Assume good intent

## Development Requirements

### Pre-Submission Checklist

Before creating a PR, verify:

```bash
# 1. Ensure main branch is up-to-date
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Work on feature
# ... make changes ...

# 4. Test locally
dotnet build
dotnet test

# 5. Push and create PR
git push origin feature/your-feature-name
```

### Code Standards

**C# / .NET**
- Follow Microsoft C# Coding Conventions
- Use meaningful variable/method names
- Add XML documentation for public APIs
- Ensure 0 compiler errors, address all warnings
- Target .NET 8.0 minimum

**Tests**
- Unit tests for all service logic
- Use xUnit + Moq pattern
- Aim for >80% code coverage on features
- Place tests in `/tests/` folder mirroring source structure

**Git Commits**
- Write clear, present-tense commit messages
- Include workstream tag: `[WS1-1.4]`
- Reference issues/specs: `Implements spec-ws1-1-3.md`
- Keep commits focused (one feature = one logical commit)

### PR Requirements

**Title Format**: `[WS{X}-{Y}.{Z}] Brief description`

Example: `[WS1-1.4] Add REST API endpoints for composition CRUD`

**Description Template**:
```markdown
## Change Summary
Brief explanation of what this PR does.

## Related Spec
- spec-ws1-1-4-rest-api.md
- #15 (GitHub issue if applicable)

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing Done
- Unit tests added/updated: ✅
- Manual testing: ✅
- Build verification: ✅

## Checklist
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Commits are clean and logical
- [ ] Branch is up-to-date with main
```

### Review Process

1. **Automated Checks** (future):
   - Build verification
   - Test suite execution
   - Code quality scanning

2. **Human Review**:
   - At least 1 approval required
   - Reviewers verify functionality, design, and maintainability
   - Address feedback and push corrections to same branch

3. **Merge**:
   - Use "Squash and merge" to keep history clean
   - Delete branch after merge
   - Reference PR number in merge commit

## Workstream Guidelines

### WS1 - Learning Architecture
**Focus**: Data models, persistence, core business logic

**Files**:
- `src/backend/Models/` — Entity definitions
- `src/backend/Data/` — DbContext & migrations
- `src/backend/Services/` — Business logic
- `tests/` — Unit tests

**Quality Gates**:
- 100% test coverage for services
- Clean database migrations
- Validated entity relationships

### WS2 - Multi-Modal Interaction
**Focus**: Frontend components, audio, notation, synchronization

**Files**:
- `src/frontend/components/` — React components
- `src/frontend/audio/` — Tone.js integration
- `src/frontend/notation/` — Vexflow rendering
- `tests/` — Component & integration tests

**Quality Gates**:
- Responsive design (mobile + desktop)
- Audio latency < 50ms
- Smooth notation updates
- Accessibility compliance (WCAG 2.1 AA)

### WS3 - Integration & Testing
**Focus**: End-to-end flows, deployment, QA

**Files**:
- `tests/e2e/` — End-to-end tests
- `docs/deployment/` — Deployment guides
- `TESTING.md` — Test strategy

**Quality Gates**:
- All E2E tests pass
- Performance benchmarks met
- Deployment automation working

## Documentation

All features must include:
- API documentation (for services/endpoints)
- User-facing docs if applicable
- Code comments for complex logic
- Updated README if workflow changes

## Reporting Issues

If you find a bug or have a feature suggestion:
1. **Check existing issues** to avoid duplicates
2. **Create a detailed issue** with:
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, .NET version, browser)
   - Suggested solution (optional)

## Questions?

- Review [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for roadmap
- Check existing PRs for similar patterns
- Reach out to project leads

---

**Happy coding, and thanks for contributing to music education! 🎵**
