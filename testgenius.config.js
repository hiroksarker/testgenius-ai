module.exports = {
  // OpenAI Configuration
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.1,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
    retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS) || 3
  },

  // WebdriverIO Configuration - Direct Browser Automation
  webdriverio: {
    // Use direct browser automation (no standalone server needed)
    automationProtocol: process.env.WEBDRIVERIO_PROTOCOL || 'webdriver',
    capabilities: {
      browserName: process.env.DEFAULT_BROWSER || 'chrome',
      'goog:chromeOptions': {
        args: [
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection',
          '--start-maximized',
          '--disable-blink-features=AutomationControlled'
        ]
      }
    },
    logLevel: process.env.WEBDRIVERIO_LOG_LEVEL || 'warn',
    timeout: parseInt(process.env.DEFAULT_TIMEOUT) || 30000,
    waitforTimeout: parseInt(process.env.DEFAULT_WAIT_TIMEOUT) || 5000,
    connectionRetryCount: parseInt(process.env.WEBDRIVERIO_CONNECTION_RETRY_COUNT) || 3,
    connectionRetryTimeout: parseInt(process.env.WEBDRIVERIO_CONNECTION_RETRY_TIMEOUT) || 120000
  },

  // Browser Configuration
  browser: {
    defaultBrowser: process.env.DEFAULT_BROWSER || 'chrome',
    headless: process.env.DEFAULT_HEADLESS === 'true',
    viewport: process.env.DEFAULT_VIEWPORT || '1920x1080',
    screenshotQuality: parseInt(process.env.SCREENSHOT_QUALITY) || 80
  },

  // Test Configuration
  test: {
    defaultEnvironment: process.env.DEFAULT_ENVIRONMENT || 'staging',
    parallelExecution: parseInt(process.env.PARALLEL_EXECUTION) || 1,
    retryFailedTests: process.env.RETRY_FAILED_TESTS === 'true',
    maxRetries: parseInt(process.env.MAX_RETRIES) || 2
  },

  // Reporting Configuration
  reporting: {
    outputDir: process.env.REPORT_OUTPUT_DIR || 'reports',
    retentionDays: parseInt(process.env.REPORT_RETENTION_DAYS) || 30,
    includeScreenshots: process.env.INCLUDE_SCREENSHOTS !== 'false',
    includeConsoleLogs: process.env.INCLUDE_CONSOLE_LOGS !== 'false',
    generateSummary: process.env.GENERATE_SUMMARY !== 'false'
  },

  // Session Configuration
  session: {
    dataDir: process.env.SESSION_DATA_DIR || 'test-results',
    retentionCount: parseInt(process.env.SESSION_RETENTION_COUNT) || 10,
    includeScreenshots: process.env.SESSION_INCLUDE_SCREENSHOTS !== 'false',
    includePageSource: process.env.SESSION_INCLUDE_PAGE_SOURCE === 'true'
  },

  // Logging Configuration
  logging: {
    level: process.env.ENABLE_DEBUG_LOGGING === 'true' ? 'debug' : 'info',
    includeTimestamps: process.env.INCLUDE_TIMESTAMPS !== 'false',
    includeTestId: process.env.INCLUDE_TEST_ID !== 'false'
  },

  // Environment-specific configurations
  environments: {
    staging: {
      baseUrl: process.env.STAGING_BASE_URL || 'https://staging.example.com',
      timeout: parseInt(process.env.DEFAULT_TIMEOUT) || 30000
    },
    production: {
      baseUrl: process.env.PRODUCTION_BASE_URL || 'https://example.com',
      timeout: parseInt(process.env.DEFAULT_TIMEOUT) || 45000
    },
    development: {
      baseUrl: process.env.DEV_BASE_URL || 'http://localhost:3000',
      timeout: parseInt(process.env.DEFAULT_TIMEOUT) || 20000
    }
  },

  // The Internet Testing Site Configuration
  theInternet: {
    baseUrl: process.env.THE_INTERNET_BASE_URL || 'https://the-internet.herokuapp.com',
    username: process.env.THE_INTERNET_USERNAME || 'tomsmith',
    password: process.env.THE_INTERNET_PASSWORD || 'SuperSecretPassword!'
  },

  // Performance Configuration
  performance: {
    enabled: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    threshold: parseInt(process.env.PERFORMANCE_THRESHOLD) || 5000,
    networkThrottling: process.env.ENABLE_NETWORK_THROTTLING === 'true',
    networkThrottlingPreset: process.env.NETWORK_THROTTLING_PRESET || 'Slow 3G'
  },

  // Security Configuration
  security: {
    enabled: process.env.ENABLE_SECURITY_SCANNING === 'true',
    timeout: parseInt(process.env.SECURITY_SCAN_TIMEOUT) || 30000
  },

  // Notification Configuration
  notifications: {
    email: {
      enabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      recipient: process.env.EMAIL_RECIPIENT || 'test@example.com'
    },
    slack: {
      enabled: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
      webhookUrl: process.env.SLACK_WEBHOOK_URL || ''
    }
  }
}; 