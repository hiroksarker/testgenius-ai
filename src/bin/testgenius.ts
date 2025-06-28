#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { TestRunner } from '../framework/core/TestRunner';
import { TestRecorder } from '../framework/core/TestRecorder';
import { TestLister } from '../framework/core/TestLister';
import { ProjectInitializer } from '../framework/core/ProjectInitializer';
import { Logger, LogLevel } from '../framework/core/Logger';
import { readFileSync } from 'fs';
import path from 'path';

// Dynamically get version from package.json
const pkg = JSON.parse(
  readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
);
const version = pkg.version;

const program = new Command();

// Set up the CLI
program
  .name('testgenius')
  .description('🚀 TestGenius AI - The Ultimate E2E Testing Framework for Everyone')
  .version(version);

// Initialize project (QA-friendly)
program
  .command('init')
  .description('🚀 Initialize TestGenius project (auto-creates everything)')
  .option('-f, --force', 'Force re-initialization')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 Initializing TestGenius project...'));
      
      const initializer = new ProjectInitializer();
      await initializer.init({ force: options.force });
      
      console.log(chalk.green('✅ TestGenius project initialized successfully!'));
      console.log(chalk.blue('📁 Created directories: tests/, reports/, screenshots/'));
      console.log(chalk.blue('⚙️  Created: testgenius.config.js'));
      console.log(chalk.yellow('💡 Next steps:'));
      console.log(chalk.yellow('   1. testgenius record    - Record your first test'));
      console.log(chalk.yellow('   2. testgenius run       - Run all tests'));
      console.log(chalk.yellow('   3. testgenius report    - View test results'));
      
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Record tests (QA-friendly)
program
  .command('record')
  .description('🎬 Record a new test interactively')
  .action(async () => {
    try {
      console.log(chalk.blue('🎬 Starting TestGenius Recorder...'));
      
      const recorder = new TestRecorder();
      await recorder.start();
      
    } catch (error) {
      console.error(chalk.red('❌ Recording failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Run tests (QA-friendly)
program
  .command('run')
  .description('🚀 Run tests')
  .argument('[test-id]', 'Test ID to run (or "all" for all tests)', 'all')
  .option('-b, --browser <browser>', 'Browser to use (chrome, firefox, safari)', 'chrome')
  .option('-h, --headless', 'Run in headless mode')
  .option('--testsDir <dir>', 'Directory to load tests from (default: tests/)')
  .option('-f, --file <file>', 'Run tests from a single file')
  .option('--files <files...>', 'Run tests from multiple files')
  .option('--testIds <ids...>', 'Run specific test IDs')
  .option('--exclude <files...>', 'Exclude specific files')
  .option('--tag <tag>', 'Run tests with specific tag')
  .option('--priority <priority>', 'Run tests with specific priority (High, Medium, Low)')
  .option('--allure', 'Generate Allure reports')
  .action(async (testId, options) => {
    try {
      console.log(chalk.blue('🚀 Starting TestGenius Test Runner...'));
      
      const runner = new TestRunner();
      
      // Auto-setup if needed
      await runner.autoSetup();
      
      // Prepare run options
      const runOptions: any = {
        browser: options.browser,
        headless: options.headless
      };
      
      // Add file-based options
      if (options.file) {
        runOptions.file = options.file;
      }
      if (options.files) {
        runOptions.files = options.files;
      }
      if (options.testIds) {
        runOptions.testIds = options.testIds;
      }
      if (options.exclude) {
        runOptions.excludeFiles = options.exclude;
      }
      if (options.tag) {
        runOptions.tag = options.tag;
      }
      if (options.priority) {
        runOptions.priority = options.priority;
      }
      if (options.allure) {
        runOptions.allure = options.allure;
      }
      
      // If user provided a custom testsDir, update config
      if (options.testsDir) {
        runner.updateLoggingConfig({}); // ensure logger is initialized
        const configManager = runner['configManager'];
        if (configManager && typeof configManager.updateConfig === 'function') {
          configManager.updateConfig({ testsDir: options.testsDir });
        }
      }
      
      // Run tests
      const result = await runner.run(testId, runOptions);
      
      console.log(chalk.green('✅ Test execution completed!'));
      console.log(chalk.blue('📊 Check reports/ directory for detailed results'));
      
    } catch (error) {
      console.error(chalk.red('❌ Test execution failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// List tests (QA-friendly)
program
  .command('list')
  .description('📋 List all available tests')
  .action(async () => {
    try {
      console.log(chalk.blue('📋 Listing available tests...'));
      
      const lister = new TestLister();
      await lister.list();
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to list tests:'), (error as Error).message);
      process.exit(1);
    }
  });

// Generate report (QA-friendly)
program
  .command('report')
  .description('📊 Generate and open test report')
  .option('--allure', 'Open Allure report instead of HTML report')
  .option('--serve <port>', 'Serve Allure report on specific port (default: 8080)')
  .action(async (options) => {
    try {
      if (options.allure) {
        console.log(chalk.blue('📊 Opening Allure report...'));
        
        // Load config to get Allure settings
        const { ConfigManager } = require('../framework/core/ConfigManager');
        const { AllureReporter } = require('../framework/core/AllureReporter');
        
        const configManager = new ConfigManager();
        const config = await configManager.loadConfig();
        const allureReporter = new AllureReporter(config);
        
        if (options.serve) {
          const port = parseInt(options.serve) || 8080;
          await allureReporter.serveAllureReport(port);
        } else {
          await allureReporter.openAllureReport();
        }
        
      } else {
        console.log(chalk.blue('📊 Generating test report...'));
        
        // Find the latest report
        const fs = require('fs-extra');
        const path = require('path');
        
        const reportsDir = 'reports';
        if (!(await fs.pathExists(reportsDir))) {
          console.log(chalk.yellow('⚠️  No reports found. Run tests first with "testgenius run".'));
          return;
        }
        
        const files = await fs.readdir(reportsDir);
        const htmlFiles = files.filter((file: string) => file.endsWith('.html')).sort().reverse();
        
        if (htmlFiles.length === 0) {
          console.log(chalk.yellow('⚠️  No HTML reports found. Run tests first with "testgenius run".'));
          return;
        }
        
        const latestReport = path.join(reportsDir, htmlFiles[0]);
        console.log(chalk.green(`✅ Latest report: ${latestReport}`));
        console.log(chalk.blue('🌐 Opening report in browser...'));
        
        // Open in browser
        const open = require('open');
        await open(latestReport);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate report:'), (error as Error).message);
      process.exit(1);
    }
  });

// Legacy commands for backward compatibility
program
  .command('run-test-recorder')
  .description('🎬 Legacy: Record a new test (use "record" instead)')
  .action(async () => {
    console.log(chalk.yellow('⚠️  This command is deprecated. Use "testgenius record" instead.'));
    try {
      const recorder = new TestRecorder();
      await recorder.start();
    } catch (error) {
      console.error(chalk.red('❌ Recording failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Version check command
program
  .command('version')
  .description('📋 Show current version and check for updates')
  .action(async () => {
    try {
      const currentVersion = version;
      console.log(chalk.blue('🧠 TestGenius AI'));
      console.log(chalk.green(`✅ Current Version: ${currentVersion}`));
      
      // Check for updates
      console.log(chalk.yellow('🔍 Checking for updates...'));
      try {
        const { execSync } = require('child_process');
        const latestVersion = execSync('npm view testgenius-ai version', { encoding: 'utf8' }).trim();
        
        if (latestVersion === currentVersion) {
          console.log(chalk.green('✅ You have the latest version!'));
        } else {
          console.log(chalk.yellow(`🔄 New version available: ${latestVersion}`));
          console.log(chalk.blue('💡 Run "npm update -g testgenius-ai" to update'));
        }
      } catch (error) {
        console.log(chalk.gray('⚠️  Could not check for updates (network issue)'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Version check failed:'), (error as Error).message);
    }
  });

// Help command
program
  .command('help')
  .description('❓ Show detailed help')
  .action(() => {
    console.log(chalk.blue('🧠 TestGenius AI - Help'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Essential Commands:'));
    console.log(chalk.yellow('  testgenius init     - Initialize project (first time setup)'));
    console.log(chalk.yellow('  testgenius record   - Record a new test interactively'));
    console.log(chalk.yellow('  testgenius run      - Run all tests'));
    console.log(chalk.yellow('  testgenius list     - List all available tests'));
    console.log(chalk.yellow('  testgenius report   - View test results'));
    console.log(chalk.yellow('  testgenius version  - Check current version and updates'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Run Command Examples:'));
    console.log(chalk.gray('  testgenius run                    - Run all tests'));
    console.log(chalk.gray('  testgenius run INTERNET-001       - Run specific test by ID'));
    console.log(chalk.gray('  testgenius run -f tests/auth.js   - Run tests from single file'));
    console.log(chalk.gray('  testgenius run --files tests/auth.js tests/ui.js - Run from multiple files'));
    console.log(chalk.gray('  testgenius run --testIds INTERNET-001 INTERNET-002 - Run specific test IDs'));
    console.log(chalk.gray('  testgenius run --tag smoke        - Run tests with "smoke" tag'));
    console.log(chalk.gray('  testgenius run --priority High    - Run high priority tests'));
    console.log(chalk.gray('  testgenius run --exclude auth.js  - Exclude specific files'));
    console.log(chalk.gray('  testgenius run --headless         - Run tests in headless mode'));
    console.log(chalk.gray('  testgenius run --browser firefox  - Run with Firefox'));
    console.log(chalk.gray('  testgenius run --allure           - Generate Allure reports'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Report Commands:'));
    console.log(chalk.gray('  testgenius report                 - Open HTML report'));
    console.log(chalk.gray('  testgenius report --allure        - Open Allure report'));
    console.log(chalk.gray('  testgenius report --allure --serve 8080 - Serve Allure on port 8080'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('Update Commands:'));
    console.log(chalk.gray('  npm update -g testgenius-ai       - Update to latest version'));
    console.log(chalk.gray('  npm install -g testgenius-ai@latest - Install latest version'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white('For more information:'));
    console.log(chalk.blue('  https://github.com/hiroksarker/testgenius-ai'));
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.help();
} 