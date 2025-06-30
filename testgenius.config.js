module.exports = {
  "openai": {
    "model": "gpt-4o",
    "temperature": 0.1,
    "maxTokens": 2000,
    "retryAttempts": 3
  },
  "webdriverio": {
    "automationProtocol": "webdriver",
    "capabilities": {
      "browserName": "chrome",
      "goog:chromeOptions": {
        "args": [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-field-trial-config",
          "--disable-ipc-flooding-protection",
          "--start-maximized",
          "--disable-blink-features=AutomationControlled"
        ]
      }
    },
    "logLevel": "warn",
    "timeout": 30000,
    "waitforTimeout": 5000,
    "connectionRetryCount": 3,
    "connectionRetryTimeout": 120000
  },
  "browser": {
    "defaultBrowser": "chrome",
    "headless": false,
    "viewport": "1920x1080",
    "screenshotQuality": 80
  },
  "test": {
    "defaultEnvironment": "staging",
    "parallelExecution": 1,
    "retryFailedTests": false,
    "maxRetries": 2
  },
  "reporting": {
    "outputDir": "reports",
    "retentionDays": 30,
    "includeScreenshots": true,
    "includeConsoleLogs": true,
    "generateSummary": true
  },
  "session": {
    "dataDir": "test-results",
    "retentionCount": 10,
    "includeScreenshots": true,
    "includePageSource": false
  },
  "logging": {
    "level": "info",
    "includeTimestamps": true,
    "includeTestId": true
  },
  "environments": {
    "staging": {
      "baseUrl": process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
      "timeout": 30000
    },
    "production": {
      "baseUrl": process.env.PRODUCTION_BASE_URL || "https://the-internet.herokuapp.com",
      "timeout": 30000
    },
    "development": {
      "baseUrl": process.env.DEV_BASE_URL || "http://localhost:3000",
      "timeout": 30000
    }
  },
  "theInternet": {
    "baseUrl": process.env.THE_INTERNET_BASE_URL || "https://the-internet.herokuapp.com",
    "username": process.env.THE_INTERNET_USERNAME || "tomsmith",
    "password": process.env.THE_INTERNET_PASSWORD || "SuperSecretPassword!"
  },
  "performance": {
    "enabled": false,
    "threshold": 5000,
    "networkThrottling": false,
    "networkThrottlingPreset": "Slow 3G"
  },
  "security": {
    "enabled": false,
    "timeout": 30000
  },
  "notifications": {
    "email": {
      "enabled": false,
      "recipient": "test@example.com"
    },
    "slack": {
      "enabled": false,
      "webhookUrl": "your_slack_webhook_url_here"
    }
  },
  "costTracking": {
    "enabled": true
  }
};