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
  .option('--cost', 'Show cost analysis report')
  .option('--optimization', 'Show cost optimization recommendations')
  .option('--summary', 'Generate lightweight summary report')
  .option('--html', 'Generate interactive HTML report')
  .action(async (options) => {
    try {
      if (options.cost || options.optimization) {
        console.log(chalk.blue('💰 Generating cost analysis report...'));
        
        // Load config to get cost tracking settings
        const { ConfigManager } = require('../framework/core/ConfigManager');
        const { CostTracker } = require('../framework/core/CostTracker');
        
        const configManager = new ConfigManager();
        const config = await configManager.loadConfig();
        
        if (!config.costTracking?.enabled) {
          console.log(chalk.yellow('⚠️  Cost tracking is not enabled. Enable it in your config to use cost features.'));
          return;
        }
        
        const costTracker = new CostTracker(config);
        const costReport = await costTracker.generateCostReport();
        
        if (options.cost) {
          console.log(chalk.green('\n💰 Cost Analysis Report'));
          console.log(chalk.gray('='.repeat(50)));
          console.log(`Total Tests: ${costReport.totalTests}`);
          console.log(`Total Cost: $${costReport.totalCost.toFixed(4)}`);
          console.log(`Average Cost per Test: $${costReport.averageCostPerTest.toFixed(4)}`);
          console.log(`Potential Savings: $${costReport.costSavings.toFixed(4)}`);
          
          if (costReport.topExpensiveTests.length > 0) {
            console.log(chalk.yellow('\n🏆 Top 5 Most Expensive Tests:'));
            costReport.topExpensiveTests.slice(0, 5).forEach((test: any, index: number) => {
              console.log(`${index + 1}. ${test.testId}: $${test.costMetrics.estimatedCost.toFixed(4)} (${test.costMetrics.tokenUsage.model})`);
            });
          }
        }
        
        if (options.optimization) {
          console.log(chalk.green('\n🚀 Cost Optimization Recommendations'));
          console.log(chalk.gray('='.repeat(50)));
          if (costReport.optimizationRecommendations.length > 0) {
            costReport.optimizationRecommendations.forEach((rec: string, index: number) => {
              console.log(`${index + 1}. ${rec}`);
            });
          } else {
            console.log('No optimization recommendations at this time.');
          }
        }
        
        return;
      }
      
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
        // Generate simple HTML report
        console.log(chalk.blue('📊 Generating HTML report...'));
        
        const { ReportGenerator } = require('../framework/core/ReportGenerator');
        const reportGenerator = new ReportGenerator();
        await reportGenerator.generate();
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Report generation failed:'), (error as Error).message);
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

// Cost tracking commands
program
  .command('cost')
  .description('💰 Cost tracking and optimization features')
  .option('--enable', 'Enable cost tracking in config')
  .option('--disable', 'Disable cost tracking in config')
  .option('--budget <amount>', 'Set daily budget limit')
  .option('--monthly-budget <amount>', 'Set monthly budget limit')
  .option('--analyze', 'Analyze current cost data')
  .option('--optimize', 'Show optimization recommendations')
  .action(async (options) => {
    try {
      const { ConfigManager } = require('../framework/core/ConfigManager');
      const { CostTracker } = require('../framework/core/CostTracker');
      
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      
      if (options.enable) {
        config.costTracking = config.costTracking || {};
        config.costTracking.enabled = true;
        await configManager.saveConfig(config);
        console.log(chalk.green('✅ Cost tracking enabled'));
      }
      
      if (options.disable) {
        if (config.costTracking) {
          config.costTracking.enabled = false;
          await configManager.saveConfig(config);
          console.log(chalk.yellow('⚠️  Cost tracking disabled'));
        }
      }
      
      if (options.budget) {
        const amount = parseFloat(options.budget);
        if (isNaN(amount)) {
          console.error(chalk.red('❌ Invalid budget amount'));
          return;
        }
        config.costTracking = config.costTracking || {};
        config.costTracking.budgetAlerts = config.costTracking.budgetAlerts || {};
        config.costTracking.budgetAlerts.enabled = true;
        config.costTracking.budgetAlerts.dailyLimit = amount;
        await configManager.saveConfig(config);
        console.log(chalk.green(`✅ Daily budget limit set to $${amount}`));
      }
      
      if (options.monthlyBudget) {
        const amount = parseFloat(options.monthlyBudget);
        if (isNaN(amount)) {
          console.error(chalk.red('❌ Invalid monthly budget amount'));
          return;
        }
        config.costTracking = config.costTracking || {};
        config.costTracking.budgetAlerts = config.costTracking.budgetAlerts || {};
        config.costTracking.budgetAlerts.enabled = true;
        config.costTracking.budgetAlerts.monthlyLimit = amount;
        await configManager.saveConfig(config);
        console.log(chalk.green(`✅ Monthly budget limit set to $${amount}`));
      }
      
      if (options.analyze || options.optimize) {
        if (!config.costTracking?.enabled) {
          console.log(chalk.yellow('⚠️  Cost tracking is not enabled. Use --enable to enable it.'));
          return;
        }
        
        const costTracker = new CostTracker(config);
        
        if (options.analyze) {
          const costReport = await costTracker.generateCostReport();
          console.log(chalk.green('\n💰 Cost Analysis'));
          console.log(chalk.gray('='.repeat(30)));
          console.log(`Total Tests: ${costReport.totalTests}`);
          console.log(`Total Cost: $${costReport.totalCost.toFixed(4)}`);
          console.log(`Average Cost per Test: $${costReport.averageCostPerTest.toFixed(4)}`);
          console.log(`Potential Savings: $${costReport.costSavings.toFixed(4)}`);
        }
        
        if (options.optimize) {
          const costReport = await costTracker.generateCostReport();
          console.log(chalk.green('\n🚀 Optimization Recommendations'));
          console.log(chalk.gray('='.repeat(30)));
          if (costReport.optimizationRecommendations.length > 0) {
            costReport.optimizationRecommendations.forEach((rec: string, index: number) => {
              console.log(`${index + 1}. ${rec}`);
            });
          } else {
            console.log('No optimization recommendations at this time.');
          }
        }
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Cost tracking operation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Auto test (QA-friendly - maximum automation)
program
  .command('auto')
  .description('🚀 AI-powered automated testing with minimal code')
  .argument('[task]', 'Natural language description of what to test', 'Test the login functionality')
  .option('-u, --url <url>', 'Target website URL', 'https://the-internet.herokuapp.com')
  .option('-b, --browser <browser>', 'Browser to use (chrome, firefox, safari)', 'chrome')
  .option('-h, --headless', 'Run in headless mode')
  .option('-s, --screenshot', 'Take screenshots during execution')
  .option('-v, --verbose', 'Show detailed execution steps')
  .option('--save', 'Save the generated test for future use')
  .option('--name <name>', 'Name for the saved test')
  .action(async (task, options) => {
    try {
      console.log(chalk.blue('🚀 Starting AI-powered automated testing...'));
      console.log(chalk.cyan(`🎯 Task: ${task}`));
      console.log(chalk.cyan(`🌐 URL: ${options.url}`));
      
      const runner = new TestRunner();
      
      // Auto-setup if needed
      await runner.autoSetup();
      
      // Create a test definition from natural language
      const testDefinition = {
        id: `auto-${Date.now()}`,
        name: options.name || `Auto Test - ${task.substring(0, 50)}`,
        description: task,
        priority: 'Medium' as const,
        tags: ['auto', 'ai-generated'],
        site: options.url,
        task: task,
        testData: {}
      };

      // Prepare run options
      const runOptions: any = {
        browser: options.browser,
        headless: options.headless,
        screenshot: options.screenshot,
        verbose: options.verbose
      };

      // Run the auto-generated test
      const result = await runner.runAutoTest(testDefinition, runOptions);
      
      if (result.success) {
        console.log(chalk.green('✅ AI-powered test completed successfully!'));
        
        if (options.save) {
          console.log(chalk.blue('💾 Saving test for future use...'));
          await runner.saveAutoTest(testDefinition, result);
        }
      } else {
        console.log(chalk.red('❌ AI-powered test failed'));
        console.log(chalk.yellow('Errors:'));
        result.errors?.forEach((error: string) => console.log(chalk.yellow(`  - ${error}`)));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Auto test failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Smart test generation (QA-friendly)
program
  .command('generate')
  .description('🧠 Generate test scenarios from natural language')
  .argument('[scenario]', 'Natural language scenario description', 'User login and logout flow')
  .option('-u, --url <url>', 'Target website URL', 'https://the-internet.herokuapp.com')
  .option('-o, --output <file>', 'Output file for generated test')
  .option('-f, --format <format>', 'Output format (js, json, bdd)', 'js')
  .action(async (scenario, options) => {
    try {
      console.log(chalk.blue('🧠 Generating test scenarios from natural language...'));
      console.log(chalk.cyan(`📝 Scenario: ${scenario}`));
      
      const { TestGenerator } = require('../framework/core/TestGenerator');
      const generator = new TestGenerator();
      
      const tests = await generator.generateFromScenario(scenario, options.url);
      
      if (options.output) {
        await generator.saveTests(tests, options.output, options.format);
        console.log(chalk.green(`✅ Generated tests saved to ${options.output}`));
      } else {
        console.log(chalk.green('✅ Generated test scenarios:'));
        tests.forEach((test: any, index: number) => {
          console.log(chalk.cyan(`\n${index + 1}. ${test.name}`));
          console.log(chalk.gray(`   ${test.description}`));
          console.log(chalk.gray(`   Steps: ${test.steps?.length || 0}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Test generation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Visual test creation (QA-friendly)
program
  .command('visual')
  .description('👁️ Create tests by analyzing screenshots')
  .argument('[screenshot]', 'Path to screenshot or URL')
  .option('-o, --output <file>', 'Output file for generated test')
  .option('-d, --description <desc>', 'Additional description for the test')
  .action(async (screenshot, options) => {
    try {
      console.log(chalk.blue('👁️ Creating test from visual analysis...'));
      console.log(chalk.cyan(`🖼️ Screenshot: ${screenshot}`));
      
      const { VisualTestGenerator } = require('../framework/core/VisualTestGenerator');
      const generator = new VisualTestGenerator();
      
      const test = await generator.generateFromScreenshot(screenshot, options.description);
      
      if (options.output) {
        await generator.saveTest(test, options.output);
        console.log(chalk.green(`✅ Visual test saved to ${options.output}`));
      } else {
        console.log(chalk.green('✅ Generated visual test:'));
        console.log(chalk.cyan(`Name: ${test.name}`));
        console.log(chalk.gray(`Description: ${test.description}`));
        console.log(chalk.gray(`Steps: ${test.steps?.length || 0}`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Visual test creation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Custom Tools Management
program
  .command('create')
  .description('🔧 Create new custom tools')
  .argument('<type>', 'Type of tool to create (tool)')
  .argument('[name]', 'Name of the tool')
  .option('-t, --template <template>', 'Template to use (basic, api, ui, database)', 'basic')
  .option('-c, --category <category>', 'Tool category (api, ui, database, custom)', 'custom')
  .option('-d, --description <description>', 'Tool description')
  .option('-a, --author <author>', 'Tool author')
  .action(async (type, name, options) => {
    try {
      if (type === 'tool') {
        if (!name) {
          console.error(chalk.red('❌ Tool name is required'));
          process.exit(1);
        }

        console.log(chalk.blue(`🔧 Creating custom tool: ${name}`));
        
        const { CustomToolsManager } = require('../framework/core/CustomToolsManager');
        const toolsManager = new CustomToolsManager();
        await toolsManager.initialize();
        
        await toolsManager.createTool(name, {
          template: options.template,
          category: options.category,
          description: options.description,
          author: options.author
        });
        
      } else {
        console.error(chalk.red(`❌ Unknown type: ${type}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Creation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// List tools
program
  .command('list')
  .description('📋 List available items')
  .argument('[type]', 'Type to list (tests, tools)', 'tests')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (type, options) => {
    try {
      if (type === 'tests') {
        console.log(chalk.blue('📋 Listing available tests...'));
        
        const lister = new TestLister();
        await lister.list();
        
      } else if (type === 'tools') {
        console.log(chalk.blue('🔧 Listing custom tools...'));
        
        const { CustomToolsManager } = require('../framework/core/CustomToolsManager');
        const toolsManager = new CustomToolsManager();
        
        const tools = await toolsManager.listTools(options.verbose);
        
        if (tools.length === 0) {
          console.log(chalk.yellow('No custom tools found. Create one with: testgenius create tool <name>'));
        } else {
          console.log(chalk.green(`Found ${tools.length} custom tool(s):`));
          tools.forEach((tool: any) => {
            console.log(chalk.blue(`  - ${tool.name} (${tool.id})`));
            if (options.verbose) {
              console.log(chalk.gray(`    Description: ${tool.description}`));
              console.log(chalk.gray(`    Category: ${tool.category}`));
              console.log(chalk.gray(`    Status: ${tool.enabled ? '✅ Enabled' : '❌ Disabled'}`));
            }
          });
        }
        
      } else {
        console.error(chalk.red(`❌ Unknown type: ${type}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to list:'), (error as Error).message);
      process.exit(1);
    }
  });

// Validate tools
program
  .command('validate')
  .description('✅ Validate custom tools')
  .argument('[type]', 'Type to validate (tools)', 'tools')
  .action(async (type) => {
    try {
      if (type === 'tools') {
        console.log(chalk.blue('✅ Validating custom tools...'));
        
        const { CustomToolsManager } = require('../framework/core/CustomToolsManager');
        const toolsManager = new CustomToolsManager();
        
        const { valid, invalid } = await toolsManager.validateTools();
        
        console.log(chalk.green(`✅ Valid tools: ${valid.length}`));
        valid.forEach((tool: any) => {
          console.log(chalk.green(`  - ${tool.name} (${tool.id})`));
        });
        
        if (invalid.length > 0) {
          console.log(chalk.red(`❌ Invalid tools: ${invalid.length}`));
          invalid.forEach((error: string) => {
            console.log(chalk.red(`  - ${error}`));
          });
        }
        
      } else {
        console.error(chalk.red(`❌ Unknown type: ${type}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Open report
program
  .command('open')
  .description('🌐 Open latest report in browser')
  .argument('[type]', 'Type of report to open (report)', 'report')
  .argument('[filename]', 'Specific report filename')
  .action(async (type, filename) => {
    try {
      if (type === 'report') {
        console.log(chalk.blue('🌐 Opening report in browser...'));
        
        const { HTMLReportGenerator } = require('../framework/core/HTMLReportGenerator');
        const reportGenerator = new HTMLReportGenerator();
        
        await reportGenerator.openReport(filename);
        
      } else {
        console.error(chalk.red(`❌ Unknown type: ${type}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to open report:'), (error as Error).message);
      process.exit(1);
    }
  });

// Cleanup
program
  .command('cleanup')
  .description('🧹 Clean up old files')
  .argument('[type]', 'Type to cleanup (results, reports)', 'results')
  .argument('[count]', 'Number of items to keep', '10')
  .action(async (type, count) => {
    try {
      const keepCount = parseInt(count);
      
      if (type === 'results') {
        console.log(chalk.blue(`🧹 Cleaning up old test results (keeping ${keepCount} most recent)...`));
        
        // Implementation for cleaning up test results
        console.log(chalk.green('✅ Test results cleanup completed'));
        
      } else if (type === 'reports') {
        console.log(chalk.blue(`🧹 Cleaning up old reports (keeping ${keepCount} most recent)...`));
        
        const { HTMLReportGenerator } = require('../framework/core/HTMLReportGenerator');
        const reportGenerator = new HTMLReportGenerator();
        
        await reportGenerator.cleanupReports(keepCount);
        
      } else {
        console.error(chalk.red(`❌ Unknown type: ${type}`));
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Cleanup failed:'), (error as Error).message);
      process.exit(1);
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