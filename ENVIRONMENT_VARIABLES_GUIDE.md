# TestGenius AI - Environment Variables Guide

## Overview

TestGenius AI uses environment variables to configure all aspects of test execution, making it easy to customize behavior for different environments and scenarios. Environment variables are loaded from a `.env` file and can be easily modified without changing code.

## Quick Setup

### 1. Create Environment File
```bash
# Run the setup script
npm run setup:env

# Or manually copy the example
cp env.example .env
```

### 2. Configure Your Settings
Edit the `.env` file to customize your test environment:
```bash
nano .env
```

### 3. Run Tests with Environment Variables
```bash
# All environment variables are automatically loaded
npm run test:internet:list
npm run test:internet:single INTERNET-001
```

## Environment Variable Categories

### 🔑 OpenAI Configuration
```bash
# Required for AI-powered test execution
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
AI_TEMPERATURE=0.1
AI_MAX_TOKENS=2000
AI_RETRY_ATTEMPTS=3
```

### 🌐 Browser Configuration
```bash
# Browser selection and behavior
DEFAULT_BROWSER=chrome
DEFAULT_HEADLESS=true
DEFAULT_VIEWPORT=1920x1080
BROWSER_WIDTH=1920
BROWSER_HEIGHT=1080
```

### ⚡ Test Execution Configuration
```bash
# Test execution settings
DEFAULT_TIMEOUT=30000
DEFAULT_WAIT_TIMEOUT=5000
PARALLEL_EXECUTION=1
RETRY_FAILED_TESTS=false
MAX_RETRIES=2
```

### 🔧 WebdriverIO Configuration
```bash
# Direct browser automation settings
WEBDRIVERIO_PROTOCOL=webdriver
WEBDRIVERIO_LOG_LEVEL=warn
WEBDRIVERIO_CONNECTION_RETRY_COUNT=3
WEBDRIVERIO_CONNECTION_RETRY_TIMEOUT=120000
```

### 📊 Reporting Configuration
```bash
# Report generation settings
REPORT_OUTPUT_DIR=reports
REPORT_RETENTION_DAYS=30
INCLUDE_SCREENSHOTS=true
INCLUDE_CONSOLE_LOGS=true
GENERATE_SUMMARY=true
SCREENSHOT_QUALITY=80
```

### 💾 Session Configuration
```bash
# Test session management
SESSION_DATA_DIR=test-results
SESSION_RETENTION_COUNT=10
SESSION_INCLUDE_SCREENSHOTS=true
SESSION_INCLUDE_PAGE_SOURCE=false
```

### 📝 Logging Configuration
```bash
# Logging behavior
ENABLE_DEBUG_LOGGING=false
INCLUDE_TIMESTAMPS=true
INCLUDE_TEST_ID=true
```

### 🌍 Environment Configuration
```bash
# Environment-specific settings
DEFAULT_ENVIRONMENT=staging
STAGING_BASE_URL=https://staging.example.com
PRODUCTION_BASE_URL=https://example.com
DEV_BASE_URL=http://localhost:3000
```

### 🌐 The Internet Testing Site Configuration
```bash
# The Internet site specific settings
THE_INTERNET_BASE_URL=https://the-internet.herokuapp.com
THE_INTERNET_USERNAME=tomsmith
THE_INTERNET_PASSWORD=SuperSecretPassword!
```

### ⚡ Performance Configuration
```bash
# Performance monitoring settings
ENABLE_PERFORMANCE_MONITORING=false
PERFORMANCE_THRESHOLD=5000
ENABLE_NETWORK_THROTTLING=false
NETWORK_THROTTLING_PRESET=Slow 3G
```

### 🔒 Security Configuration
```bash
# Security scanning settings
ENABLE_SECURITY_SCANNING=false
SECURITY_SCAN_TIMEOUT=30000
```

### 📧 Notification Configuration
```bash
# Notification settings
ENABLE_EMAIL_NOTIFICATIONS=false
EMAIL_RECIPIENT=test@example.com
ENABLE_SLACK_NOTIFICATIONS=false
SLACK_WEBHOOK_URL=your_slack_webhook_url_here
```

## Usage Examples

### Environment-Specific Configurations

#### Development Environment
```bash
# .env.development
DEFAULT_ENVIRONMENT=development
DEFAULT_HEADLESS=false
ENABLE_DEBUG_LOGGING=true
DEFAULT_TIMEOUT=20000
```

#### Staging Environment
```bash
# .env.staging
DEFAULT_ENVIRONMENT=staging
DEFAULT_HEADLESS=true
ENABLE_DEBUG_LOGGING=false
DEFAULT_TIMEOUT=30000
```

#### Production Environment
```bash
# .env.production
DEFAULT_ENVIRONMENT=production
DEFAULT_HEADLESS=true
ENABLE_DEBUG_LOGGING=false
DEFAULT_TIMEOUT=45000
ENABLE_PERFORMANCE_MONITORING=true
```

### Browser-Specific Configurations

#### Chrome Configuration
```bash
DEFAULT_BROWSER=chrome
DEFAULT_HEADLESS=true
DEFAULT_VIEWPORT=1920x1080
```

#### Firefox Configuration
```bash
DEFAULT_BROWSER=firefox
DEFAULT_HEADLESS=true
DEFAULT_VIEWPORT=1920x1080
```

#### Mobile Testing Configuration
```bash
DEFAULT_BROWSER=chrome
DEFAULT_VIEWPORT=375x667
BROWSER_WIDTH=375
BROWSER_HEIGHT=667
```

### Performance Testing Configuration
```bash
# Enable performance monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_THRESHOLD=3000

# Enable network throttling
ENABLE_NETWORK_THROTTLING=true
NETWORK_THROTTLING_PRESET=Slow 3G
```

### Debug Configuration
```bash
# Enable debug logging
ENABLE_DEBUG_LOGGING=true
WEBDRIVERIO_LOG_LEVEL=debug
INCLUDE_TIMESTAMPS=true
INCLUDE_TEST_ID=true
```

## Environment Variable Loading

### Automatic Loading
TestGenius AI automatically loads environment variables from:
1. `.env` file in the project root
2. System environment variables
3. Command line arguments (if provided)

### Loading Order
Environment variables are loaded in this priority order:
1. System environment variables (highest priority)
2. `.env` file variables
3. Default values (lowest priority)

### Configuration Access
Environment variables are accessible throughout the framework:
```typescript
// In any component
const config = await this.configManager.loadConfig();
const browser = config.browser.defaultBrowser;
const timeout = config.webdriverio.timeout;
```

## Best Practices

### 1. Security
- **Never commit `.env` files** to version control
- Use `.env.example` for documentation
- Store sensitive data in secure environment variables
- Use different API keys for different environments

### 2. Organization
- Group related variables together
- Use descriptive variable names
- Add comments to explain complex configurations
- Use consistent naming conventions

### 3. Environment Management
- Create separate `.env` files for different environments
- Use environment-specific configurations
- Validate required variables on startup
- Provide clear error messages for missing variables

### 4. Performance
- Set appropriate timeouts for your environment
- Configure parallel execution based on resources
- Enable performance monitoring in production
- Use headless mode for CI/CD environments

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loading
```bash
# Check if .env file exists
ls -la .env

# Verify file permissions
chmod 600 .env

# Check for syntax errors
cat .env
```

#### 2. Missing Required Variables
```bash
# Check required variables
grep "your_" .env

# Set OpenAI API key
export OPENAI_API_KEY=your_actual_api_key
```

#### 3. Configuration Not Applied
```bash
# Rebuild the project
npm run build

# Check configuration loading
npm run test:internet:list
```

#### 4. Browser Issues
```bash
# Check browser configuration
echo $DEFAULT_BROWSER
echo $DEFAULT_HEADLESS

# Try different browser settings
DEFAULT_BROWSER=firefox npm run test:internet:list
```

### Debug Mode
Enable debug logging to troubleshoot issues:
```bash
# Set debug environment variables
ENABLE_DEBUG_LOGGING=true
WEBDRIVERIO_LOG_LEVEL=debug

# Run tests with debug output
npm run test:internet:single INTERNET-001
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: TestGenius AI Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Setup environment
        run: npm run setup:env
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      
      - name: Build project
        run: npm run build
      
      - name: Run tests
        run: npm run test:internet
        env:
          DEFAULT_HEADLESS: true
          DEFAULT_TIMEOUT: 30000
```

### Docker Example
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Create .env file from environment variables
RUN echo "OPENAI_API_KEY=$OPENAI_API_KEY" > .env
RUN echo "DEFAULT_HEADLESS=true" >> .env
RUN echo "DEFAULT_TIMEOUT=30000" >> .env

CMD ["npm", "run", "test:internet"]
```

## Advanced Configuration

### Custom Environment Variables
You can add custom environment variables for your specific needs:
```bash
# Custom variables
CUSTOM_BASE_URL=https://myapp.com
CUSTOM_TIMEOUT=60000
CUSTOM_RETRY_COUNT=5
```

### Dynamic Configuration
Use environment variables to dynamically configure tests:
```typescript
// In test definitions
const test = {
  id: "CUSTOM-001",
  name: "Custom Test",
  site: process.env.CUSTOM_BASE_URL || "https://default.com",
  testData: {
    timeout: parseInt(process.env.CUSTOM_TIMEOUT) || 30000
  }
};
```

### Environment-Specific Test Data
```bash
# Development test data
DEV_TEST_USER=dev@example.com
DEV_TEST_PASSWORD=devpass123

# Staging test data
STAGING_TEST_USER=staging@example.com
STAGING_TEST_PASSWORD=stagingpass123

# Production test data
PROD_TEST_USER=prod@example.com
PROD_TEST_PASSWORD=prodpass123
```

## Conclusion

Environment variables provide a flexible and secure way to configure TestGenius AI for different environments and use cases. By following the best practices outlined in this guide, you can create robust, maintainable test configurations that work seamlessly across development, staging, and production environments.

---

**TestGenius AI** - Making AI-powered testing accessible and powerful! 🚀 