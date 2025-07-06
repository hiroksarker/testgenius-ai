# 🧠 Smart AI Testing Framework

**AI-powered, WebDriverIO-based, fully dynamic E2E testing with zero hardcoded steps.**

---

## What is This?

A next-generation, AI-driven end-to-end testing framework that uses OpenAI and WebDriverIO to:
- Dynamically interpret test instructions (no static parsing)
- Support async test case formats (with `setup`, `data`, and `task` functions)
- Leverage a Smart AI Agent for intelligent, context-aware automation
- Auto-generate and execute plans using natural language
- Provide beautiful, actionable reports

---

## ✨ Key Features

- **No static plans**: All test steps are dynamically generated and executed by AI
- **Async test case support**: Write tests as async functions for setup, data, and task
- **Smart AI Agent**: LangGraph-based, memory-persistent, tool-driven agent
- **WebDriverIO integration**: Modern browser automation, cross-browser support
- **Intelligent tools**: Navigation, click, fill, verify, wait, screenshot, and more
- **Cost tracking**: Real-time OpenAI usage and cost monitoring
- **Beautiful reporting**: HTML and Allure support
- **Backward compatible**: Old static test formats still work

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
**⚠️ IMPORTANT: OpenAI API Key Required**

Create a `.env` file in the project root:
```bash
cp env.example .env
```

Edit `.env` and add your OpenAI API key:
```bash
# Required: Your OpenAI API key for AI-powered test execution
OPENAI_API_KEY=your_actual_openai_api_key_here
```

**Alternative**: Set as environment variable:
```bash
export OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. Run the Demo
```bash
node tests/smart-ai-demo.js
```

---

## 📝 Writing Smart AI Tests

### Async, Dynamic Test Format

```js
// tests/smart-login-test.js
module.exports = {
  name: 'Smart Login Test',
  site: 'https://the-internet.herokuapp.com/login',

  setup: async () => ({
    env: 'production',
    timestamp: new Date().toISOString()
  }),

  data: async () => ({
    username: 'tomsmith',
    password: 'SuperSecretPassword!',
    expectedTitle: 'The Internet'
  }),

  task: async (data, setup) =>
    `Login to the application using username "${data.username}" and password "${data.password}", then verify the page title contains "${data.expectedTitle}"`
};
```

### Static (Legacy) Format

```js
module.exports = {
  name: 'Simple Login Test',
  site: 'https://the-internet.herokuapp.com/login',
  task: 'Navigate to login page, enter credentials, click login, verify dashboard access'
};
```

---

## 🤖 Example: Smart AI Demo

```js
const { TestRunner } = require('./dist/framework/core/TestRunner');
const { AITestExecutor } = require('./dist/framework/core/AITestExecutor');

const smartAITest = {
  name: 'Smart AI Demo Test',
  site: 'https://the-internet.herokuapp.com/login',
  setup: async () => ({ env: 'production' }),
  data: async () => ({ username: 'tomsmith', password: 'SuperSecretPassword!', expectedTitle: 'The Internet' }),
  task: async (data) => `Login to the application using username "${data.username}" and password "${data.password}", then verify the page title contains "${data.expectedTitle}"`
};

async function runSmartAIDemo() {
  const testRunner = new TestRunner();
  await testRunner.autoSetup();
  const result = await testRunner.runAutoTest(smartAITest);
  console.log(result);
}

if (require.main === module) runSmartAIDemo();
```

---

## 🛠️ Smart AI Tools

- **Navigation**: `smart_navigate`
- **Click**: `smart_click`
- **Fill**: `smart_fill`
- **Verify**: `smart_verify`
- **Wait**: `smart_wait`
- **Screenshot**: `smart_screenshot`
- **Get Content**: `smart_get_content`

All tools use schema validation and multiple detection strategies (CSS, XPath, text, etc).

---

## 🧠 How It Works

- **Test case** → Async functions for setup, data, and task
- **Smart AI Agent**:
  - Receives the task as natural language
  - Dynamically generates an execution plan
  - Selects and invokes tools (navigation, click, fill, etc)
  - Handles errors, retries, and context
  - Tracks cost and statistics
- **No static parsing**: Every run is fully dynamic and AI-driven

---

## 🖥️ CLI Commands

| Command | Description |
|---------|-------------|
| `node tests/smart-ai-demo.js` | Run the Smart AI demo test |
| `testgenius run` | Run all tests (if using CLI wrapper) |
| `testgenius list` | List all available tests |
| `testgenius report` | View test reports |

---

## 📊 Reporting & Cost Tracking

- **HTML and Allure reports** (with screenshots, step logs, and stats)
- **Real-time OpenAI token/cost tracking**
- **Execution statistics**: Success rate, tool usage, average response time

---

## 🧩 Configuration

### Environment Setup
The framework uses environment variables for configuration. Copy `env.example` to `.env` and customize:

```bash
cp env.example .env
```

**Required Variables:**
- `OPENAI_API_KEY` - Your OpenAI API key (required for AI functionality)

**Optional Variables:**
- `DEFAULT_BROWSER` - Browser to use (chrome, firefox, edge)
- `DEFAULT_HEADLESS` - Run in headless mode (true/false)
- `DEFAULT_TIMEOUT` - Test operation timeout (milliseconds)
- `AI_MODEL` - OpenAI model to use (default: gpt-4o)

### Framework Configuration
Edit `testgenius.config.js` for browser, headless mode, timeouts, reporting, and more.

---

## 🆘 Troubleshooting

### Common Issues

**❌ "OpenAI API key not found"**
- Ensure `.env` file exists with `OPENAI_API_KEY=your_key_here`
- Or set environment variable: `export OPENAI_API_KEY=your_key_here`
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

**❌ "WebDriverIO not found"**
```bash
npm install webdriverio
```

**❌ "Browser not launching"**
- Check browser installation (Chrome, Firefox, Edge)
- Verify WebDriverIO configuration in `testgenius.config.js`

**❌ "Tests failing with element not found"**
- Check if test site is accessible
- Verify element selectors in test cases
- Review browser console for JavaScript errors

### Getting Help
- See [WIKI_HOME.md](WIKI_HOME.md) for detailed documentation
- Check the project wiki for advanced guides

---

## 📚 Resources

- [WIKI_HOME.md](WIKI_HOME.md) — Full documentation and advanced guides
- [Smart AI Demo Test](tests/smart-ai-demo.js) — Example test file

---

## 📝 License

MIT

---

**Ready to revolutionize your testing? Try Smart AI Testing Framework today!**