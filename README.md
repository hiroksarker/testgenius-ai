# 🤖 TestGenius AI - Intelligent E2E Testing Framework

> **⚠️ IMPORTANT FOR ALL USERS (QA, DEV, LEARNERS):**
>
> TestGenius AI will **NOT** work without an OpenAI API key.  
> All test execution, recording, and reporting features depend on AI.  
> **You must set up your OpenAI API key before using this framework.**
>
> This is essential for:
> - QA automation
> - Learning and experimentation
> - Professional or research use
>
> 👉 **Action Required:**  
> 1. Get your OpenAI API key from https://platform.openai.com/api-keys  
> 2. Add it to your `.env` file as `OPENAI_API_KEY=...`  
> 3. Now you can record, run, and analyze tests with AI power!

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

- 🤖 **AI-Powered Execution (MANDATORY)**: All test execution is driven by AI (OpenAI GPT-4o or compatible). You **must** provide an OpenAI API key—this is not optional!
- 📚 **AI Integration is Essential**: For your own learning, research, or professional automation, understanding and enabling AI integration is required. The framework will not function without it.
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
- **OpenAI API Key (MANDATORY)**: You must have an OpenAI API key. Get one from https://platform.openai.com/api-keys

### First Test

```bash
# Record a test (requires OpenAI API key)
testgenius record

# Run all tests (requires OpenAI API key)
testgenius run test all

# Generate and view reports
testgenius allure:generate
testgenius allure:open
```

> **Note:** TestGenius AI will not work without a valid OpenAI API key. All core features depend on AI-powered execution.

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