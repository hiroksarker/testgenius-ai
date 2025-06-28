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
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 2000,
        retryAttempts: 3
      },
      webdriverio: {
        capabilities: {
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: ['--no-sandbox', '--disable-dev-shm-usage']
          }
        },
        logLevel: 'info',
        timeout: 10000,
        waitforTimeout: 10000
      },
      browser: {
        defaultBrowser: 'chrome',
        headless: false,
        viewport: '1920x1080',
        screenshotQuality: 80
      },
      test: {
        defaultEnvironment: 'default',
        parallelExecution: 1,
        retryFailedTests: true,
        maxRetries: 1
      },
      reporting: {
        outputDir: 'reports',
        retentionDays: 30,
        includeScreenshots: true,
        includeConsoleLogs: true,
        generateSummary: true
      },
      session: {
        dataDir: 'sessions',
        retentionCount: 10,
        includeScreenshots: true,
        includePageSource: false
      },
      logging: {
        level: 'info',
        includeTimestamps: true,
        includeTestId: true
      },
      environments: {
        default: {
          baseUrl: 'https://example.com',
          timeout: 10000
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
