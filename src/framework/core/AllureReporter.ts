import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { TestResult, TestSuiteResult, FrameworkConfig } from '../../types';

export class AllureReporter {
  private config: FrameworkConfig;

  constructor(config: FrameworkConfig) {
    this.config = config;
  }

  async generateAllureReport(results: TestResult[]): Promise<void> {
    if (!this.config.reporting || !this.config.reporting.allure || !this.config.reporting.allure.enabled) {
      console.log(chalk.yellow('⚠️  Allure reporting is disabled in configuration'));
      return;
    }

    try {
      console.log(chalk.blue('📊 Generating Allure report...'));

      // Ensure Allure results directory exists with default fallback
      const resultsDir = this.config.reporting.allure.resultsDir || 'allure-results';
      await fs.ensureDir(resultsDir);

      // Generate Allure results for each test
      for (const result of results) {
        await this.generateAllureResult(result);
      }

      // Generate Allure report
      await this.generateAllureReportFromResults();

      console.log(chalk.green('✅ Allure report generated successfully!'));
      console.log(chalk.blue(`📁 Results: ${resultsDir}`));
      console.log(chalk.blue(`📊 Report: ${this.config.reporting.allure.reportDir || 'allure-report'}`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to generate Allure report:'), (error as Error).message);
    }
  }

  private async generateAllureResult(result: TestResult): Promise<void> {
    if (!this.config.reporting || !this.config.reporting.allure) return;
    const resultsDir = this.config.reporting.allure.resultsDir || 'allure-results';
    
    // Use Allure's expected file naming convention
    const resultFile = path.join(resultsDir, `${result.id}-result.json`);

    const allureResult = {
      name: result.testId,
      fullName: `${result.testId} - ${result.testId}`,
      status: result.success ? 'passed' : 'failed',
      statusDetails: {
        message: result.errors?.join(', ') || '',
        trace: result.errors?.join('\n') || ''
      },
      start: result.startTime.getTime(),
      stop: result.endTime?.getTime() || Date.now(),
      duration: result.duration || 0,
      description: `Test execution for ${result.testId}`,
      descriptionHtml: `<p>Test execution for ${result.testId}</p>`,
      links: [],
      labels: [
        { name: 'testId', value: result.testId },
        { name: 'sessionId', value: result.sessionId },
        { name: 'browser', value: result.browser || 'chrome' },
        { name: 'severity', value: this.config.reporting.allure.severity || 'normal' },
        { name: 'environment', value: this.config.reporting.allure.environment || 'default' },
        { name: 'framework', value: 'testgenius' },
        { name: 'language', value: 'javascript' }
      ],
      parameters: [],
      steps: result.steps?.map((step, index) => ({
        name: step.description,
        status: step.status === 'success' ? 'passed' : 'failed',
        start: result.startTime.getTime() + (index * 1000),
        stop: result.startTime.getTime() + ((index + 1) * 1000)
      })) || []
    };

    // Add screenshots as separate steps if enabled
    if (this.config.reporting.allure.attachments && result.screenshots.length > 0) {
      for (const screenshot of result.screenshots) {
        if (await fs.pathExists(screenshot)) {
          const attachmentName = path.basename(screenshot);
          const attachmentPath = path.join(resultsDir, attachmentName);
          await fs.copy(screenshot, attachmentPath);
          
          allureResult.steps.push({
            name: `Screenshot captured: ${attachmentName}`,
            status: 'passed',
            start: result.startTime.getTime(),
            stop: result.startTime.getTime() + 1000
          });
        }
      }
    }

    await fs.writeJson(resultFile, allureResult, { spaces: 2 });
  }

  private async generateAllureReportFromResults(): Promise<void> {
    if (!this.config.reporting || !this.config.reporting.allure) return;
    const resultsDir = this.config.reporting.allure.resultsDir || 'allure-results';
    const reportDir = this.config.reporting.allure.reportDir || 'allure-report';

    // Ensure report directory exists
    await fs.ensureDir(reportDir);

    try {
      // Run Allure command to generate report
      const command = `npx allure generate "${resultsDir}" --clean --output "${reportDir}"`;
      execSync(command, { stdio: 'pipe' });
    } catch (error) {
      console.error(chalk.red('❌ Allure command failed:'), (error as Error).message);
      throw error;
    }
  }

  async openAllureReport(): Promise<void> {
    if (!this.config.reporting || !this.config.reporting.allure || !this.config.reporting.allure.enabled) {
      console.log(chalk.yellow('⚠️  Allure reporting is disabled in configuration'));
      return;
    }

    const reportDir = this.config.reporting.allure.reportDir || 'allure-report';
    
    if (!(await fs.pathExists(reportDir))) {
      console.log(chalk.yellow('⚠️  Allure report not found. Run tests first with --allure option.'));
      return;
    }

    try {
      console.log(chalk.blue('🌐 Opening Allure report...'));
      
      // Open Allure report in browser
      const { default: open } = await import('open');
      const indexFile = path.join(reportDir, 'index.html');
      
      if (await fs.pathExists(indexFile)) {
        await open(indexFile);
        console.log(chalk.green('✅ Allure report opened in browser!'));
      } else {
        console.log(chalk.yellow('⚠️  Allure report index.html not found'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to open Allure report:'), (error as Error).message);
    }
  }

  async serveAllureReport(port: number = 8080): Promise<void> {
    if (!this.config.reporting || !this.config.reporting.allure || !this.config.reporting.allure.enabled) {
      console.log(chalk.yellow('⚠️  Allure reporting is disabled in configuration'));
      return;
    }

    const reportDir = this.config.reporting.allure.reportDir || 'allure-report';
    
    if (!(await fs.pathExists(reportDir))) {
      console.log(chalk.yellow('⚠️  Allure report not found. Run tests first with --allure option.'));
      return;
    }

    try {
      console.log(chalk.blue(`🌐 Serving Allure report on port ${port}...`));
      
      // Serve Allure report
      const command = `npx allure open --port ${port} "${reportDir}"`;
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('❌ Failed to serve Allure report:'), (error as Error).message);
    }
  }

  async serveAllureLive(): Promise<void> {
    if (!this.config.reporting || !this.config.reporting.allure || !this.config.reporting.allure.enabled) {
      console.log(chalk.yellow('⚠️  Allure reporting is disabled in configuration'));
      return;
    }
    const resultsDir = this.config.reporting.allure.resultsDir || 'allure-results';
    try {
      console.log(chalk.blue('🌐 Serving Allure report live (npx allure serve)...'));
      const { spawn } = require('child_process');
      const serve = spawn('npx', ['allure', 'serve', resultsDir], { stdio: 'inherit' });
      serve.on('close', (code: number) => {
        if (code !== 0) {
          console.error(chalk.red(`❌ Allure serve exited with code ${code}`));
        }
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to serve Allure report live:'), (error as Error).message);
    }
  }
} 