# 🧠 TestGenius AI

**Simple E2E Testing Framework for QA Engineers**

TestGenius AI is designed for QA engineers who want powerful automation without complex setup. Record tests interactively, run them with AI assistance, and get beautiful reports—all with simple commands and a user-friendly structure.

---

## ⚡️ After Installation (npm users)

**You do NOT need to run any setup scripts after installing the npm package!**

- All setup is handled by:
  ```bash
  testgenius init
  ```
- This will create all necessary directories and a default config.
- You do **not** need to run `setup.sh`, `setup-env.sh`, or `setup-internet-tests.sh` for normal usage.
- If you want to use environment variables for advanced config, copy `env.example` to `.env` and edit as needed:
  ```bash
  cp env.example .env
  # Edit .env to add your OpenAI API key or other settings
  ```
- If you want to try the demo "internet" tests, you can optionally run:
  ```bash
  bash setup-internet-tests.sh
  ```
  (Not required for normal test writing/running)

---

## 🚀 Quick Start

### 1. Install
```bash
npm install testgenius-ai
```

### 2. Initialize Project
```bash
testgenius init
```
This automatically creates:
- `tests/` directory for your test files
- `reports/` directory for HTML reports
- `screenshots/` directory for test screenshots
- `testgenius.config.js` with default settings

### 3. Add Your Tests
**All test files must be placed in the `tests/` directory (or `src/tests/` if you prefer).**

#### Example: `tests/authentication-tests.js`
```js
module.exports = [
  {
    id: "AUTH-001",
    name: "Successful Login Test",
    description: "Test login functionality with valid credentials",
    priority: "High",
    tags: ["authentication", "login", "smoke"],
    site: "https://example.com/login",
    testData: {
      username: "testuser",
      password: "password123"
    },
    task: "Navigate to the login page, enter valid credentials, click login, and verify dashboard."
  },
  // ... more tests ...
];
```
**Important:**
- Export an **array** of test objects (not named exports or objects with keys)
- Each test must have a unique `id`

### 4. List Available Tests
```bash
testgenius list
```

### 5. Run a Test
```bash
testgenius run AUTH-001
```

### 6. View Results
```bash
testgenius report
```

---

## 📋 Essential Commands

| Command | Description |
|---------|-------------|
| `testgenius init` | Initialize project (first time setup) |
| `testgenius record` | Record a new test interactively |
| `testgenius run <test-id>` | Run a specific test |
| `testgenius run` | Run all tests |
| `testgenius list` | List all available tests |
| `testgenius report` | View test results |

---

## 🗂️ Test File Format
- All test files must be in `tests/` (or `src/tests/`)
- Each file must export an **array** of test definitions:

```js
module.exports = [
  {
    id: "MY-TEST-001",
    name: "My First Test",
    description: "A simple test example",
    priority: "Medium",
    tags: ["demo"],
    site: "https://example.com",
    testData: {},
    task: "Describe the test steps here"
  }
];
```

---

## ⚡ User Workflow (No Build/Dist Needed)
- **No need to build or compile**—just write tests in `tests/` and run them
- **No dist/**, **no src/**, **no complex setup** for QA users
- **No need to touch config unless you want to customize**
- **All CLI commands work from the project root**

---

## 🛠️ Troubleshooting

### Test Not Found?
- Make sure your test file is in `tests/` or `src/tests/`
- Make sure you export an **array** of test objects:
  ```js
  module.exports = [ { id: "...", ... } ];
  ```
- Each test must have a unique `id`
- Run `testgenius list` to see all available test IDs

### CLI Command Not Found? (PATH Issue)
If you see an error like:
```
zsh: command not found: testgenius
```
or
```
bash: testgenius: command not found
```
You need to add npm's global bin directory to your PATH.

1. Find your npm global bin path:
   ```bash
   npm bin -g
   ```
   Typical output: `/usr/local/bin` or `/Users/<your-username>/.npm-global/bin`

2. Add it to your shell config:
   - For **zsh** (`~/.zshrc`):
     ```bash
     export PATH="$PATH:$(npm bin -g)"
     ```
   - For **bash** (`~/.bashrc` or `~/.bash_profile`):
     ```bash
     export PATH="$PATH:$(npm bin -g)"
     ```
   Then run:
   ```bash
   source ~/.zshrc   # or source ~/.bashrc
   ```

3. Try again:
   ```bash
   testgenius --help
   ```

### Wrong Export Format?
❌ **Wrong:**
```js
module.exports = {
  TEST_1: { ... },
  TEST_2: { ... }
};
```
✅ **Right:**
```js
module.exports = [ { ... }, { ... } ];
```

### Still Not Working?
- Check for typos in your test file
- Make sure you are running commands from the project root
- If you see errors about missing selectors or elements, check your test site and selectors

---

## 🎯 Best Practices
- Keep each test file focused (e.g., `authentication-tests.js`, `internet-tests.js`)
- Use clear, unique `id` values for each test
- Use tags and priorities to organize tests
- Use the `testgenius record` command for interactive test creation

---

## 🎉 Why TestGenius?
- **QA-friendly**: No programming required, just write test objects
- **No build step**: Just write and run
- **Simple CLI**: `testgenius run <test-id>`
- **Beautiful HTML reports**: Auto-generated after every run
- **Auto-screenshots**: On failure for easy debugging

---

## 🆘 Getting Help
- Run `testgenius help` for CLI help
- See the [Wiki](https://github.com/hiroksarker/testgenius-ai/wiki) for more examples
- Open an [issue](https://github.com/hiroksarker/testgenius-ai/issues) for support

---

**Made with ❤️ for QA Engineers**