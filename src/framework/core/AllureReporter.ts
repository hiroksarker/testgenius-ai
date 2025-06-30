import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { TestResult, TestSuiteResult, FrameworkConfig, TestCostData } from '../../types';
import { CostTracker } from './CostTracker';

export class AllureReporter {
  private config: FrameworkConfig;
  private costTracker: CostTracker;

  constructor(config: FrameworkConfig) {
    this.config = config;
    this.costTracker = new CostTracker(config);
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

      // Generate cost tracking widgets if enabled
      if (this.config.costTracking?.enabled) {
        await this.generateCostTrackingWidgets(resultsDir);
        await this.generateCostSummaryFile(resultsDir);
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

    // Add cost tracking data if enabled
    if (this.config.costTracking?.enabled) {
      await this.addCostTrackingData(allureResult, result);
    }

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

  /**
   * Add cost tracking data to Allure result
   */
  private async addCostTrackingData(allureResult: any, result: TestResult): Promise<void> {
    try {
      // Try to find cost data for this test
      const costDataFile = path.join(process.cwd(), 'cost-data.json');
      if (await fs.pathExists(costDataFile)) {
        const costData: TestCostData[] = await fs.readJson(costDataFile);
        const testCostData = costData.find(data => data.testId === result.testId && data.sessionId === result.sessionId);
        
        if (testCostData) {
          // Add cost information to labels
          allureResult.labels.push(
            { name: 'cost', value: `$${testCostData.costMetrics.estimatedCost.toFixed(4)}` },
            { name: 'model', value: testCostData.costMetrics.tokenUsage.model },
            { name: 'tokens', value: testCostData.costMetrics.tokenUsage.totalTokens.toString() }
          );

          // Add cost details to description
          const costDetails = `
            <h4>Cost Analysis</h4>
            <p><strong>Total Cost:</strong> $${testCostData.costMetrics.estimatedCost.toFixed(4)}</p>
            <p><strong>Model:</strong> ${testCostData.costMetrics.tokenUsage.model}</p>
            <p><strong>Tokens Used:</strong> ${testCostData.costMetrics.tokenUsage.totalTokens}</p>
            <p><strong>Prompt Tokens:</strong> ${testCostData.costMetrics.tokenUsage.promptTokens}</p>
            <p><strong>Completion Tokens:</strong> ${testCostData.costMetrics.tokenUsage.completionTokens}</p>
          `;
          
          allureResult.descriptionHtml += costDetails;
        }
      }
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Failed to add cost tracking data to Allure result:'), (error as Error).message);
    }
  }

  /**
   * Generate custom Allure widgets for cost tracking
   */
  private async generateCostTrackingWidgets(resultsDir: string): Promise<void> {
    try {
      const widgetsDir = path.join(resultsDir, 'widgets');
      await fs.ensureDir(widgetsDir);

      // Generate cost summary widget
      const costReport = await this.costTracker.generateCostReport();
      
      // Enhanced cost summary widget with more details
      const costSummaryWidget = {
        name: 'cost-summary',
        title: '💰 AI Testing Cost Summary',
        type: 'text',
        data: {
          title: 'AI Testing Cost Analysis',
          value: [
            `📊 **Total Tests Executed:** ${costReport.totalTests}`,
            `💵 **Total Cost:** $${costReport.totalCost.toFixed(4)}`,
            `📈 **Average Cost per Test:** $${costReport.averageCostPerTest.toFixed(4)}`,
            `🎯 **Potential Savings:** $${costReport.costSavings.toFixed(4)}`,
            `📅 **Report Generated:** ${new Date().toLocaleString()}`,
            `💡 **Cost Tracking Status:** ${costReport.totalCost > 0 ? 'Active' : 'No AI costs detected'}`
          ].join('\n\n')
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-summary.json'), costSummaryWidget, { spaces: 2 });

      // Generate detailed cost breakdown widget
      const costBreakdownWidget = {
        name: 'cost-breakdown',
        title: '📊 Cost Breakdown',
        type: 'table',
        data: {
          title: 'Detailed Cost Analysis',
          headers: ['Metric', 'Value', 'Details'],
          rows: [
            ['Total Tests', costReport.totalTests.toString(), 'All executed tests'],
            ['Successful Tests', costReport.topExpensiveTests.filter(t => t.success).length.toString(), 'Tests that passed'],
            ['Failed Tests', costReport.topExpensiveTests.filter(t => !t.success).length.toString(), 'Tests that failed'],
            ['Total Cost', `$${costReport.totalCost.toFixed(4)}`, 'Sum of all test costs'],
            ['Average Cost', `$${costReport.averageCostPerTest.toFixed(4)}`, 'Cost per individual test'],
            ['Cost per Success', costReport.topExpensiveTests.filter(t => t.success).length > 0 ? 
              `$${(costReport.totalCost / costReport.topExpensiveTests.filter(t => t.success).length).toFixed(4)}` : '$0.0000', 'Cost per successful test'],
            ['Potential Savings', `$${costReport.costSavings.toFixed(4)}`, 'Estimated savings from optimization']
          ]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-breakdown.json'), costBreakdownWidget, { spaces: 2 });

      // Generate cost trend widget
      const costTrendWidget = {
        name: 'cost-trend',
        title: '📈 Cost Trend Analysis',
        type: 'line-chart',
        data: {
          title: 'Daily Cost Trend',
          series: [{
            name: 'Daily Cost',
            data: costReport.costTrend.map(item => ({
              x: item.date,
              y: item.cost
            }))
          }]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-trend.json'), costTrendWidget, { spaces: 2 });

      // Generate cost trend bar chart
      const costTrendBarWidget = {
        name: 'cost-trend-bar',
        title: '📊 Cost Trend (Bar Chart)',
        type: 'bar-chart',
        data: {
          title: 'Daily Cost Distribution',
          series: [{
            name: 'Daily Cost',
            data: costReport.costTrend.map(item => ({
              x: item.date,
              y: item.cost
            }))
          }]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-trend-bar.json'), costTrendBarWidget, { spaces: 2 });

      // Generate cost vs tests line chart
      const costVsTestsWidget = {
        name: 'cost-vs-tests',
        title: '📈 Cost vs Tests Correlation',
        type: 'line-chart',
        data: {
          title: 'Cost vs Number of Tests',
          series: [
            {
              name: 'Daily Cost',
              data: costReport.costTrend.map(item => ({
                x: item.date,
                y: item.cost
              }))
            },
            {
              name: 'Number of Tests',
              data: costReport.costTrend.map(item => ({
                x: item.date,
                y: item.tests
              }))
            }
          ]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-vs-tests.json'), costVsTestsWidget, { spaces: 2 });

      // Generate cost by category pie chart
      const costByCategoryWidget = {
        name: 'cost-by-category',
        title: '📋 Cost by Category',
        type: 'pie-chart',
        data: {
          title: 'Cost Distribution by Model',
          series: costReport.costByCategory.map(category => ({
            name: category.category,
            value: category.cost,
            tests: category.tests
          }))
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-by-category.json'), costByCategoryWidget, { spaces: 2 });

      // Generate cost by category bar chart
      const costByCategoryBarWidget = {
        name: 'cost-by-category-bar',
        title: '📊 Cost by Category (Bar Chart)',
        type: 'bar-chart',
        data: {
          title: 'Cost Distribution by Model',
          series: [{
            name: 'Cost by Model',
            data: costReport.costByCategory.map(category => ({
              x: category.category,
              y: category.cost
            }))
          }]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-by-category-bar.json'), costByCategoryBarWidget, { spaces: 2 });

      // Generate tests by category bar chart
      const testsByCategoryWidget = {
        name: 'tests-by-category',
        title: '📊 Tests by Category',
        type: 'bar-chart',
        data: {
          title: 'Number of Tests by Model',
          series: [{
            name: 'Tests by Model',
            data: costReport.costByCategory.map(category => ({
              x: category.category,
              y: category.tests
            }))
          }]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'tests-by-category.json'), testsByCategoryWidget, { spaces: 2 });

      // Generate expensive tests bar chart
      const expensiveTestsBarWidget = {
        name: 'expensive-tests-bar',
        title: '🏆 Most Expensive Tests (Bar Chart)',
        type: 'bar-chart',
        data: {
          title: 'Top 10 Most Expensive Tests',
          series: [{
            name: 'Test Cost',
            data: costReport.topExpensiveTests.slice(0, 10).map(test => ({
              x: test.testId,
              y: test.costMetrics.estimatedCost
            }))
          }]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'expensive-tests-bar.json'), expensiveTestsBarWidget, { spaces: 2 });

      // Generate success vs failure cost pie chart
      const successFailureCostWidget = {
        name: 'success-failure-cost',
        title: '✅❌ Success vs Failure Cost',
        type: 'pie-chart',
        data: {
          title: 'Cost Distribution by Test Status',
          series: [
            {
              name: 'Successful Tests',
              value: costReport.topExpensiveTests.filter(t => t.success).reduce((sum, test) => sum + test.costMetrics.estimatedCost, 0)
            },
            {
              name: 'Failed Tests',
              value: costReport.topExpensiveTests.filter(t => !t.success).reduce((sum, test) => sum + test.costMetrics.estimatedCost, 0)
            }
          ]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'success-failure-cost.json'), successFailureCostWidget, { spaces: 2 });

      // Generate cost efficiency area chart
      const costEfficiencyAreaWidget = {
        name: 'cost-efficiency-area',
        title: '⚡ Cost Efficiency Over Time',
        type: 'area-chart',
        data: {
          title: 'Cost Efficiency Trend',
          series: [
            {
              name: 'Cost per Test',
              data: costReport.costTrend.map(item => ({
                x: item.date,
                y: item.tests > 0 ? item.cost / item.tests : 0
              }))
            }
          ]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-efficiency-area.json'), costEfficiencyAreaWidget, { spaces: 2 });

      // Generate token usage distribution pie chart
      const tokenUsageWidget = {
        name: 'token-usage-distribution',
        title: '🔤 Token Usage Distribution',
        type: 'pie-chart',
        data: {
          title: 'Token Usage by Type',
          series: [
            {
              name: 'Prompt Tokens',
              value: costReport.topExpensiveTests.reduce((sum, test) => sum + test.costMetrics.tokenUsage.promptTokens, 0)
            },
            {
              name: 'Completion Tokens',
              value: costReport.topExpensiveTests.reduce((sum, test) => sum + test.costMetrics.tokenUsage.completionTokens, 0)
            }
          ]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'token-usage-distribution.json'), tokenUsageWidget, { spaces: 2 });

      // Generate cost savings potential bar chart
      const costSavingsWidget = {
        name: 'cost-savings-potential',
        title: '💰 Cost Savings Potential',
        type: 'bar-chart',
        data: {
          title: 'Potential Cost Savings by Optimization',
          series: [
            {
              name: 'Current Cost',
              data: [{
                x: 'Current',
                y: costReport.totalCost
              }]
            },
            {
              name: 'Potential Savings',
              data: [{
                x: 'Savings',
                y: costReport.costSavings
              }]
            }
          ]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-savings-potential.json'), costSavingsWidget, { spaces: 2 });

      // Generate monthly cost projection line chart
      const monthlyProjectionWidget = {
        name: 'monthly-cost-projection',
        title: '📅 Monthly Cost Projection',
        type: 'line-chart',
        data: {
          title: 'Projected Monthly Costs',
          series: [
            {
              name: 'Current Month',
              data: costReport.costTrend.slice(-30).map(item => ({
                x: item.date,
                y: item.cost
              }))
            },
            {
              name: 'Projected (30 days)',
              data: costReport.costTrend.slice(-30).map((item, index) => ({
                x: new Date(new Date(item.date).getTime() + (index + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                y: item.cost * 1.1 // 10% growth projection
              }))
            }
          ]
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'monthly-cost-projection.json'), monthlyProjectionWidget, { spaces: 2 });

      // Generate optimization recommendations widget
      const optimizationWidget = {
        name: 'optimization-recommendations',
        title: '🚀 Cost Optimization',
        type: 'text',
        data: {
          title: 'Optimization Recommendations',
          value: costReport.optimizationRecommendations.length > 0 
            ? costReport.optimizationRecommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n\n')
            : '✅ No optimization recommendations at this time. Your test costs are already optimized!'
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'optimization-recommendations.json'), optimizationWidget, { spaces: 2 });

      // Generate expensive tests table widget
      const expensiveTestsWidget = {
        name: 'expensive-tests',
        title: '🏆 Most Expensive Tests',
        type: 'table',
        data: {
          title: 'Top 10 Most Expensive Tests',
          headers: ['Test ID', 'Cost', 'Model', 'Tokens', 'Status', 'Duration'],
          rows: costReport.topExpensiveTests.map(test => [
            test.testId,
            `$${test.costMetrics.estimatedCost.toFixed(4)}`,
            test.costMetrics.tokenUsage.model,
            test.costMetrics.tokenUsage.totalTokens.toString(),
            test.success ? '✅ Passed' : '❌ Failed',
            `${test.executionTime}ms`
          ])
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'expensive-tests.json'), expensiveTestsWidget, { spaces: 2 });

      // Generate cost efficiency widget
      const costEfficiencyWidget = {
        name: 'cost-efficiency',
        title: '⚡ Cost Efficiency',
        type: 'text',
        data: {
          title: 'Cost Efficiency Analysis',
          value: [
            `**Cost per Successful Test:** $${costReport.topExpensiveTests.filter(t => t.success).length > 0 ? 
              (costReport.totalCost / costReport.topExpensiveTests.filter(t => t.success).length).toFixed(4) : '0.0000'}`,
            `**Success Rate:** ${((costReport.topExpensiveTests.filter(t => t.success).length / costReport.totalTests) * 100).toFixed(1)}%`,
            `**Failed Test Cost:** $${costReport.topExpensiveTests.filter(t => !t.success).reduce((sum, test) => sum + test.costMetrics.estimatedCost, 0).toFixed(4)}`,
            `**Cost Optimization Score:** ${costReport.costSavings > 0 ? '🟡 Needs Optimization' : '🟢 Optimized'}`
          ].join('\n\n')
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-efficiency.json'), costEfficiencyWidget, { spaces: 2 });

      // Generate comprehensive dashboard widget
      const dashboardWidget = {
        name: 'cost-dashboard',
        title: '📊 Cost Analysis Dashboard',
        type: 'text',
        data: {
          title: 'AI Testing Cost Dashboard',
          value: [
            `## 📈 **Executive Summary**`,
            `**Total Investment:** $${costReport.totalCost.toFixed(4)}`,
            `**Tests Executed:** ${costReport.totalTests}`,
            `**Average ROI per Test:** $${costReport.averageCostPerTest.toFixed(4)}`,
            `**Potential Savings:** $${costReport.costSavings.toFixed(4)}`,
            ``,
            `## 🎯 **Key Metrics**`,
            `**Success Rate:** ${((costReport.topExpensiveTests.filter(t => t.success).length / costReport.totalTests) * 100).toFixed(1)}%`,
            `**Cost per Success:** $${costReport.topExpensiveTests.filter(t => t.success).length > 0 ? 
              (costReport.totalCost / costReport.topExpensiveTests.filter(t => t.success).length).toFixed(4) : '0.0000'}`,
            `**Failed Test Waste:** $${costReport.topExpensiveTests.filter(t => !t.success).reduce((sum, test) => sum + test.costMetrics.estimatedCost, 0).toFixed(4)}`,
            ``,
            `## 🚀 **Optimization Status**`,
            `${costReport.costSavings > 0 ? '🟡 **Optimization Needed** - ' + costReport.optimizationRecommendations.length + ' recommendations available' : '🟢 **Fully Optimized** - No further optimization needed'}`,
            ``,
            `## 📅 **Report Generated**`,
            `**Date:** ${new Date().toLocaleString()}`,
            `**Cost Tracking:** ${costReport.totalCost > 0 ? '✅ Active' : '⚠️ No AI costs detected'}`
          ].join('\n\n')
        }
      };

      await fs.writeJson(path.join(widgetsDir, 'cost-dashboard.json'), dashboardWidget, { spaces: 2 });

      console.log(chalk.blue('💰 Enhanced cost tracking widgets with graphs generated for Allure report'));

    } catch (error) {
      console.error(chalk.red('❌ Failed to generate cost tracking widgets:'), (error as Error).message);
    }
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

  private async generateCostSummaryFile(resultsDir: string): Promise<void> {
    try {
      const summaryFile = path.join(resultsDir, 'cost-summary.json');
      const costReport = await this.costTracker.generateCostReport();
      
      const summaryData = {
        title: 'AI Testing Cost Analysis',
        value: [
          `📊 **Total Tests Executed:** ${costReport.totalTests}`,
          `💵 **Total Cost:** $${costReport.totalCost.toFixed(4)}`,
          `📈 **Average Cost per Test:** $${costReport.averageCostPerTest.toFixed(4)}`,
          `🎯 **Potential Savings:** $${costReport.costSavings.toFixed(4)}`,
          `📅 **Report Generated:** ${new Date().toLocaleString()}`,
          `💡 **Cost Tracking Status:** ${costReport.totalCost > 0 ? 'Active' : 'No AI costs detected'}`
        ].join('\n\n')
      };

      await fs.writeJson(summaryFile, summaryData, { spaces: 2 });
      console.log(chalk.blue('💰 Cost summary file generated for Allure report'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate cost summary file:'), (error as Error).message);
    }
  }
} 