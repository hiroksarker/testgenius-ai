import { FrameworkConfig } from '../../types';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';

export class ConfigManager {
  private config?: FrameworkConfig & { testsDir?: string };

  constructor() {
    dotenv.config();
  }

  async loadConfig(): Promise<FrameworkConfig & { testsDir?: string }> {
    if (!this.config) {
      // Try to load existing config
      const configPath = path.join(process.cwd(), 'testgenius.config.js');
      
      if (await fs.pathExists(configPath)) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const baseConfig = require(configPath);
          this.config = baseConfig.default || baseConfig;
        } catch (error) {
          console.warn('⚠️  Could not load config file, using defaults');
          this.config = this.getDefaultConfig();
        }
      } else {
        // Use default config if no config file exists
        this.config = this.getDefaultConfig();
      }
    }
    
    return this.config!;
  }

  private getDefaultConfig(): FrameworkConfig {
    return {
      openai: {
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
        maxTokens: parseInt(process.env.AI_MAX_TOKENS || '2000'),
        retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS || '3')
      },
      webdriverio: {
        automationProtocol: (process.env.WEBDRIVERIO_PROTOCOL || 'devtools') as 'devtools' | 'webdriver' | 'appium',
        capabilities: {
          browserName: process.env.DEFAULT_BROWSER || 'chrome',
          'goog:chromeOptions': {
            args: ['--no-sandbox', '--disable-dev-shm-usage']
          }
        },
        logLevel: process.env.WEBDRIVERIO_LOG_LEVEL || 'info',
        timeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
        waitforTimeout: parseInt(process.env.DEFAULT_WAIT_TIMEOUT || '10000'),
        connectionRetryCount: parseInt(process.env.WEBDRIVERIO_CONNECTION_RETRY_COUNT || '3'),
        connectionRetryTimeout: parseInt(process.env.WEBDRIVERIO_CONNECTION_RETRY_TIMEOUT || '120000')
      },
      browser: {
        defaultBrowser: process.env.DEFAULT_BROWSER || 'chrome',
        headless: process.env.DEFAULT_HEADLESS === 'true',
        viewport: process.env.DEFAULT_VIEWPORT || '1920x1080',
        screenshotQuality: parseInt(process.env.SCREENSHOT_QUALITY || '80')
      },
      test: {
        defaultEnvironment: process.env.DEFAULT_ENVIRONMENT || 'staging',
        parallelExecution: parseInt(process.env.PARALLEL_EXECUTION || '1'),
        retryFailedTests: process.env.RETRY_FAILED_TESTS === 'true',
        maxRetries: parseInt(process.env.MAX_RETRIES || '1')
      },
      reporting: {
        outputDir: process.env.REPORT_OUTPUT_DIR || 'reports',
        retentionDays: parseInt(process.env.REPORT_RETENTION_DAYS || '30'),
        includeScreenshots: process.env.INCLUDE_SCREENSHOTS !== 'false',
        includeConsoleLogs: process.env.INCLUDE_CONSOLE_LOGS !== 'false',
        generateSummary: process.env.GENERATE_SUMMARY !== 'false',
        allure: {
          enabled: false,
          resultsDir: 'allure-results',
          reportDir: 'allure-report',
          categories: undefined,
          environment: process.env.DEFAULT_ENVIRONMENT || 'staging',
          severity: 'normal',
          attachments: true
        }
      },
      session: {
        dataDir: process.env.SESSION_DATA_DIR || 'sessions',
        retentionCount: parseInt(process.env.SESSION_RETENTION_COUNT || '10'),
        includeScreenshots: process.env.SESSION_INCLUDE_SCREENSHOTS !== 'false',
        includePageSource: process.env.SESSION_INCLUDE_PAGE_SOURCE === 'true'
      },
      logging: {
        level: process.env.ENABLE_DEBUG_LOGGING === 'true' ? 'debug' : 'info',
        includeTimestamps: process.env.INCLUDE_TIMESTAMPS !== 'false',
        includeTestId: process.env.INCLUDE_TEST_ID !== 'false'
      },
      environments: {
        staging: {
          baseUrl: process.env.STAGING_BASE_URL || 'https://the-internet.herokuapp.com',
          timeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000')
        },
        production: {
          baseUrl: process.env.PRODUCTION_BASE_URL || 'https://the-internet.herokuapp.com',
          timeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000')
        },
        development: {
          baseUrl: process.env.DEV_BASE_URL || 'http://localhost:3000',
          timeout: parseInt(process.env.DEFAULT_TIMEOUT || '10000')
        }
      },
      costTracking: {
        enabled: true,
        currency: 'USD',
        modelPricing: {
          'gpt-4o': { inputCostPer1k: 0.005, outputCostPer1k: 0.015 },
          'gpt-4': { inputCostPer1k: 0.03, outputCostPer1k: 0.06 },
          'gpt-3.5-turbo': { inputCostPer1k: 0.0015, outputCostPer1k: 0.002 }
        },
        budgetAlerts: {
          enabled: true,
          dailyLimit: 10.0,
          monthlyLimit: 100.0
        },
        optimization: {
          enabled: true,
          suggestAlternativeModels: true,
          trackCostSavings: true
        }
      }
    };
  }

  getConfig(): FrameworkConfig & { testsDir?: string } {
    if (!this.config) {
      return this.getDefaultConfig();
    }
    return this.config;
  }

  // Simple method to update config
  updateConfig(updates: Partial<FrameworkConfig> & { testsDir?: string }): void {
    this.config = { ...this.getConfig(), ...updates };
  }

  // Save config to file
  async saveConfig(config: FrameworkConfig & { testsDir?: string }): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'testgenius.config.js');
      
      // Create config file content
      const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
      
      await fs.writeFile(configPath, configContent, 'utf8');
      console.log('✅ Configuration saved successfully');
      
      // Update internal config
      this.config = config;
    } catch (error) {
      console.error('❌ Failed to save configuration:', (error as Error).message);
      throw error;
    }
  }

  // Auto-detect project structure
  async detectProjectStructure(): Promise<{
    testsDir: string;
    reportsDir: string;
    screenshotsDir: string;
  }> {
    const possibleTestDirs = ['tests', 'src/tests'];
    const possibleReportDirs = ['reports', 'test-results', 'allure-report'];
    const possibleScreenshotDirs = ['screenshots', 'test-screenshots'];

    // Find existing directories or use defaults
    let testsDir = 'tests';
    let reportsDir = 'reports';
    let screenshotsDir = 'screenshots';

    for (const dir of possibleTestDirs) {
      if (await fs.pathExists(dir)) {
        testsDir = dir;
        break;
      }
    }

    for (const dir of possibleReportDirs) {
      if (await fs.pathExists(dir)) {
        reportsDir = dir;
        break;
      }
    }

    for (const dir of possibleScreenshotDirs) {
      if (await fs.pathExists(dir)) {
        screenshotsDir = dir;
        break;
      }
    }

    return { testsDir, reportsDir, screenshotsDir };
  }

  // Placeholder methods for backward compatibility
  async init(): Promise<void> {
    console.log('ConfigManager initialized with auto-detection');
  }
}
