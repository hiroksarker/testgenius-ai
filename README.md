# 🧠 TestGenius AI

**AI-Driven E2E Testing Framework with WebdriverIO**

Write tests in plain English. Let AI generate, validate, and fix them automatically.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![WebdriverIO](https://img.shields.io/badge/WebdriverIO-8+-orange.svg)](https://webdriver.io/)
[![Allure](https://img.shields.io/badge/Allure-Reporting-blue.svg)](https://docs.qameta.io/allure/)

## 🎯 Overview

TestGenius is a revolutionary AI-powered end-to-end testing framework that combines the power of WebdriverIO with advanced AI capabilities. Write test scenarios in natural language and let our AI engine handle the complex browser automation.

### ✨ Key Features

- 🤖 **AI-Powered Execution**: GPT-4o analyzes page structure for intelligent automation
- 📸 **Visual Testing**: Automatic screenshot capture and visual validation
- 🎙️ **Interactive Recorder**: Create tests on-the-fly with guided prompts
- 📊 **Beautiful Allure Reports**: Professional, interactive test reporting with analytics
- 🏷️ **Smart Tagging**: Organize tests by priority, tags, and categories
- ⚡ **Parallel Execution**: Run multiple tests simultaneously
- 🔄 **Session Tracking**: Complete test execution logging
- 🛠️ **Modular Design**: Clean, maintainable, extensible architecture
- 🌐 **Direct Browser Automation**: No standalone Selenium server required

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Chromium-based browser (Chrome, Chromium, Edge)
- OpenAI API Key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd testgenius-ai
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Set up environment variables:**
   ```bash
   # Run the interactive environment setup script
   npm run setup:env
   
   # Or manually copy the example
   cp env.example .env
   ```

4. **Configure your OpenAI API key:**
   ```bash
   # Edit the .env file to add your OpenAI API key
   nano .env
   ```

5. **Run tests directly (no standalone server needed):**
   ```bash
   npm start run test all
   ```

### Your First Test

1. **Create a test using the recorder:**
   ```bash
   npm start run test-recorder
   ```

2. **Or create a test manually:**
   ```typescript
   // src/tests/login-test.ts
   export const LOGIN_TEST = {
     id: "AUTH-001",
     name: "Basic Login Test",
     description: "Test login functionality with valid credentials",
     priority: "High",
     tags: ["authentication", "login", "smoke"],
     site: "https://example.com",
     testData: {
       email: "test@example.com",
       password: "password123"
     },
     task: "Navigate to the login page, enter valid credentials, and verify successful login"
   };
   ```

3. **Run your test:**
   ```bash
   npm start run test AUTH-001
   ```

## 🌐 The Internet Testing Site

TestGenius AI includes comprehensive test examples for [The Internet](https://the-internet.herokuapp.com/), a popular testing site designed specifically for web automation. This site provides diverse UI elements and scenarios perfect for demonstrating AI-powered testing capabilities.

### Quick Setup for The Internet Tests

1. **Run the setup script:**
   ```bash
   npm run setup:internet
   ```

2. **List available tests:**
   ```bash
   npm run test:internet:list
   ```

3. **Run all tests:**
   ```bash
   npm run test:internet
   ```

4. **Run specific test:**
   ```bash
   npm run test:internet:single INTERNET-001
   ```

5. **Run tests by tag:**
   ```bash
   npm run test:internet:tag forms
   ```

### Available Test Categories

- **Authentication** - Login forms and security tests
- **Forms** - Checkboxes, dropdowns, file uploads
- **JavaScript** - Alerts, popups, dynamic content
- **Interaction** - Hover effects, keyboard input
- **Performance** - Slow loading resources
- **DOM** - Complex table structures and elements

### Why The Internet?

- ✅ **Diverse UI Elements** - Forms, buttons, dropdowns, checkboxes
- ✅ **Dynamic Content** - Pages that change content dynamically  
- ✅ **JavaScript Interactions** - Alerts, popups, hover effects
- ✅ **Complex Scenarios** - Authentication, file handling, DOM manipulation
- ✅ **Performance Testing** - Slow loading resources
- ✅ **Edge Cases** - Broken images, challenging DOM structures
- ✅ **Real-world Patterns** - Common web application scenarios

For detailed information, see [THE_INTERNET_TESTING_GUIDE.md](./THE_INTERNET_TESTING_GUIDE.md).

## 📊 Allure Reporting

TestGenius AI now features **Allure reporting** - the industry standard for beautiful, interactive test reports.

### 🎨 Allure Report Features

- **Interactive Dashboard** - Modern, responsive UI with charts and graphs
- **Step-by-Step Execution** - Detailed test execution with screenshots
- **Test Metadata** - Tags, priority, parameters, and environment info
- **Trend Analysis** - Track test performance over time
- **Filtering & Search** - Find tests by tags, status, or custom criteria
- **Export Functionality** - Share reports in various formats

### 📈 Using Allure Reports

1. **Run tests** (Allure results are generated automatically):
   ```bash
   npm run test:internet:single INTERNET-001
   ```

2. **Generate Allure report:**
   ```bash
   npm run allure:generate
   ```

3. **Open Allure report in browser:**
   ```bash
   npm run allure:open
   ```

4. **Serve Allure report locally** (for real-time updates):
   ```bash
   npm run allure:serve
   ```

5. **Clean Allure results:**
   ```bash
   npm run allure:clean
   ```

### 📋 Allure Report Structure

```
allure-results/          # Raw test results
├── testgenius-*.json    # Test metadata
└── *.png               # Screenshots

allure-report/           # Generated HTML report
├── index.html          # Main dashboard
├── widgets/            # Charts and graphs
└── data/              # Report data
```

## 📖 Documentation

### Core Commands

#### Test Execution
```bash
# Run all tests
npm start run test all

# Run specific test
npm start run test AUTH-001

# Run tests by tag
npm start run test --tag smoke
npm start run test --tag authentication

# Run tests by priority
npm start run test --priority High
npm start run test --priority Medium

# Run with different browser
npm start run test all --browser firefox

# Run in headed mode (non-headless)
npm start run test all --no-headless

# Parallel execution
npm start run test all --parallel 3
```

#### Test Creation & Recording
```bash
# Start interactive test recorder
npm start run test-recorder

# List all available tests
npm start list

# List tests by tag
npm start list --tag smoke

# List tests by priority
npm start list --priority High
```

#### Reports & Analytics
```bash
# Generate Allure report
npm run allure:generate

# Open Allure report
npm run allure:open

# Serve Allure report locally
npm run allure:serve

# Generate HTML report (legacy)
npm start generate report

# Generate summary report
npm start generate report --summary

# Open report in browser
npm start open report
```

#### Project Management
```bash
# Initialize new project
npm start init

# Clean up old results
npm start cleanup results

# Setup environment
npm run setup:env

# Setup Internet tests
npm run setup:internet
```

### Environment Variables

Create a `.env` file with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
AI_TEMPERATURE=0.1
AI_MAX_TOKENS=2000
AI_RETRY_ATTEMPTS=3

# WebdriverIO Configuration
DEFAULT_BROWSER=chrome
DEFAULT_HEADLESS=false
DEFAULT_VIEWPORT=1920x1080
DEFAULT_TIMEOUT=30000
DEFAULT_WAIT_TIMEOUT=5000

# The Internet Test Site
THE_INTERNET_BASE_URL=https://the-internet.herokuapp.com
THE_INTERNET_USERNAME=tomsmith
THE_INTERNET_PASSWORD=SuperSecretPassword!

# Reporting Configuration
REPORT_OUTPUT_DIR=reports
INCLUDE_SCREENSHOTS=true
INCLUDE_CONSOLE_LOGS=true
```

### Configuration File

The `testgenius.config.js` file allows you to customize:

- **AI Settings** - Model, temperature, retry attempts
- **Browser Configuration** - Headless mode, viewport, timeouts
- **Test Execution** - Parallel execution, retry logic
- **Reporting** - Output directories, retention policies
- **Environment-specific** - Staging, production, development settings

## 🏗️ Architecture

### Core Components

```
src/
├── bin/
│   └── testgenius.ts          # CLI entry point
├── framework/
│   ├── core/                  # Core framework classes
│   │   ├── TestRunner.ts      # Main test execution engine
│   │   ├── AITestExecutor.ts  # AI-powered test execution
│   │   ├── TestRecorder.ts    # Interactive test recording
│   │   ├── ConfigManager.ts   # Configuration management
│   │   ├── ReportGenerator.ts # Report generation
│   │   └── ...
│   └── tools/                 # Browser automation tools
│       ├── BrowserTools.ts    # Browser management
│       ├── NavigationTools.ts # Page navigation
│       ├── InteractionTools.ts # Element interaction
│       └── VerificationTools.ts # Assertions and verification
├── tests/                     # Test definitions
│   ├── the-internet-tests.ts  # The Internet test suite
│   └── ...
└── types/                     # TypeScript type definitions
    └── index.ts
```

### AI Integration

TestGenius uses OpenAI's GPT-4o to:

1. **Analyze Test Scenarios** - Understand natural language test descriptions
2. **Generate Execution Plans** - Create step-by-step automation plans
3. **Adapt to Page Changes** - Handle dynamic content and UI updates
4. **Provide Fallback Logic** - Intelligent error recovery and retry mechanisms

### Browser Automation

- **Direct Browser Control** - No standalone Selenium server required
- **WebdriverIO Integration** - Modern, reliable browser automation
- **Cross-browser Support** - Chrome, Firefox, Safari, Edge
- **Headless/Headed Mode** - Flexible execution options

## 🧪 Testing

### Running Tests

```bash
# Build the project
npm run build

# Run all tests
npm start run test all

# Run specific test
npm start run test AUTH-001

# Run Internet tests
npm run test:internet

# Run single Internet test
npm run test:internet:single INTERNET-001
```

### Development

```bash
# Watch mode for development
npm run dev

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd testgenius-ai

# Install dependencies
npm install

# Build the project
npm run build

# Set up environment
npm run setup:env

# Run tests
npm start run test all
```

## 📄 License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WebdriverIO](https://webdriver.io/) - Modern browser automation
- [OpenAI](https://openai.com/) - AI capabilities
- [Allure Framework](https://docs.qameta.io/allure/) - Beautiful test reporting
- [The Internet](https://the-internet.herokuapp.com/) - Testing site examples

## 📞 Support

- 📧 Email: support@testgenius.ai
- 🐛 Issues: [GitHub Issues](https://github.com/hiroksarker/testgenius-ai/issues)
- 📖 Documentation: [Wiki](https://github.com/hiroksarker/testgenius-ai/wiki)

---

**Made with ❤️ by the TestGenius Team** 