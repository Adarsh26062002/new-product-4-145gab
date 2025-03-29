# Contributing to React Todo List

Thank you for your interest in contributing to the React Todo List application! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Git

### Development Environment Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/react-todo-list.git
   cd react-todo-list
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/your-bugfix-name
   ```
5. Start the development server:
   ```bash
   npm start
   ```

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch for integrating features
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Commit Guidelines

We follow conventional commits for clear and structured commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Examples:
```
feat(todo-form): add validation for empty tasks
fix(local-storage): handle storage quota exceeded error
docs: update README with new features
```

## Code Standards

### Code Style

This project uses ESLint and Prettier to enforce code style. Before submitting your changes, please ensure your code follows these standards by running:

```bash
npm run lint
```

To automatically fix many style issues:

```bash
npm run lint:fix
```

### TypeScript

All code should be written in TypeScript. Ensure proper typing for all variables, functions, and components.

### Component Structure

- Use functional components with hooks
- Keep components focused on a single responsibility
- Use CSS Modules for component styling
- Follow the established project structure for new components

## Testing

### Writing Tests

All new features and bug fixes should include appropriate tests:

- **Unit Tests**: For individual functions and components
- **Integration Tests**: For component interactions
- **End-to-End Tests**: For critical user flows (when applicable)

We use Jest and React Testing Library for testing. Follow these guidelines:

- Test files should be co-located with the code they test
- Test filenames should match the file they test with `.test.ts` or `.test.tsx` extension
- Focus on testing behavior, not implementation details
- Aim for high test coverage, especially for critical functionality

### Running Tests

Run all tests:

```bash
npm test
```

Run tests with coverage report:

```bash
npm run test:coverage
```

Our CI pipeline requires at least 80% test coverage for new code.

## Pull Request Process

1. Ensure your code meets all standards and passes all tests
2. Update documentation as needed
3. Submit a pull request to the `develop` branch
4. Fill out the pull request template completely
5. Request review from maintainers
6. Address any feedback from code reviews
7. Once approved, your PR will be merged

### PR Checklist

Before submitting a PR, ensure:

- [ ] Your code follows the project's style guidelines
- [ ] You've added tests for new functionality
- [ ] All tests pass locally
- [ ] Documentation has been updated if necessary
- [ ] Your branch is up to date with the target branch
- [ ] You've included a meaningful PR description

PRs that don't meet these criteria may be rejected or require additional changes.

## Release Process

This project follows semantic versioning (MAJOR.MINOR.PATCH):

- MAJOR: Incompatible API changes
- MINOR: Backwards-compatible new functionality
- PATCH: Backwards-compatible bug fixes

The release process is managed by project maintainers:

1. Changes are accumulated in the `develop` branch
2. When ready for release, a release branch is created
3. Final testing and version bumping occurs in the release branch
4. The release branch is merged to `main` and tagged with the version number
5. Release notes are generated from the changelog

Contributors should update the CHANGELOG.md file as part of their PRs, adding entries under the "Unreleased" section.

## Bug Reports and Feature Requests

### Reporting Bugs

Bug reports should be submitted using the bug report template on GitHub Issues. Please include:

- A clear description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable
- Environment information (browser, OS, etc.)

### Feature Requests

Feature requests should be submitted using the feature request template on GitHub Issues. Please include:

- A clear description of the proposed feature
- The problem it solves
- Any implementation ideas you have
- Mockups or examples if applicable

## Community

### Communication Channels

- GitHub Issues: For bug reports and feature requests
- GitHub Discussions: For general questions and discussions
- Pull Requests: For code contributions

### Recognition

All contributors will be recognized in the project's README.md file. Significant contributions may be highlighted in release notes.

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License. See the LICENSE file for details.