# 🧠 TestGenius AI

<div align="center">

![TestGenius AI](https://img.shields.io/badge/TestGenius-AI%20Powered-blue?style=for-the-badge&logo=robot)
![Version](https://img.shields.io/npm/v/testgenius-ai?style=for-the-badge)
![Downloads](https://img.shields.io/npm/dm/testgenius-ai?style=for-the-badge)
![License](https://img.shields.io/npm/l/testgenius-ai?style=for-the-badge)

**🚀 The Ultimate E2E Testing Framework for QA Engineers**

*No coding required • AI-powered automation • Beautiful reports • Zero complexity*

[![Install](https://img.shields.io/badge/Install%20Now-npm%20install%20-g%20testgenius--ai-brightgreen?style=for-the-badge)](https://www.npmjs.com/package/testgenius-ai)

</div>

---

## ✨ What Makes TestGenius Special?

| 🎯 **For QA Engineers** | 🚀 **For Developers** | 🎨 **For Everyone** |
|------------------------|----------------------|-------------------|
| • **No programming skills needed** | • **TypeScript support** | • **Beautiful HTML reports** |
| • **Interactive test recording** | • **Flexible configuration** | • **Auto-screenshots on failure** |
| • **Simple test objects** | • **Extensible framework** | • **Cross-platform support** |
| • **One-command setup** | • **Custom test runners** | • **Zero dependencies** |

---

## 🎬 See It In Action

<div align="center">

### 📋 List Your Tests
```bash
testgenius list
```
![Test Listing](https://via.placeholder.com/600x200/4CAF50/FFFFFF?text=📋+List+All+Tests)

### 🚀 Run Tests
```bash
testgenius run AUTH-001
```
![Test Running](https://via.placeholder.com/600x200/2196F3/FFFFFF?text=🚀+Run+Tests+with+AI)

### 📊 View Reports
```bash
testgenius report
```
![Test Reports](https://via.placeholder.com/600x200/FF9800/FFFFFF?text=📊+Beautiful+HTML+Reports)

</div>

---

## 🚀 Quick Start (3 Steps)

### 1️⃣ **Install**
```bash
npm install -g testgenius-ai
```

### 2️⃣ **Initialize**
```bash
testgenius init
```
*Creates everything you need automatically!*

### 3️⃣ **Start Testing**
```bash
testgenius record    # Record a new test
testgenius run       # Run all tests
testgenius report    # View results
```

---

## 📝 Writing Tests (Super Simple!)

### 🎯 **Test File Structure**
Create files in `tests/` directory:

```javascript
// tests/login-tests.js
module.exports = [
  {
    id: "LOGIN-001",
    name: "Successful Login Test",
    description: "Test login with valid credentials",
    priority: "High",
    tags: ["authentication", "login", "smoke"],
    site: "https://example.com/login",
    testData: {
      username: "testuser@example.com",
      password: "securepassword123"
    },
    task: "Navigate to login page, enter credentials, click login, verify dashboard access"
  },
  {
    id: "LOGIN-002", 
    name: "Failed Login Test",
    description: "Test login with invalid credentials",
    priority: "Medium",
    tags: ["authentication", "login", "validation"],
    site: "https://example.com/login",
    testData: {
      username: "invalid@example.com",
      password: "wrongpassword"
    },
    task: "Navigate to login page, enter invalid credentials, verify error message appears"
  }
];
```

### 🎬 **Interactive Test Recording**
Don't want to write tests manually? Use the recorder!

```bash
testgenius record
```

Follow the prompts and TestGenius will create your test automatically!

---

## 🛠️ Essential Commands

| Command | What It Does | Example |
|---------|-------------|---------|
| `testgenius init` | 🚀 Setup your project | `testgenius init` |
| `testgenius record` | 🎬 Record a new test | `testgenius record` |
| `testgenius list` | 📋 Show all tests | `testgenius list` |
| `testgenius run` | 🚀 Run all tests | `testgenius run` |
| `testgenius run <id>` | 🎯 Run specific test | `testgenius run LOGIN-001` |
| `testgenius report` | 📊 View results | `testgenius report` |

---

## 🎨 Test Examples

### 🔐 **Authentication Tests**
```javascript
// tests/auth-tests.js
module.exports = [
  {
    id: "AUTH-001",
    name: "User Registration",
    priority: "High",
    tags: ["registration", "signup"],
    site: "https://myapp.com/register",
    testData: {
      email: "newuser@example.com",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!"
    },
    task: "Fill registration form, submit, verify welcome message"
  }
];
```

### 🛒 **E-commerce Tests**
```javascript
// tests/ecommerce-tests.js
module.exports = [
  {
    id: "ECOMM-001",
    name: "Add to Cart",
    priority: "High", 
    tags: ["cart", "purchase"],
    site: "https://shop.example.com",
    testData: {
      productName: "Test Product",
      quantity: "2"
    },
    task: "Search for product, add to cart, verify cart count increases"
  }
];
```

### 📱 **Mobile/Responsive Tests**
```javascript
// tests/mobile-tests.js
module.exports = [
  {
    id: "MOBILE-001",
    name: "Mobile Menu Navigation",
    priority: "Medium",
    tags: ["mobile", "responsive"],
    site: "https://example.com",
    testData: {},
    task: "Open mobile menu, navigate through items, verify smooth transitions"
  }
];
```

---

## 🎯 Advanced Features

### 🤖 **AI-Powered Test Execution**
- **Smart element detection**
- **Automatic retry logic**
- **Intelligent error handling**
- **Context-aware actions**

### 📊 **Beautiful Reporting**
- **HTML reports with screenshots**
- **Test execution timeline**
- **Pass/fail statistics**
- **Performance metrics**

### 🔧 **Flexible Configuration**
```javascript
// testgenius.config.js
module.exports = {
  browser: 'chrome',           // chrome, firefox, safari, edge
  headless: false,             // true for CI/CD
  timeout: 30000,              // 30 seconds
  screenshotOnFailure: true,   // Auto-screenshots
  reportPath: './reports',     // Custom report location
  logLevel: 'info'             // debug, info, warn, error
};
```

---

## 🚨 Troubleshooting

### ❌ **"Command not found: testgenius"**
**Solution:** Add npm global bin to your PATH

**For macOS/Linux:**
```bash
# Find your npm global path
npm bin -g

# Add to your shell config (~/.zshrc or ~/.bashrc)
export PATH="$PATH:$(npm bin -g)"

# Reload shell
source ~/.zshrc  # or source ~/.bashrc
```

**For Windows:**
```cmd
# Add to PATH environment variable
%APPDATA%\npm
```

### ❌ **"Test not found"**
**Check:**
- ✅ Test file is in `tests/` directory
- ✅ Export format is correct: `module.exports = [ {...} ]`
- ✅ Test ID is unique
- ✅ Run `testgenius list` to see all available tests

### ❌ **"Wrong export format"**
**❌ Wrong:**
```javascript
module.exports = {
  TEST_1: { id: "TEST-1", ... },
  TEST_2: { id: "TEST-2", ... }
};
```

**✅ Correct:**
```javascript
module.exports = [
  { id: "TEST-1", ... },
  { id: "TEST-2", ... }
];
```

---

## 🎉 Success Stories

> *"TestGenius made our QA process 10x faster. No more complex Selenium setup!"*
> — **Sarah, Senior QA Engineer**

> *"Finally, a testing tool that doesn't require a computer science degree!"*
> — **Mike, QA Lead**

> *"The interactive recorder is a game-changer for our team."*
> — **Lisa, Test Automation Specialist**

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **🐛 Report bugs** - [Create an issue](https://github.com/hiroksarker/testgenius-ai/issues)
2. **💡 Suggest features** - [Start a discussion](https://github.com/hiroksarker/testgenius-ai/discussions)
3. **📝 Improve docs** - Submit a pull request
4. **⭐ Star the repo** - Show your support!

---

## 📚 Resources

- 📖 **[Wiki](https://github.com/hiroksarker/testgenius-ai/wiki)** - Detailed guides and examples
- 🎥 **[Video Tutorials](https://github.com/hiroksarker/testgenius-ai/wiki/Tutorials)** - Step-by-step videos
- 💬 **[Community](https://github.com/hiroksarker/testgenius-ai/discussions)** - Ask questions and share tips
- 🐛 **[Issues](https://github.com/hiroksarker/testgenius-ai/issues)** - Report bugs and request features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ for QA Engineers Worldwide**

[![GitHub stars](https://img.shields.io/github/stars/hiroksarker/testgenius-ai?style=social)](https://github.com/hiroksarker/testgenius-ai)
[![GitHub forks](https://img.shields.io/github/forks/hiroksarker/testgenius-ai?style=social)](https://github.com/hiroksarker/testgenius-ai)
[![GitHub issues](https://img.shields.io/github/issues/hiroksarker/testgenius-ai)](https://github.com/hiroksarker/testgenius-ai/issues)

**Ready to revolutionize your testing?**  
[Get Started Now →](https://www.npmjs.com/package/testgenius-ai)

</div>