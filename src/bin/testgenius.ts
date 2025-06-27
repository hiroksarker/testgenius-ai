import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { version } from '../../package.json';

// Import command modules
import { TestRunner } from '../framework/core/TestRunner';
import { TestRecorder } from '../framework/core/TestRecorder';
import { ReportGenerator } from '../framework/core/ReportGenerator';
import { ProjectInitializer } from '../framework/core/ProjectInitializer';
import { TestLister } from '../framework/core/TestLister';
import { CleanupManager } from '../framework/core/CleanupManager';
import { TestRunOptions, ReportOptions, CleanupOptions, InitOptions } from '../types';

const program = new Command();

// ASCII Art Logo
const logo = `
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ████████╗███████╗███████╗███████╗████████╗ ██████╗      ║
║    ╚══██╔══╝██╔════╝██╔════╝██╔════╝╚══██╔══╝██╔════╝      ║
║       ██║   █████╗  ███████╗███████╗   ██║   ██║         ║
║       ██║   ██╔══╝  ╚════██║╚════██║   ██║   ██║         ║
║       ██║   ███████╗███████║███████║   ██║   ╚██████╗    ║
║       ╚═╝   ╚══════╝╚══════╝╚══════╝   ╚═╝    ╚═════╝    ║
║                                                              ║
║              AI-Driven E2E Testing Framework                ║
║                    Powered by WebdriverIO                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

console.log(chalk.magenta(logo));

program
  .name('testgenius')
  .description('AI-Driven E2E Testing Framework with WebdriverIO')
  .version(version, '-v, --version');

// Test execution commands
program
  .command('run')
  .description('Run tests or start test recorder')
  .addCommand(
    new Command('test')
      .description('Run tests')
      .argument('[testId]', 'Test ID to run (or "all" for all tests)')
      .option('-t, --tag <tag>', 'Run tests with specific tag')
      .option('-p, --priority <priority>', 'Run tests with specific priority (High/Medium/Low)')
      .option('-b, --browser <browser>', 'Browser to use (chrome/firefox/safari)', 'chrome')
      .option('--headless', 'Run in headless mode', true)
      .option('--no-headless', 'Run in headed mode')
      .option('--viewport <size>', 'Viewport size (e.g., 1920x1080)', '1920x1080')
      .option('--model <model>', 'AI model to use', 'gpt-4o')
      .option('--parallel <number>', 'Number of parallel executions', '1')
      .option('--env <environment>', 'Environment to test against', 'staging')
      .action(async (testId: string, options: TestRunOptions) => {
        try {
          const runner = new TestRunner();
          await runner.run(testId || 'all', options);
        } catch (error) {
          console.error(chalk.red('Error running tests:'), (error as Error).message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('test-recorder')
      .description('Start interactive test recorder')
      .action(async () => {
        try {
          const recorder = new TestRecorder();
          await recorder.start();
        } catch (error) {
          console.error(chalk.red('Error starting recorder:'), (error as Error).message);
          process.exit(1);
        }
      })
  );

// Test management commands
program
  .command('list')
  .description('List all available tests')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('-p, --priority <priority>', 'Filter by priority')
  .action(async (options: { tag?: string; priority?: string }) => {
    try {
      const lister = new TestLister();
      await lister.list(options);
    } catch (error) {
      console.error(chalk.red('Error listing tests:'), (error as Error).message);
      process.exit(1);
    }
  });

// Report generation commands
program
  .command('generate')
  .description('Generate reports')
  .addCommand(
    new Command('report')
      .description('Generate HTML report')
      .option('--summary', 'Generate summary report only')
      .option('--output <path>', 'Output directory for reports')
      .action(async (options: ReportOptions) => {
        try {
          const generator = new ReportGenerator();
          await generator.generate(options);
        } catch (error) {
          console.error(chalk.red('Error generating report:'), (error as Error).message);
          process.exit(1);
        }
      })
  );

// Report viewing commands
program
  .command('open')
  .description('Open reports in browser')
  .addCommand(
    new Command('report')
      .description('Open HTML report')
      .argument('[filename]', 'Specific report file to open')
      .action(async (filename?: string) => {
        try {
          const generator = new ReportGenerator();
          await generator.open(filename);
        } catch (error) {
          console.error(chalk.red('Error opening report:'), (error as Error).message);
          process.exit(1);
        }
      })
  );

// Cleanup commands
program
  .command('cleanup')
  .description('Clean up old test results and reports')
  .addCommand(
    new Command('results')
      .description('Clean up old test results')
      .argument('[keepCount]', 'Number of recent results to keep per test', '10')
      .action(async (keepCount: string) => {
        try {
          const cleanup = new CleanupManager();
          await cleanup.cleanupResults(parseInt(keepCount));
        } catch (error) {
          console.error(chalk.red('Error cleaning up results:'), (error as Error).message);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('reports')
      .description('Clean up old report files')
      .argument('[days]', 'Keep reports newer than specified days', '30')
      .action(async (days: string) => {
        try {
          const cleanup = new CleanupManager();
          await cleanup.cleanupReports(parseInt(days));
        } catch (error) {
          console.error(chalk.red('Error cleaning up reports:'), (error as Error).message);
          process.exit(1);
        }
      })
  );

// Project initialization
program
  .command('init')
  .description('Initialize a new TestGenius project')
  .option('--force', 'Force initialization even if project exists')
  .action(async (options: InitOptions) => {
    try {
      const initializer = new ProjectInitializer();
      await initializer.init(options);
    } catch (error) {
      console.error(chalk.red('Error initializing project:'), (error as Error).message);
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show detailed help information')
  .action(() => {
    console.log(chalk.cyan('\n📚 TestGenius Help & Documentation\n'));
    console.log(chalk.yellow('🎯 Core Commands:'));
    console.log('  testgenius run test [testId]     - Run specific test or all tests');
    console.log('  testgenius run test-recorder     - Start interactive test recorder');
    console.log('  testgenius list                  - List all available tests');
    console.log('  testgenius generate report       - Generate HTML reports');
    console.log('  testgenius open report           - Open latest report');
    console.log('  testgenius cleanup results       - Clean up old test results');
    console.log('  testgenius init                  - Initialize new project');
    console.log('');
    console.log(chalk.yellow('🔧 Options:'));
    console.log('  --tag <tag>                      - Filter tests by tag');
    console.log('  --priority <priority>            - Filter tests by priority');
    console.log('  --browser <browser>              - Specify browser (chrome/firefox/safari)');
    console.log('  --no-headless                    - Run in headed mode');
    console.log('  --parallel <number>              - Run tests in parallel');
    console.log('  --env <environment>              - Specify environment');
    console.log('');
    console.log(chalk.yellow('📖 Examples:'));
    console.log('  testgenius run test AUTH-001     - Run specific test');
    console.log('  testgenius run test --tag smoke  - Run smoke tests');
    console.log('  testgenius run test --browser firefox --no-headless');
    console.log('  testgenius run test all --parallel 3');
    console.log('');
    console.log(chalk.yellow('📚 Documentation:'));
    console.log('  README.md                        - Complete documentation');
    console.log('  QUICKSTART.md                    - Quick start guide');
    console.log('  https://testgenius.ai            - Online documentation');
    console.log('');
  });

// Parse command line arguments
program.parse(); 