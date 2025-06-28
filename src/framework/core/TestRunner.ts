import { remote, Browser } from 'webdriverio';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { AITestExecutor } from './AITestExecutor';
import { TestSessionManager } from './TestSessionManager';
import { ConfigManager } from './ConfigManager';
import { Logger, LogLevel, LogConfig } from './Logger';
import { 
  TestDefinition, 
  TestResult, 
  TestRunOptions, 
  FrameworkConfig,
  TestSession,
  TestSuiteResult
} from '../../types';
import { ReportGenerator } from './ReportGenerator';
import { CleanupManager } from './CleanupManager';

export class TestRunner {
  private configManager: ConfigManager;
  private sessionManager: TestSessionManager;
  private aiExecutor: AITestExecutor;
  private reportGenerator: ReportGenerator;
  private cleanupManager: CleanupManager;
  private browser: Browser | null = null;
  private logger: Logger;
  private isInitialized: boolean = false;

  constructor(loggingOptions?: Partial<LogConfig>) {
    this.configManager = new ConfigManager();
    this.sessionManager = new TestSessionManager();
    this.aiExecutor = new AITestExecutor();
    this.reportGenerator = new ReportGenerator();
    this.cleanupManager = new CleanupManager();
    
    // Initialize logger with provided options or defaults
    this.logger = new Logger(loggingOptions);
  }

  // Auto-setup method for QA-friendly initialization
  async autoSetup(): Promise<void> {
    if (this.isInitialized) return;

    this.logger.info('🔧 Auto-setting up TestGenius...');

    try {
      // 1. Auto-create directories
      await this.createDirectories();
      
      // 2. Auto-create minimal config if not exists
      await this.createMinimalConfig();
      
      // 3. Auto-detect and validate dependencies
      await this.validateDependencies();
      
      this.isInitialized = true;
      this.logger.success('✅ TestGenius setup complete!');
      this.logger.info('📁 Created: tests/, reports/, screenshots/');
      this.logger.info('⚙️  Created: testgenius.config.js (if needed)');
      
    } catch (error) {
      this.logger.error('❌ Auto-setup failed:', (error as Error).message);
      throw error;
    }
  }

  private async createDirectories(): Promise<void> {
    const directories = ['tests', 'reports', 'screenshots'];
    
    for (const dir of directories) {
      try {
        await fs.ensureDir(dir);
        this.logger.debug(`✅ Created directory: ${dir}/`);
      } catch (error) {
        this.logger.warn(`⚠️  Could not create ${dir}/ directory:`, (error as Error).message);
      }
    }
  }

  private async createMinimalConfig(): Promise<void> {
    const configPath = path.join(process.cwd(), 'testgenius.config.js');
    
    if (await fs.pathExists(configPath)) {
      this.logger.debug('✅ Config file already exists');
      return;
    }

    const minimalConfig = `module.exports = {
  browser: 'chrome',
  headless: false,
  timeout: 10000,
  baseUrl: 'https://example.com',
  screenshotOnFailure: true,
  screenshotOnSuccess: false
};`;

    try {
      await fs.writeFile(configPath, minimalConfig);
      this.logger.info('⚙️  Created minimal testgenius.config.js');
    } catch (error) {
      this.logger.warn('⚠️  Could not create config file:', (error as Error).message);
    }
  }

  private async validateDependencies(): Promise<void> {
    try {
      // Check if WebDriverIO is available
      require('webdriverio');
      this.logger.debug('✅ WebDriverIO dependency found');
    } catch (error) {
      this.logger.warn('⚠️  WebDriverIO not found. Please run: npm install webdriverio');
    }

    // Check if browser drivers are available
    try {
      require('chromedriver');
      this.logger.debug('✅ ChromeDriver found');
    } catch (error) {
      this.logger.info('💡 ChromeDriver not found. Will use system browser.');
    }
  }

  async run(testId: string, options: TestRunOptions = {}): Promise<TestSuiteResult> {
    // Auto-setup if not initialized
    if (!this.isInitialized) {
      await this.autoSetup();
    }

    this.logger.info('🚀 Starting TestGenius Test Runner...');

    try {
      const config = await this.configManager.loadConfig();
      const tests = await this.findTests(testId, options, config);

      if (tests.length === 0) {
        this.logger.warn('⚠️  No tests found matching the criteria.');
        return {
          totalTests: 0,
          passed: 0,
          failed: 0,
          totalDuration: 0,
          successRate: 0,
          results: [],
          timestamp: new Date().toISOString()
        };
      }

      this.logger.info(`📋 Found ${tests.length} test(s) to run`);

      // Run tests
      const results: TestResult[] = [];
      let totalDuration = 0;
      let passedCount = 0;
      let failedCount = 0;

      // Initialize browser
      await this.initializeBrowser(options, config);

      // Run each test
      for (const test of tests) {
        this.logger.testStart(test.id, test.name);
        this.logger.info(`📝 Description: ${test.description}`);
        this.logger.info(`🌐 Site: ${test.site}`);
        this.logger.info(`🏷️  Tags: ${test.tags?.join(', ') || 'none'}`);
        this.logger.info(`⚡ Priority: ${test.priority}`);

        const startTime = Date.now();
        
        try {
          // Execute test
          const result = await this.runSingleTest(test, options, config);
          const duration = Date.now() - startTime;
          totalDuration += duration;

          // Create test result
          const testResult: TestResult = {
            id: test.id,
            testId: test.id,
            sessionId: `session-${Date.now()}`,
            startTime: new Date(),
            endTime: new Date(),
            status: result.success ? 'passed' : 'failed',
            steps: result.steps,
            screenshots: result.screenshots,
            errors: result.errors || [],
            duration,
            success: result.success
          };

          results.push(testResult);

          if (result.success) {
            passedCount++;
            this.logger.testSuccess(test.id, duration);
          } else {
            failedCount++;
            this.logger.testFailure(test.id, result.errors?.[0] || 'Unknown error', duration);
          }

          // Save session data
          await this.sessionManager.saveSession(testResult);
          this.logger.debug(`📁 Session saved for test ${test.id}`);

        } catch (error) {
          const duration = Date.now() - startTime;
          totalDuration += duration;
          failedCount++;

          this.logger.testFailure(test.id, (error as Error).message, duration);

          results.push({
            id: test.id,
            testId: test.id,
            sessionId: `session-${Date.now()}`,
            startTime: new Date(),
            endTime: new Date(),
            status: 'failed',
            steps: [],
            screenshots: [],
            errors: [(error as Error).message],
            duration,
            success: false
          });
        }
      }

      // Generate summary
      const summary: TestSuiteResult = {
        totalTests: tests.length,
        passed: passedCount,
        failed: failedCount,
        totalDuration,
        successRate: (passedCount / tests.length) * 100,
        results,
        timestamp: new Date().toISOString()
      };

      // Print summary
      this.printSummary(summary);

      // Generate simple HTML report
      await this.generateSimpleReport(summary);

      return summary;

    } catch (error) {
      this.logger.error('❌ Test execution failed:', (error as Error).message);
      throw error;
    } finally {
      // Clean up browser
      if (this.browser) {
        await this.browser.deleteSession();
        this.browser = null;
      }
    }
  }

  private async findTests(testId: string, options: TestRunOptions, config: FrameworkConfig & { testsDir?: string }): Promise<TestDefinition[]> {
    // Use config.testsDir if set, otherwise default to ['tests', 'src/tests']
    const testDirs = config.testsDir ? [config.testsDir] : ['tests', 'src/tests'];
    let tests: TestDefinition[] = [];
    
    // Handle file-based execution
    if (options.file) {
      // Single file execution
      const filePath = path.resolve(options.file);
      tests = await this.loadTestsFromFile(filePath);
      this.logger.info(`📁 Loading tests from single file: ${options.file}`);
    } else if (options.files && options.files.length > 0) {
      // Multiple files execution
      for (const file of options.files) {
        const filePath = path.resolve(file);
        const fileTests = await this.loadTestsFromFile(filePath);
        tests = tests.concat(fileTests);
      }
      this.logger.info(`📁 Loading tests from ${options.files.length} file(s): ${options.files.join(', ')}`);
    } else {
      // Directory-based execution (existing logic)
      for (const testDir of testDirs) {
        const fullPath = path.join(process.cwd(), testDir);
        
        if (await fs.pathExists(fullPath)) {
          try {
            const testFiles = await fs.readdir(fullPath);
            
            for (const file of testFiles) {
              // Skip excluded files
              if (options.excludeFiles && options.excludeFiles.some(excludeFile => 
                file.includes(excludeFile) || file === excludeFile
              )) {
                this.logger.debug(`⏭️  Skipping excluded file: ${file}`);
                continue;
              }
              
              if (file.endsWith('.js') || file.endsWith('.ts')) {
                const filePath = path.join(fullPath, file);
                const fileTests = await this.loadTestsFromFile(filePath);
                tests = tests.concat(fileTests);
              }
            }
            
            if (tests.length > 0) {
              this.logger.info(`📁 Found tests in ${testDir}/ directory`);
              break;
            }
          } catch (error) {
            this.logger.debug(`⚠️  Could not read ${testDir}/ directory:`, (error as Error).message);
          }
        }
      }
    }
    
    // Filter by testId if provided (single test execution)
    if (testId && testId !== '*' && testId !== 'all') {
      tests = tests.filter(test => test.id === testId || test.name === testId);
    }
    
    // Filter by specific test IDs if provided
    if (options.testIds && options.testIds.length > 0) {
      tests = tests.filter(test => options.testIds!.includes(test.id));
      this.logger.info(`🎯 Filtering to specific test IDs: ${options.testIds.join(', ')}`);
    }
    
    // Filter by tag if provided
    if (options.tag) {
      tests = tests.filter(test => test.tags && test.tags.includes(options.tag!));
      this.logger.info(`🏷️  Filtering by tag: ${options.tag}`);
    }
    
    // Filter by priority if provided
    if (options.priority) {
      tests = tests.filter(test => test.priority === options.priority);
      this.logger.info(`⚡ Filtering by priority: ${options.priority}`);
    }
    
    return tests;
  }

  private async loadTestsFromFile(filePath: string): Promise<TestDefinition[]> {
    try {
      if (!(await fs.pathExists(filePath))) {
        this.logger.warn(`⚠️  File not found: ${filePath}`);
        return [];
      }
      
      const testModule = require(filePath);
      const testDefinitions = testModule.default || testModule;
      
      if (Array.isArray(testDefinitions)) {
        this.logger.debug(`✅ Loaded ${testDefinitions.length} tests from ${filePath}`);
        return testDefinitions;
      } else if (testDefinitions && typeof testDefinitions === 'object') {
        this.logger.debug(`✅ Loaded 1 test from ${filePath}`);
        return [testDefinitions];
      } else {
        this.logger.warn(`⚠️  No valid test definitions found in ${filePath}`);
        return [];
      }
    } catch (error) {
      this.logger.warn(`⚠️  Could not load test file ${filePath}:`, (error as Error).message);
      return [];
    }
  }

  private async runSingleTest(
    test: TestDefinition, 
    options: TestRunOptions, 
    config: FrameworkConfig
  ): Promise<TestResult> {
    const sessionId = `${test.id}_${Date.now()}`;
    const sessionDir = path.join(process.cwd(), 'test-results', sessionId);
    
    await fs.ensureDir(sessionDir);

    console.log(chalk.cyan(`🎯 Running: ${test.id} - ${test.name}`));
    console.log(chalk.gray(`📝 Description: ${test.description}`));
    console.log(chalk.gray(`🌐 Site: ${test.site}`));
    console.log(chalk.gray(`🏷️  Tags: ${test.tags ? test.tags.join(', ') : 'None'}`));
    console.log(chalk.gray(`⚡ Priority: ${test.priority || 'Medium'}\n`));

    const session: TestSession = {
      testId: test.id,
      sessionId,
      startTime: new Date(),
      status: 'running',
      steps: [],
      screenshots: [],
      errors: []
    };

    let result: TestResult = { ...session, id: test.id, success: false };

    try {
      // Execute test with AI
      const executionResult = await this.aiExecutor.executeTest(test, options);
      
      result = {
        ...session,
        id: test.id,
        ...executionResult,
        status: executionResult.success ? 'passed' : 'failed',
        endTime: new Date(),
        duration: new Date().getTime() - session.startTime.getTime()
      };

      console.log(chalk.green(`✅ Test ${test.id} completed successfully!`));
      console.log(chalk.gray(`⏱️  Duration: ${result.duration}ms`));

    } catch (error) {
      console.error(chalk.red(`❌ Test ${test.id} failed:`), (error as Error).message);
      
      result = {
        ...session,
        id: test.id,
        status: 'failed',
        success: false,
        endTime: new Date(),
        duration: new Date().getTime() - session.startTime.getTime(),
        errors: [...session.errors, (error as Error).message]
      };

      // Take error screenshot
      if (this.browser) {
        try {
          const screenshotPath = path.join(sessionDir, 'error-screenshot.png');
          await this.browser.saveScreenshot(screenshotPath);
          result.screenshots.push(screenshotPath);
        } catch (screenshotError) {
          console.error(chalk.yellow('⚠️  Failed to capture error screenshot:'), (screenshotError as Error).message);
        }
      }

    } finally {
      // Clean up browser
      if (this.browser) {
        try {
          await this.browser.deleteSession();
          this.browser = null;
        } catch (error) {
          console.error(chalk.yellow('⚠️  Error closing browser:'), (error as Error).message);
        }
      }

      // Save session data
      await this.saveSessionData(sessionDir, result);
      
      console.log(chalk.gray(`📁 Session saved: ${sessionDir}\n`));
    }

    return result;
  }

  private async initializeBrowser(
    options: TestRunOptions, 
    config: FrameworkConfig
  ): Promise<void> {
    const capabilities: any = {
      browserName: options.browser || config.browser.defaultBrowser,
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
    };

    if (options.headless !== false) {
      capabilities['goog:chromeOptions'].args.push('--headless');
    }

    // Use WebdriverIO's direct browser automation (no standalone server needed)
    const wdioOptions = {
      automationProtocol: 'devtools' as const,
      capabilities,
      logLevel: config.webdriverio.logLevel as any,
      timeout: config.webdriverio.timeout,
      waitforTimeout: config.webdriverio.waitforTimeout,
      connectionRetryCount: config.webdriverio.connectionRetryCount || 3,
      connectionRetryTimeout: config.webdriverio.connectionRetryTimeout || 120000
    };

    console.log(chalk.blue('🌐 Initializing browser with direct automation...'));
    this.browser = await remote(wdioOptions);
    this.aiExecutor.setBrowser(this.browser);
  }

  private async saveSessionData(sessionDir: string, result: TestResult): Promise<void> {
    const sessionFile = path.join(sessionDir, 'session.json');
    await fs.writeJson(sessionFile, result, { spaces: 2 });
  }

  private printSummary(summary: TestSuiteResult): void {
    console.log(chalk.blue('\n📊 Test Execution Summary'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(`Total Tests: ${summary.totalTests}`));
    console.log(chalk.green(`✅ Passed: ${summary.passed}`));
    console.log(chalk.red(`❌ Failed: ${summary.failed}`));
    console.log(chalk.blue(`⏱️  Total Duration: ${summary.totalDuration}ms`));
    console.log(chalk.yellow(`📈 Success Rate: ${summary.successRate.toFixed(1)}%`));
    console.log(chalk.gray('─'.repeat(50)));
  }

  private async generateSimpleReport(summary: TestSuiteResult): Promise<void> {
    try {
      const reportDir = 'reports';
      await fs.ensureDir(reportDir);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = path.join(reportDir, `test-report-${timestamp}.html`);
      
      const htmlContent = this.generateHTMLReport(summary);
      await fs.writeFile(reportFile, htmlContent);
      
      this.logger.success(`📊 HTML report generated: ${reportFile}`);
      this.logger.info('🌐 Open the report in your browser to view detailed results');
      
    } catch (error) {
      this.logger.warn('⚠️  Could not generate HTML report:', (error as Error).message);
    }
  }

  private generateHTMLReport(summary: TestSuiteResult): string {
    const passedColor = '#28a745';
    const failedColor = '#dc3545';
    const successRate = summary.successRate;
    const statusColor = successRate >= 80 ? passedColor : successRate >= 60 ? '#ffc107' : failedColor;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TestGenius Report - ${new Date().toLocaleDateString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f8f9fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .card h3 { margin: 0 0 10px 0; color: #333; }
        .card .number { font-size: 2em; font-weight: bold; }
        .passed { color: ${passedColor}; }
        .failed { color: ${failedColor}; }
        .success-rate { color: ${statusColor}; }
        .test-results { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .test-item { border-left: 4px solid #ddd; padding: 15px; margin: 10px 0; background: #f8f9fa; border-radius: 0 5px 5px 0; }
        .test-item.passed { border-left-color: ${passedColor}; }
        .test-item.failed { border-left-color: ${failedColor}; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-duration { color: #666; font-size: 0.9em; }
        .test-error { color: ${failedColor}; margin-top: 10px; font-family: monospace; background: #f8f9fa; padding: 10px; border-radius: 5px; }
        .timestamp { color: #666; font-size: 0.9em; margin-top: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 TestGenius AI Report</h1>
        <p>Test execution completed on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Total Tests</h3>
            <div class="number">${summary.totalTests}</div>
        </div>
        <div class="card">
            <h3>Passed</h3>
            <div class="number passed">${summary.passed}</div>
        </div>
        <div class="card">
            <h3>Failed</h3>
            <div class="number failed">${summary.failed}</div>
        </div>
        <div class="card">
            <h3>Success Rate</h3>
            <div class="number success-rate">${summary.successRate.toFixed(1)}%</div>
        </div>
        <div class="card">
            <h3>Duration</h3>
            <div class="number">${summary.totalDuration}ms</div>
        </div>
    </div>
    
    <div class="test-results">
        <h2>Test Results</h2>
        ${summary.results.map(result => `
            <div class="test-item ${result.success ? 'passed' : 'failed'}">
                <div class="test-name">${result.testId}</div>
                <div class="test-duration">Duration: ${result.duration}ms | Status: ${result.status}</div>
                ${result.errors && result.errors.length > 0 ? `
                    <div class="test-error">
                        <strong>Error:</strong> ${result.errors[0]}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    
    <div class="timestamp">
        Generated by TestGenius AI on ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
  }

  getLogger(): Logger {
    return this.logger;
  }

  updateLoggingConfig(config: Partial<LogConfig>): void {
    this.logger.updateConfig(config);
  }

  async getLogFiles(): Promise<string[]> {
    return this.logger.getLogFiles();
  }

  async clearLogs(): Promise<void> {
    return this.logger.clearLogs();
  }
} 