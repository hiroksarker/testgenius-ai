import { remote, Browser } from 'webdriverio';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import moment from 'moment';
import { AITestExecutor } from './AITestExecutor';
import { TestSessionManager } from './TestSessionManager';
import { ConfigManager } from './ConfigManager';
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
  private allureResultsDir: string = 'allure-results';

  constructor() {
    this.configManager = new ConfigManager();
    this.sessionManager = new TestSessionManager();
    this.aiExecutor = new AITestExecutor();
    this.reportGenerator = new ReportGenerator();
    this.cleanupManager = new CleanupManager();
    
    // Ensure Allure results directory exists
    fs.ensureDirSync(this.allureResultsDir);
  }

  async run(testId: string, options: TestRunOptions = {}): Promise<TestSuiteResult> {
    console.log(chalk.blue('🚀 Starting TestGenius Test Runner...\n'));

    try {
      const config = await this.configManager.loadConfig();
      const tests = await this.findTests(testId, options, config);

      if (tests.length === 0) {
        console.log(chalk.yellow('⚠️  No tests found matching the criteria.'));
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

      console.log(chalk.cyan(`📋 Found ${tests.length} test(s) to run\n`));

      // Run tests
      const results: TestResult[] = [];
      let totalDuration = 0;
      let passedCount = 0;
      let failedCount = 0;

      // Initialize browser
      await this.initializeBrowser(options, config);

      // Run each test
      for (const test of tests) {
        console.log(chalk.cyan(`\n🎯 Running: ${test.id} - ${test.name}`));
        console.log(chalk.gray(`📝 Description: ${test.description}`));
        console.log(chalk.gray(`🌐 Site: ${test.site}`));
        console.log(chalk.gray(`🏷️  Tags: ${test.tags?.join(', ') || 'none'}`));
        console.log(chalk.gray(`⚡ Priority: ${test.priority}\n`));

        const startTime = Date.now();
        
        try {
          // Start Allure test
          this.startAllureTest(test);
          
          // Execute test
          const result = await this.runSingleTest(test, options, config);
          const duration = Date.now() - startTime;
          totalDuration += duration;

          // Add screenshots to Allure
          if (result.screenshots && result.screenshots.length > 0) {
            result.screenshots.forEach((screenshot, index) => {
              this.addAllureScreenshot(`Screenshot ${index + 1}`, screenshot);
            });
          }

          // End Allure test
          this.endAllureTest(result.success ? 'passed' : 'failed', result.errors?.[0] ? new Error(result.errors[0]) : undefined);

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
            console.log(chalk.green(`✅ Test ${test.id} completed successfully!`));
          } else {
            failedCount++;
            console.log(chalk.red(`❌ Test ${test.id} failed!`));
          }

          console.log(chalk.gray(`⏱️  Duration: ${duration}ms`));

          // Save session data
          await this.sessionManager.saveSession(testResult);
          console.log(chalk.gray(`📁 Session saved for test ${test.id}\n`));

        } catch (error) {
          const duration = Date.now() - startTime;
          totalDuration += duration;
          failedCount++;

          // End Allure test with error
          this.endAllureTest('broken', error as Error);

          console.log(chalk.red(`❌ Test ${test.id} failed with error: ${(error as Error).message}`));
          console.log(chalk.gray(`⏱️  Duration: ${duration}ms\n`));

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

      // Generate Allure report
      await this.generateAllureReport();

      return summary;

    } catch (error) {
      console.error(chalk.red('❌ Test execution failed:'), (error as Error).message);
      throw error;
    } finally {
      // Clean up browser
      if (this.browser) {
        await this.browser.deleteSession();
        this.browser = null;
      }
    }
  }

  private async findTests(testId: string, options: TestRunOptions, config: FrameworkConfig): Promise<TestDefinition[]> {
    // Load tests from the compiled tests directory
    const testsDir = path.join(process.cwd(), 'dist', 'tests');
    const testFiles = await fs.readdir(testsDir);
    
    const tests: TestDefinition[] = [];
    
    for (const file of testFiles) {
      if (file.endsWith('.js') && file !== 'run-internet-tests.js') {
        try {
          const testModule = require(path.join(testsDir, file));
          
          // Look for exported test definitions
          Object.keys(testModule).forEach(key => {
            const test = testModule[key];
            if (test && typeof test === 'object' && test.id && test.name) {
              // Filter by test ID if specified
              if (testId === 'all' || test.id === testId || test.id.includes(testId)) {
                // Filter by tag if specified
                if (!options.tag || test.tags?.includes(options.tag)) {
                  // Filter by priority if specified
                  if (!options.priority || test.priority === options.priority) {
                    tests.push(test);
                  }
                }
              }
            }
          });
        } catch (error) {
          console.warn(`Warning: Could not load test file ${file}: ${error}`);
        }
      }
    }
    
    return tests;
  }

  private async runSingleTest(
    test: TestDefinition, 
    options: TestRunOptions, 
    config: FrameworkConfig
  ): Promise<TestResult> {
    const sessionId = `${test.id}_${moment().format('YYYYMMDD_HHmmss')}`;
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
          '--disable-ipc-flooding-protection'
        ]
      }
    };

    if (options.headless !== false) {
      capabilities['goog:chromeOptions'].args.push('--headless');
    }

    // Use WebdriverIO's direct browser automation (no standalone server needed)
    const wdioOptions = {
      automationProtocol: 'webdriver' as const,
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

  private startAllureTest(test: TestDefinition): void {
    // Create Allure test metadata file
    const testId = `testgenius-${test.id}-${Date.now()}`;
    const allureTest = {
      name: test.name,
      description: test.description,
      fullName: `${test.id}: ${test.name}`,
      labels: [
        { name: 'testId', value: test.id },
        { name: 'priority', value: test.priority },
        { name: 'site', value: test.site },
        ...(test.tags?.map(tag => ({ name: 'tag', value: tag })) || [])
      ],
      parameters: test.testData ? Object.entries(test.testData).map(([key, value]) => ({
        name: key,
        value: String(value)
      })) : []
    };

    const testFile = path.join(this.allureResultsDir, `${testId}-result.json`);
    fs.writeJsonSync(testFile, allureTest);
  }

  private endAllureTest(status: 'passed' | 'failed' | 'broken', error?: Error): void {
    // Update test result with status
    const testFiles = fs.readdirSync(this.allureResultsDir).filter(f => f.endsWith('-result.json'));
    if (testFiles.length > 0) {
      const latestTestFile = path.join(this.allureResultsDir, testFiles[testFiles.length - 1]);
      const testData = fs.readJsonSync(latestTestFile);
      
      testData.status = status;
      if (error) {
        testData.statusDetails = {
          message: error.message,
          trace: error.stack
        };
      }
      
      fs.writeJsonSync(latestTestFile, testData);
    }
  }

  private addAllureScreenshot(name: string, screenshotPath: string): void {
    if (!fs.existsSync(screenshotPath)) return;

    try {
      const attachmentId = `screenshot-${Date.now()}`;
      const attachmentFile = path.join(this.allureResultsDir, `${attachmentId}-attachment.json`);
      
      const attachment = {
        name,
        type: 'image/png',
        source: fs.readFileSync(screenshotPath).toString('base64')
      };
      
      fs.writeJsonSync(attachmentFile, attachment);
    } catch (error) {
      console.warn(`Failed to add Allure screenshot ${screenshotPath}:`, error);
    }
  }

  private async generateAllureReport(): Promise<void> {
    try {
      console.log(chalk.blue('\n📊 Generating Allure report...'));
      
      const { execSync } = require('child_process');
      execSync(`npx allure generate ${this.allureResultsDir} --clean --output allure-report`, {
        stdio: 'inherit'
      });
      
      console.log(chalk.green('✅ Allure report generated: allure-report/'));
      console.log(chalk.blue('🌐 To open the report, run: npx allure open allure-report'));
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate Allure report:'), error);
    }
  }

  private printSummary(summary: TestSuiteResult): void {
    console.log(chalk.blue('\n📊 Test Execution Summary'));
    console.log(chalk.blue('══════════════════════════════════════════════════'));
    console.log(chalk.white(`Total Tests: ${summary.totalTests}`));
    console.log(chalk.green(`Passed: ${summary.passed}`));
    console.log(chalk.red(`Failed: ${summary.failed}`));
    console.log(chalk.white(`Total Duration: ${summary.totalDuration}ms`));
    console.log(chalk.white(`Success Rate: ${summary.successRate.toFixed(1)}%`));
    console.log(chalk.blue('══════════════════════════════════════════════════\n'));

    if (summary.failed > 0) {
      console.log(chalk.red('❌ Failed Tests:'));
      summary.results
        .filter(r => r.status === 'failed')
        .forEach(result => {
          console.log(chalk.red(`  - ${result.id}: ${result.errors?.[0] || 'Unknown error'}`));
        });
      console.log();
    }

    console.log(chalk.green('✅ Test execution completed!'));
  }
} 