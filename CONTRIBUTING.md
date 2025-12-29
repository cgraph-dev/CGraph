# Contributing to CGraph

Thank you for your interest in contributing to CGraph! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/CGraph.git`
3. Add upstream remote: `git remote add upstream https://github.com/cgraph-dev/CGraph.git`
4. Create a branch: `git checkout -b feature/your-feature`

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/improvements

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

Examples:
```
feat(messaging): add message reactions
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
```

### Code Style

#### Elixir
- Use `mix format` before committing
- Follow the [Elixir Style Guide](https://github.com/christopheradams/elixir_style_guide)
- Write documentation for public functions

#### TypeScript/JavaScript
- ESLint and Prettier are configured
- Run `pnpm lint` to check for issues
- Run `pnpm format` to auto-fix formatting

### Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Backend: `cd apps/backend && mix test`
- Frontend: `pnpm test`

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure CI passes
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Added comments where needed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
```

## Project Structure

```
apps/backend/       # Elixir/Phoenix backend
apps/web/           # React web frontend
apps/mobile/        # React Native mobile app
packages/           # Shared packages
infrastructure/     # DevOps and deployment
docs/               # Documentation
```

## Questions?

- Open a [GitHub Issue](https://github.com/cgraph-dev/CGraph/issues)
- Join our community discussions

Thank you for contributing! 🎉
