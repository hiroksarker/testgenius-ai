import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { 
  TokenUsage, 
  CostMetrics, 
  TestCostData, 
  CostOptimizationReport,
  FrameworkConfig 
} from '../../types';

export class CostTracker {
  private config: FrameworkConfig;
  private costDataFile: string;
  private costHistoryFile: string;

  constructor(config: FrameworkConfig) {
    this.config = config;
    this.costDataFile = path.join(process.cwd(), 'cost-data.json');
    this.costHistoryFile = path.join(process.cwd(), 'cost-history.json');
  }

  /**
   * Calculate cost for token usage
   */
  calculateCost(tokenUsage: TokenUsage): CostMetrics {
    const model = tokenUsage.model;
    const pricing = this.config.costTracking?.modelPricing?.[model as keyof typeof this.config.costTracking.modelPricing];
    
    if (!pricing) {
      console.warn(chalk.yellow(`⚠️  No pricing found for model: ${model}`));
      return {
        tokenUsage,
        estimatedCost: 0,
        costCurrency: this.config.costTracking?.currency || 'USD',
        modelPricing: { inputCostPer1k: 0, outputCostPer1k: 0 }
      };
    }

    const inputCost = (tokenUsage.promptTokens / 1000) * pricing.inputCostPer1k;
    const outputCost = (tokenUsage.completionTokens / 1000) * pricing.outputCostPer1k;
    const totalCost = inputCost + outputCost;

    return {
      tokenUsage,
      estimatedCost: totalCost,
      costCurrency: this.config.costTracking?.currency || 'USD',
      modelPricing: pricing
    };
  }

  /**
   * Track cost for a test execution
   */
  async trackTestCost(testCostData: TestCostData): Promise<void> {
    if (!this.config.costTracking?.enabled) return;

    try {
      // Load existing cost data
      let costData: TestCostData[] = [];
      if (await fs.pathExists(this.costDataFile)) {
        costData = await fs.readJson(this.costDataFile);
      }

      // Add new cost data
      costData.push(testCostData);

      // Save updated cost data
      await fs.writeJson(this.costDataFile, costData, { spaces: 2 });

      // Update cost history
      await this.updateCostHistory(testCostData);

      console.log(chalk.blue(`💰 Cost tracked for test ${testCostData.testId}: $${testCostData.costMetrics.estimatedCost.toFixed(4)}`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to track cost:'), (error as Error).message);
    }
  }

  /**
   * Update cost history for trend analysis
   */
  private async updateCostHistory(testCostData: TestCostData): Promise<void> {
    try {
      let costHistory: any[] = [];
      if (await fs.pathExists(this.costHistoryFile)) {
        costHistory = await fs.readJson(this.costHistoryFile);
      }

      const today = new Date().toISOString().split('T')[0];
      const existingEntry = costHistory.find(entry => entry.date === today);

      if (existingEntry) {
        existingEntry.cost += testCostData.costMetrics.estimatedCost;
        existingEntry.tests += 1;
      } else {
        costHistory.push({
          date: today,
          cost: testCostData.costMetrics.estimatedCost,
          tests: 1
        });
      }

      await fs.writeJson(this.costHistoryFile, costHistory, { spaces: 2 });

    } catch (error) {
      console.error(chalk.red('❌ Failed to update cost history:'), (error as Error).message);
    }
  }

  /**
   * Generate cost optimization report
   */
  async generateCostReport(): Promise<CostOptimizationReport> {
    if (!this.config.costTracking?.enabled) {
      throw new Error('Cost tracking is not enabled');
    }

    try {
      const costData: TestCostData[] = await fs.readJson(this.costDataFile);
      const costHistory: any[] = await fs.readJson(this.costHistoryFile);

      const totalTests = costData.length;
      const totalCost = costData.reduce((sum, test) => sum + test.costMetrics.estimatedCost, 0);
      const averageCostPerTest = totalTests > 0 ? totalCost / totalTests : 0;

      // Calculate cost savings (if optimization is enabled)
      const costSavings = this.calculateCostSavings(costData);

      // Get optimization recommendations
      const optimizationRecommendations = this.generateOptimizationRecommendations(costData);

      // Get top expensive tests
      const topExpensiveTests = costData
        .sort((a, b) => b.costMetrics.estimatedCost - a.costMetrics.estimatedCost)
        .slice(0, 10);

      // Calculate cost by category (using test tags if available)
      const costByCategory = this.calculateCostByCategory(costData);

      return {
        totalTests,
        totalCost,
        averageCostPerTest,
        costSavings,
        optimizationRecommendations,
        costTrend: costHistory,
        topExpensiveTests,
        costByCategory
      };

    } catch (error) {
      console.error(chalk.red('❌ Failed to generate cost report:'), (error as Error).message);
      throw error;
    }
  }

  /**
   * Calculate potential cost savings
   */
  private calculateCostSavings(costData: TestCostData[]): number {
    if (!this.config.costTracking?.optimization?.trackCostSavings) return 0;

    let totalSavings = 0;

    costData.forEach(test => {
      // Calculate savings from using cheaper models
      const currentModel = test.costMetrics.tokenUsage.model;
      const currentCost = test.costMetrics.estimatedCost;

      // Suggest cheaper alternatives
      if (currentModel === 'gpt-4o' || currentModel === 'gpt-4') {
        const gpt35Cost = this.estimateCostWithModel(test.costMetrics.tokenUsage, 'gpt-3.5-turbo');
        const potentialSavings = currentCost - gpt35Cost;
        if (potentialSavings > 0) {
          totalSavings += potentialSavings;
        }
      }
    });

    return totalSavings;
  }

  /**
   * Estimate cost with a different model
   */
  private estimateCostWithModel(tokenUsage: TokenUsage, model: string): number {
    const pricing = this.config.costTracking?.modelPricing?.[model as keyof typeof this.config.costTracking.modelPricing];
    if (!pricing) return 0;

    const inputCost = (tokenUsage.promptTokens / 1000) * pricing.inputCostPer1k;
    const outputCost = (tokenUsage.completionTokens / 1000) * pricing.outputCostPer1k;
    return inputCost + outputCost;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(costData: TestCostData[]): string[] {
    const recommendations: string[] = [];

    // Analyze expensive tests
    const expensiveTests = costData.filter(test => test.costMetrics.estimatedCost > 0.1);
    if (expensiveTests.length > 0) {
      recommendations.push(`Consider using gpt-3.5-turbo for ${expensiveTests.length} expensive tests to save ~$${this.calculateCostSavings(expensiveTests).toFixed(2)}`);
    }

    // Analyze failed tests cost
    const failedTests = costData.filter(test => !test.success);
    if (failedTests.length > 0) {
      const failedCost = failedTests.reduce((sum, test) => sum + test.costMetrics.estimatedCost, 0);
      recommendations.push(`Failed tests cost $${failedCost.toFixed(2)} - improve test stability to reduce costs`);
    }

    // Analyze token usage patterns
    const avgTokens = costData.reduce((sum, test) => sum + test.costMetrics.tokenUsage.totalTokens, 0) / costData.length;
    if (avgTokens > 2000) {
      recommendations.push('Consider optimizing test descriptions to reduce token usage');
    }

    return recommendations;
  }

  /**
   * Calculate cost by category
   */
  private calculateCostByCategory(costData: TestCostData[]): { category: string; cost: number; tests: number }[] {
    const categoryMap = new Map<string, { cost: number; tests: number }>();

    costData.forEach(test => {
      // For now, categorize by model type - can be enhanced with test tags later
      const category = test.costMetrics.tokenUsage.model;
      const existing = categoryMap.get(category) || { cost: 0, tests: 0 };
      existing.cost += test.costMetrics.estimatedCost;
      existing.tests += 1;
      categoryMap.set(category, existing);
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      cost: data.cost,
      tests: data.tests
    }));
  }

  /**
   * Check budget limits and send alerts
   */
  async checkBudgetLimits(): Promise<void> {
    if (!this.config.costTracking?.budgetAlerts?.enabled) return;

    try {
      const costHistory: any[] = await fs.readJson(this.costHistoryFile);
      const today = new Date().toISOString().split('T')[0];
      const todayCost = costHistory.find(entry => entry.date === today)?.cost || 0;

      const dailyLimit = this.config.costTracking.budgetAlerts.dailyLimit;
      if (todayCost > dailyLimit) {
        console.warn(chalk.red(`⚠️  Daily budget limit exceeded: $${todayCost.toFixed(2)} / $${dailyLimit}`));
      }

      // Calculate monthly cost
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyCost = costHistory
        .filter(entry => new Date(entry.date) >= thirtyDaysAgo)
        .reduce((sum, entry) => sum + entry.cost, 0);

      const monthlyLimit = this.config.costTracking.budgetAlerts.monthlyLimit;
      if (monthlyCost > monthlyLimit) {
        console.warn(chalk.red(`⚠️  Monthly budget limit exceeded: $${monthlyCost.toFixed(2)} / $${monthlyLimit}`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to check budget limits:'), (error as Error).message);
    }
  }
} 