# TestGenius AI Wiki

Welcome to the TestGenius AI documentation! This wiki provides comprehensive guides, tutorials, and troubleshooting information for the AI-driven E2E testing framework.

## 📚 Quick Navigation

- [Getting Started](#getting-started)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [AI Features](#ai-features)
- [Reporting](#reporting)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Support](#support)

---

## 🚀 Getting Started

### What is TestGenius AI?

TestGenius AI is a modern, AI-powered end-to-end testing framework that combines the reliability of WebdriverIO with the intelligence of OpenAI's GPT-4o. It allows you to write tests in natural language and automatically generates browser automation code.

### Key Features

- 🤖 **AI-Powered Test Execution** - Natural language test descriptions
- 🌐 **Direct Browser Automation** - No standalone Selenium server needed
- 📊 **Beautiful Reporting** - Allure integration with detailed test reports
- 🔧 **Flexible Configuration** - Environment-specific settings
- 🎯 **Smart Element Detection** - AI-driven element locator strategies
- 📱 **Cross-Browser Support** - Chrome, Firefox, Safari, Edge
- ⚡ **Fast Execution** - Optimized for speed and reliability

---

## 📦 Installation Guide

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager
- OpenAI API key (for AI features)

### Quick Install

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

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your configuration:
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
   ```

3. Run the setup script:
   ```bash
   npm run setup:env
   ```

---

## ⚙️ Configuration

### Configuration File

The main configuration is in `testgenius.config.js`:

```javascript
module.exports = {
  ai: {
    model: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 2000,
    retryAttempts: 3
  },
  browser: {
    defaultBrowser: 'chrome',
    headless: true,
    viewport: '1920x1080',
    timeout: 30000,
    waitforTimeout: 5000
  },
  webdriverio: {
    logLevel: 'warn',
    timeout: 30000,
    waitforTimeout: 5000,
    connectionRetryCount: 3,
    connectionRetryTimeout: 120000
  },
  reporting: {
    outputDir: 'reports',
    includeScreenshots: true,
    includeConsoleLogs: true,
    retentionDays: 30
  }
};
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Your OpenAI API key | Required |
| `OPENAI_MODEL` | AI model to use | `gpt-4o` |
| `AI_TEMPERATURE` | AI creativity level | `0.1` |
| `DEFAULT_BROWSER` | Default browser | `chrome` |
| `DEFAULT_HEADLESS` | Headless mode | `false` |
| `DEFAULT_VIEWPORT` | Browser viewport | `1920x1080` |

---

## ✍️ Writing Tests

### Test Structure

Tests are defined as TypeScript objects with the following structure:

```typescript
export const MY_TEST = {
  id: 'TEST-001',
  name: 'My Test Name',
  description: 'Test description in natural language',
  priority: 'High' | 'Medium' | 'Low',
  tags: ['smoke', 'regression'],
  site: 'https://example.com',
  task: 'Describe what the test should do in plain English',
  testData: {
    username: 'testuser',
    password: 'testpass'
  }
};
```

### Example Test

```typescript
export const LOGIN_TEST = {
  id: 'AUTH-001',
  name: 'User Login Test',
  description: 'Test user login functionality with valid credentials',
  priority: 'High',
  tags: ['authentication', 'smoke'],
  site: 'https://example.com/login',
  task: 'Login with valid username and password, verify successful login',
  testData: {
    username: 'testuser',
    password: 'testpass'
  }
};
```

### AI-Powered Test Writing

TestGenius AI can understand natural language descriptions:

```typescript
export const SHOPPING_TEST = {
  id: 'ECOMMERCE-001',
  name: 'Add Item to Cart',
  description: 'Add a product to shopping cart and verify it appears',
  priority: 'Medium',
  tags: ['ecommerce', 'shopping'],
  site: 'https://shop.example.com',
  task: 'Navigate to products page, select first item, add to cart, verify cart count increases and item appears in cart',
  testData: {}
};
```

---

## 🏃‍♂️ Running Tests

### Basic Commands

```bash
# Run all tests
npm start run test all

# Run specific test
npm start run test AUTH-001

# Run tests by tag
npm start run test --tag smoke

# Run tests by priority
npm start run test --priority High
```

### Internet Test Suite

```bash
# Run all Internet tests
npm run test:internet

# Run specific Internet test
npm run test:internet -- --test INTERNET-001

# Run tests by tag
npm run test:internet -- --tag forms

# List available tests
npm run test:internet -- --list
```

### Browser Options

```bash
# Run in Firefox
npm start run test all --browser firefox

# Run in headed mode
npm start run test all --no-headless

# Custom viewport
npm start run test all --viewport 1366x768

# Parallel execution
npm start run test all --parallel 3
```

### Environment-Specific

```bash
# Run against staging
npm start run test all --env staging

# Run against production
npm start run test all --env production
```

### Node.js

```bash
# Run internet tests using Node.js
node tests/run-internet-tests.js
```

---

## 🤖 AI Features

### How AI Works

1. **Test Analysis**: AI analyzes your natural language test description
2. **Plan Generation**: Creates a step-by-step execution plan
3. **Element Detection**: Intelligently finds page elements
4. **Execution**: Runs the plan with error handling
5. **Adaptation**: Adjusts to page changes and dynamic content

### AI Configuration

```javascript
// In testgenius.config.js
ai: {
  model: 'gpt-4o',           // AI model to use
  temperature: 0.1,          // Creativity level (0.0-1.0)
  maxTokens: 2000,           // Maximum response length
  retryAttempts: 3,          // Retry attempts on failure
  fallbackStrategy: 'basic'  // Fallback when AI fails
}
```

### Writing AI-Friendly Tests

**Good Examples:**
- "Click the login button and verify successful login"
- "Fill username field with 'admin' and password with 'password123'"
- "Navigate to products page and add first item to cart"

**Avoid:**
- Vague descriptions like "test the page"
- Technical jargon like "click element with ID 'btn-login'"
- Complex scenarios without clear steps

---

## 📊 Reporting

### Allure Reports

TestGenius integrates with Allure Framework for beautiful test reports:

```bash
# Generate Allure report
npm run allure:generate

# Open Allure report
npm run allure:open

# Serve Allure report locally
npm run allure:serve

# Clean Allure results
npm run allure:clean
```

### HTML Reports

Legacy HTML reports are also available:

```bash
# Generate HTML report
npm start generate report

# Generate summary report
npm start generate report --summary

# Open report in browser
npm start open report
```

### Report Features

- 📈 **Test Statistics** - Pass/fail rates, duration trends
- 📸 **Screenshots** - Automatic screenshots on failure
- 🔍 **Step Details** - Detailed execution steps
- 🏷️ **Tag Filtering** - Filter by tags, priority, browser
- 📊 **Trends** - Historical test performance
- 🔗 **Integration** - CI/CD pipeline integration

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Module Not Found Errors

**Problem**: `Cannot find module` errors when running tests

**Solution**:
```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Ensure you're running compiled JS, not TS
node dist/tests/run-internet-tests.js
```

#### 2. OpenAI API Errors

**Problem**: `429 You exceeded your current quota` or API errors

**Solution**:
- Check your OpenAI API key in `.env`
- Verify API quota and billing
- Use fallback mode: `AI_FALLBACK_MODE=true`

#### 3. Browser Connection Issues

**Problem**: Browser fails to start or connect

**Solution**:
```bash
# Check browser installation
which google-chrome
which firefox

# Try different browser
npm start run test all --browser firefox

# Run in headed mode for debugging
npm start run test all --no-headless
```

#### 4. Element Not Found

**Problem**: AI can't find page elements

**Solution**:
- Improve test descriptions with specific element names
- Add explicit waits: `--timeout 10000`
- Use more descriptive element identifiers

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
DEBUG=true npm start run test all

# Check logs
tail -f logs/testgenius.log
```

### Performance Issues

**Slow Test Execution**:
- Use headless mode: `--headless`
- Reduce viewport size: `--viewport 1024x768`
- Enable parallel execution: `--parallel 2`

**Memory Issues**:
- Clean old results: `npm start cleanup results`
- Reduce parallel execution
- Restart browser between tests

---

## ❓ FAQ

### Q: Do I need a Selenium server?
**A**: No! TestGenius uses WebdriverIO's direct browser automation, eliminating the need for a standalone Selenium server.

### Q: How much does OpenAI API cost?
**A**: Costs depend on usage. GPT-4o is approximately $0.005 per 1K input tokens and $0.015 per 1K output tokens.

### Q: Can I use TestGenius without AI?
**A**: Yes, you can use the framework with traditional element locators, though AI provides significant benefits.

### Q: Which browsers are supported?
**A**: Chrome, Firefox, Safari, and Edge are supported. Chrome is recommended for best performance.

### Q: How do I integrate with CI/CD?
**A**: TestGenius works with any CI/CD platform. See the [CI/CD Integration Guide](ci-cd-integration.md).

### Q: Can I run tests in parallel?
**A**: Yes! Use the `--parallel` flag: `npm start run test all --parallel 3`

### Q: How do I handle dynamic content?
**A**: TestGenius AI automatically adapts to page changes and dynamic content using intelligent element detection.

### Q: What if AI fails to execute a test?
**A**: The framework includes fallback strategies and will attempt basic element interactions if AI fails.

---

## 📞 Support

### Getting Help

- 📧 **Email Support**: hirok.sarker@gmail.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/hiroksarker/testgenius-ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/hiroksarker/testgenius-ai/discussions)
- 📖 **Documentation**: This Wiki

### Before Asking for Help

1. ✅ Check this wiki for solutions
2. ✅ Search existing [issues](https://github.com/hiroksarker/testgenius-ai/issues)
3. ✅ Try the troubleshooting section above
4. ✅ Ensure you're using the latest version
5. ✅ Include error logs and configuration details

### Contributing

We welcome contributions! See the [Contributing Guide](contributing.md) for details.

---

## 📚 Additional Resources

- [API Reference](api-reference.md)
- [Best Practices](best-practices.md)
- [CI/CD Integration](ci-cd-integration.md)
- [Advanced Configuration](advanced-configuration.md)
- [Migration Guide](migration-guide.md)
- [Release Notes](release-notes.md)

---

**Need help? Contact hirok.sarker@gmail.com or create an issue on GitHub!**

---

*Last updated: December 2024* 