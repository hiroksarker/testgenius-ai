# 🤖 TestGenius AI - Intelligent E2E Testing Framework

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebdriverIO](https://img.shields.io/badge/WebdriverIO-4.0.0+-green.svg)](https://webdriver.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0.0+-green.svg)](https://nodejs.org/)
[![Allure](https://img.shields.io/badge/Allure-Reporting-blue.svg)](https://docs.qameta.io/allure/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-1.0.0-ff69b4.svg)](CODE_OF_CONDUCT.md)
[![npm version](https://img.shields.io/npm/v/testgenius-ai.svg)](https://www.npmjs.com/package/testgenius-ai)
[![npm downloads](https://img.shields.io/npm/dm/testgenius-ai.svg)](https://www.npmjs.com/package/testgenius-ai)

> **🚀 Open Source AI-Powered End-to-End Testing Framework**

TestGenius AI is a cutting-edge, open-source E2E testing framework that combines the power of WebdriverIO with intelligent AI-driven test execution. Built with TypeScript and designed for modern web applications, it provides an intuitive way to record, generate, and execute comprehensive test scenarios.

## 🚀 Quick Installation

### NPM Install (Recommended)

```bash
# Install globally
npm install -g testgenius-ai

# Or install locally
npm install testgenius-ai

# Set up environment
testgenius setup:env
```

### From Source

```bash
# Clone the repository
git clone https://github.com/hiroksarker/testgenius-ai.git
cd testgenius-ai

# Install dependencies
npm install

# Build the project
npm run build

# Set up environment
npm run setup:env
```

## ✨ Key Features

- 🤖 **AI-Powered Execution**: Intelligent test execution with smart waits and verifications
- 📹 **Interactive Recording**: Step-by-step test recording with continuous mode
- 🌐 **Multi-Browser Support**: Chrome, Firefox, Safari, Edge automation
- 📊 **Professional Reporting**: Allure-based comprehensive test reports
- 📋 **BDD Support**: Behavior-driven development test scenarios
- 🔧 **CLI Interface**: Powerful command-line interface for test management
- 🔒 **Security First**: Built-in security features and best practices
- 📚 **Complete Documentation**: Comprehensive guides and examples

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Chrome/Firefox**: For browser automation

### First Test

```bash
# Record a test
testgenius record

# Run all tests
testgenius run test all

# Generate and view reports
testgenius allure:generate
testgenius allure:open
```

## 📖 Documentation

- **[Wiki Home](WIKI_HOME.md)** - Complete project documentation
- **[Quick Start Guide](QUICKSTART.md)** - Get started in minutes
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards
- **[Security Policy](SECURITY.md)** - Security reporting and response
- **[Changelog](CHANGELOG.md)** - Version history and updates

## 🎯 Core Components

### 🤖 AI Test Executor
Intelligent test execution with smart waits, verifications, and error recovery.

```typescript
// Smart execution with AI-powered waits
const executor = new AITestExecutor();
await executor.executeTest(testDefinition);
```

### 📹 Test Recorder
Interactive step-by-step recording with continuous mode support.

```bash
# Start recording
testgenius record

# Available commands:
# - done: Finish recording
# - stop: Stop recording
# - back: Go back one step
# - list: Show recorded steps
# - clear: Clear all steps
# - help: Show help
```

### 🌐 Browser Tools
Comprehensive browser automation with WebdriverIO.

```typescript
// Navigate and interact
await browserTools.navigateTo('https://example.com');
await browserTools.clickElement('#login-button');
await browserTools.fillField('#username', 'testuser');
```

### 📊 Allure Reporting
Professional test reporting with detailed step information.

```bash
# Generate reports
testgenius allure:generate

# View reports
testgenius allure:open
```

## 🧪 Test Examples

### Basic Test Recording

```bash
# Start recording
testgenius record

# Follow the prompts to record your test
# The framework will guide you through each step
```

### BDD Test Scenario

```gherkin
Feature: Login Functionality

Background:
  Given I am on the login page

Scenario: Successful Login
  When I enter valid credentials
  And I click the login button
  Then I should be logged in successfully
  And I should see the dashboard
```

### Programmatic Test

```typescript
const testDefinition = {
  id: 'login-test',
  name: 'User Login Test',
  steps: [
    {
      action: 'navigate',
      target: 'https://the-internet.herokuapp.com/login',
      value: null
    },
    {
      action: 'fill',
      target: '#username',
      value: 'tomsmith'
    },
    {
      action: 'fill',
      target: '#password',
      value: 'SuperSecretPassword!'
    },
    {
      action: 'click',
      target: 'button[type="submit"]',
      value: null
    },
    {
      action: 'verify',
      target: '.flash.success',
      value: 'You logged into a secure area!'
    }
  ]
};
```

## 🔧 Configuration

### Environment Variables

```bash
# Copy example environment file
cp env.example .env

# Configure your environment
TEST_BASE_URL=https://your-app.com
TEST_TIMEOUT=30000
BROWSER_NAME=chrome
HEADLESS_MODE=true
```

### WebdriverIO Configuration

```javascript
// testgenius.config.js
module.exports = {
  runner: 'local',
  specs: ['./src/tests/**/*.js'],
  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    'goog:chromeOptions': {
      args: ['--headless', '--no-sandbox']
    }
  }],
  logLevel: 'info',
  bail: 0,
  baseUrl: 'https://the-internet.herokuapp.com',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  services: ['chromedriver'],
  framework: 'mocha',
  reporters: ['spec', ['allure', {
    outputDir: 'allure-results',
    disableWebdriverStepsReporting: true,
    disableWebdriverScreenshotsReporting: false
  }]]
};
```

## 📊 Available Commands

### Test Management

```bash
# Record a new test
testgenius record

# List all tests
testgenius list

# Run all tests
testgenius run test all

# Run specific test
testgenius run test TEST_ID

# Run tests in headed mode
testgenius run test all --no-headless
```

### Development

```bash
# Build project
npm run build

# Watch for changes
npm run watch

# Lint code
npm run lint

# Run unit tests
npm test
```

### Reporting

```bash
# Generate Allure report
testgenius allure:generate

# Open Allure report
testgenius allure:open

# Clean reports
testgenius allure:clean
```

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Contribution

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Fork and clone
git clone https://github.com/hiroksarker/testgenius-ai.git
cd testgenius-ai

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm start run test all
```

## 🐛 Bug Reports & Feature Requests

- **Bug Reports**: [Create an issue](https://github.com/hiroksarker/testgenius-ai/issues)
- **Feature Requests**: [Start a discussion](https://github.com/hiroksarker/testgenius-ai/discussions)
- **Security Issues**: Email [security@testgenius.ai](mailto:security@testgenius.ai)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **WebdriverIO Team** - For the excellent browser automation framework
- **Allure Team** - For the comprehensive reporting solution
- **Open Source Community** - For inspiration and contributions

## 📞 Support

- **Documentation**: [Wiki](WIKI_HOME.md)
- **Issues**: [GitHub Issues](https://github.com/hiroksarker/testgenius-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hiroksarker/testgenius-ai/discussions)
- **Email**: [support@testgenius.ai](mailto:support@testgenius.ai)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hiroksarker/testgenius-ai&type=Date)](https://star-history.com/#hiroksarker/testgenius-ai&Date)

---

**Made with ❤️ by Hirok Sarker**

[![GitHub contributors](https://img.shields.io/github/contributors/hiroksarker/testgenius-ai)](https://github.com/hiroksarker/testgenius-ai/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/hiroksarker/testgenius-ai)](https://github.com/hiroksarker/testgenius-ai/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/hiroksarker/testgenius-ai)](https://github.com/hiroksarker/testgenius-ai/network)
[![GitHub issues](https://img.shields.io/github/issues/hiroksarker/testgenius-ai)](https://github.com/hiroksarker/testgenius-ai/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/hiroksarker/testgenius-ai)](https://github.com/hiroksarker/testgenius-ai/pulls) 