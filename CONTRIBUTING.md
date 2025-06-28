# 🤝 Contributing to TestGenius AI

Thank you for your interest in contributing to TestGenius AI! This document provides guidelines and information for contributors.

## 🎯 How to Contribute

### 🐛 Reporting Bugs

1. **Check existing issues** - Search for similar issues before creating a new one
2. **Create a detailed bug report** - Include:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, browser)
   - Screenshots or logs if applicable

### 💡 Suggesting Features

1. **Check existing feature requests** - Search for similar suggestions
2. **Create a feature request** - Include:
   - Clear description of the feature
   - Use cases and benefits
   - Implementation ideas (if any)
   - Mockups or examples (if applicable)

### 🔧 Code Contributions

#### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/testgenius-ai.git
   cd testgenius-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Set up environment**
   ```bash
   npm run setup:env
   ```

5. **Run tests**
   ```bash
   npm start run test all
   ```

#### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests for new functionality
   - Update documentation

3. **Test your changes**
   ```bash
   npm run build
   npm start run test all
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description
   - Link related issues
   - Include screenshots if UI changes

## 📋 Coding Standards

### TypeScript Guidelines

- Use TypeScript for all new code
- Follow strict typing
- Use interfaces for object shapes
- Prefer `const` over `let`
- Use arrow functions for callbacks

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_CASE for constants

### File Naming

- Use kebab-case for file names
- Use descriptive names
- Group related files in directories

### Documentation

- Add JSDoc comments for public functions
- Update README.md for new features
- Include examples in documentation

## 🧪 Testing Guidelines

### Writing Tests

- Write tests for all new functionality
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test both success and failure cases

### Running Tests

```bash
# Run all tests
npm start run test all

# Run specific test
npm start run test TEST_ID

# Run tests in headed mode
npm start run test all --no-headless

# Generate Allure report
npm run allure:generate
npm run allure:open
```

## 📝 Commit Message Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(recorder): add BDD mode support
fix(executor): resolve smart wait timeout issue
docs(readme): update installation instructions
test(login): add comprehensive login test suite
```

## 🏗️ Project Structure

```
testgenius-ai/
├── src/
│   ├── bin/                    # CLI entry point
│   ├── framework/              # Core framework
│   │   ├── core/              # Core classes
│   │   └── tools/             # Browser automation tools
│   ├── tests/                 # Test definitions
│   └── types/                 # TypeScript definitions
├── test-results/              # Test execution results
├── screenshots/               # Test screenshots
├── allure-results/           # Allure test results
├── allure-report/            # Generated Allure reports
└── docs/                     # Documentation
```

## 🎯 Areas for Contribution

### High Priority

- **Performance improvements** - Faster test execution
- **Browser compatibility** - Support for more browsers
- **AI enhancements** - Better test generation and execution
- **Documentation** - Improving guides and examples

### Medium Priority

- **New test actions** - Additional automation capabilities
- **Reporting enhancements** - More report formats
- **CI/CD integration** - GitHub Actions, GitLab CI
- **Plugin system** - Extensible architecture

### Low Priority

- **UI improvements** - Better user experience
- **Internationalization** - Multi-language support
- **Mobile testing** - Mobile browser automation
- **API testing** - REST API testing capabilities

## 🆘 Getting Help

- **Documentation**: Check the [Wiki](WIKI_HOME.md)
- **Issues**: Search [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@testgenius.ai

## 📄 License

By contributing to TestGenius AI, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributor hall of fame
- GitHub contributors page

---

**Thank you for contributing to TestGenius AI! 🚀** 