# 🚀 TestGenius AI Quick Start Guide

Get up and running with TestGenius AI in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Modern web browser (Chrome, Firefox, Safari)

## Step 1: Setup

```bash
# Clone or download the project
cd endtoend_webdriverio

# Run the setup script
./setup.sh
```

## Step 2: Configure

Edit the `.env` file and add your OpenAI API key:

```bash
# Open .env file
nano .env

# Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Step 3: Start Selenium

```bash
# Start Selenium Standalone Server
selenium-standalone start
```

Keep this terminal running in the background.

## Step 4: Run Your First Test

Open a new terminal and run:

```bash
# Run a specific test
testgenius run test AUTH-001

# Or run all tests
testgenius run test all

# Or run tests by tag
testgenius run test --tag smoke
```

## Step 5: Create Your Own Tests

### Option A: Use the Interactive Recorder

```bash
testgenius run test-recorder
```

Follow the prompts to create tests interactively.

### Option B: Write Tests Manually

Create a new file in the `tests/` directory:

```javascript
// tests/my-test.js
export const MY_TEST = {
  id: "TEST-001",
  name: "My First Test",
  description: "A simple test example",
  priority: "High",
  tags: ["smoke", "example"],
  site: "https://example.com",
  testData: {
    searchTerm: "test"
  },
  task: "Navigate to the homepage, search for a term, and verify results appear"
};
```

## Step 6: Generate Reports

```bash
# Generate HTML report
testgenius generate report

# Open the report
testgenius open report
```

## Common Commands

```bash
# List all tests
testgenius list

# Run tests in Firefox
testgenius run test all --browser firefox

# Run tests in headed mode (see browser)
testgenius run test all --no-headless

# Run tests in parallel
testgenius run test all --parallel 3

# Clean up old results
testgenius cleanup results

# Get help
testgenius help
```

## Example Test Scenarios

### Login Test
```javascript
export const LOGIN_TEST = {
  id: "LOGIN-001",
  name: "User Login",
  priority: "High",
  tags: ["authentication", "smoke"],
  site: "https://your-app.com",
  testData: {
    email: "user@example.com",
    password: "password123"
  },
  task: "Navigate to login page, enter credentials, click login, verify dashboard loads"
};
```

### Search Test
```javascript
export const SEARCH_TEST = {
  id: "SEARCH-001",
  name: "Product Search",
  priority: "Medium",
  tags: ["search", "functionality"],
  site: "https://your-store.com",
  testData: {
    searchTerm: "laptop"
  },
  task: "Search for products, verify results display with prices and images"
};
```

## Troubleshooting

### Selenium Connection Issues
```bash
# Check if Selenium is running
curl http://localhost:4444/wd/hub/status

# Restart Selenium
pkill -f selenium
selenium-standalone start
```

### OpenAI API Issues
- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure you're using a supported model (gpt-4o recommended)

### Browser Issues
- Try different browsers: `--browser firefox` or `--browser safari`
- Run in headed mode: `--no-headless`
- Check browser drivers are installed

## Next Steps

1. **Explore the Framework**: Check out the `framework/` directory to understand the architecture
2. **Customize Configuration**: Edit `testgenius.config.js` for your needs
3. **Add More Tests**: Create comprehensive test suites for your application
4. **Integrate with CI/CD**: Add TestGenius to your build pipeline
5. **Join the Community**: Share your experiences and contribute!

## Need Help?

- Run `testgenius help` for command documentation
- Check the main README.md for detailed information
- Review example tests in the `tests/` directory
- Examine the framework code in `framework/` for advanced usage

Happy testing! 🧠✨ 