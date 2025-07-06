/**
 * 🧠 Dynamic AI Test Executor - 100% AI-Driven
 * No static parsing, no hardcoded steps, no predefined flows
 * Everything is handled by the AI agent dynamically
 * 
 * Inspired by Endorphin AI's fully dynamic approach
 */

import { Browser } from 'webdriverio';
import chalk from 'chalk';
import { SmartAIAgent } from './SmartAIAgent';
import { SMART_AGENT_CONFIG } from './SmartAgentConfig';
import { createAllSmartTools } from '../tools/SmartTools';
import { CostTracker } from './CostTracker';
import type { 
  TestDefinition, 
  TestRunOptions, 
  AIExecutionResult, 
  ExecutionStep, 
  TokenUsage, 
  TestCostData, 
  FrameworkConfig, 
  ExecutionStats, 
  TestData 
} from '../../types';

export class DynamicAITestExecutor {
  private browser: Browser | null = null;
  private smartAgent: SmartAIAgent | null = null;
  private costTracker: CostTracker | null = null;
  private steps: ExecutionStep[] = [];
  private screenshots: string[] = [];
  private tokenUsage: TokenUsage[] = [];
  private currentSession: any = null;

  constructor(config?: FrameworkConfig) {
    // Initialize cost tracker if enabled
    if (config?.costTracking?.enabled) {
      this.costTracker = new CostTracker(config);
    }
  }

  /**
   * Set browser and initialize Smart AI Agent with tools
   */
  setBrowser(browser: Browser): void {
    this.browser = browser;
    
    // Initialize Smart AI Agent with all tools
    this.smartAgent = new SmartAIAgent(SMART_AGENT_CONFIG);
          const smartTools = createAllSmartTools(browser);
    this.smartAgent.setTools(smartTools);
    
    console.log(chalk.green('🧠 Dynamic AI Test Executor initialized'));
    console.log(chalk.blue('🛠️ Smart tools available: Navigation, Click, Fill, Verify, Wait, Screenshot'));
    console.log(chalk.blue('💭 AI Agent will handle all test execution dynamically'));
  }

  /**
   * 🚀 Execute test with 100% AI-driven approach
   * No static parsing, no hardcoded steps, no predefined flows
   */
  async executeTest(test: TestDefinition, options: TestRunOptions = {}): Promise<AIExecutionResult> {
    if (!this.browser || !this.smartAgent) {
      throw new Error('Browser and Smart AI Agent not initialized. Call setBrowser() first.');
    }

    console.log(chalk.blue('🧠 Dynamic AI Test Executor starting...\n'));
    console.log(chalk.cyan(`🎯 Test: ${test.name}`));
    console.log(chalk.cyan(`📝 Description: ${test.description}`));

    const startTime = Date.now();

    try {
      // Handle async test case format dynamically
      let testData: TestData = test.testData || {};
      let setupData: TestData = {};
      let taskDescription: string;

      // Execute setup function if provided (AI will handle the setup)
      if (test.setup && typeof test.setup === 'function') {
        console.log(chalk.blue('🔧 Executing dynamic test setup...'));
        setupData = await test.setup();
        console.log(chalk.green('✅ Dynamic setup completed'));
      }

      // Execute data function if provided (AI will use this data)
      if (test.data && typeof test.data === 'function') {
        console.log(chalk.blue('📊 Generating dynamic test data...'));
        testData = { ...testData, ...(await test.data()) };
        console.log(chalk.green('✅ Dynamic data generated'));
      }

      // Get task description (AI will interpret this dynamically)
      if (typeof test.task === 'function') {
        console.log(chalk.blue('📝 Executing dynamic task function...'));
        taskDescription = await test.task(testData, setupData);
      } else {
        taskDescription = test.task;
      }

      console.log(chalk.cyan(`📝 Dynamic Task: ${taskDescription}`));

      // Navigate to the site (AI will handle this)
      if (test.site) {
        console.log(chalk.blue(`🌐 Navigating to: ${test.site}`));
        await this.browser.url(test.site);
        await this.browser.pause(2000);
        this.addStep('Navigate to site', `Successfully navigated to ${test.site}`, 'success');
      }

      // Create dynamic test session for the AI agent
      const session = {
        sessionId: `dynamic-session-${Date.now()}`,
        testName: test.name,
        startTime: Date.now(),
        agentHistory: [],
        totalCost: 0,
        totalTokens: 0,
      };

      this.currentSession = session;
      this.smartAgent.setCurrentSession(session);

      // 🧠 LET THE AI AGENT HANDLE EVERYTHING DYNAMICALLY
      console.log(chalk.blue('🧠 AI Agent taking control - no static parsing, no hardcoded steps'));
      console.log(chalk.blue('💭 AI will interpret the task and execute it dynamically'));
      
      const agentResult = await this.smartAgent.executeTask(taskDescription);

      // Add AI agent execution to steps
      this.addStep(
        'AI Agent Dynamic Execution', 
        agentResult.result, 
        agentResult.success ? 'success' : 'failed'
      );

      // Track cost and tokens
      if (this.costTracker && session) {
        const totalTokenUsage = this.getTotalTokenUsage();
        const costMetrics = this.costTracker.calculateCost(totalTokenUsage);
        
        const testCostData: TestCostData = {
          testId: test.id || test.name,
          sessionId: session.sessionId,
          costMetrics,
          executionTime: Date.now() - startTime,
          success: agentResult.success
        };

        await this.costTracker.trackTestCost(testCostData);
      }

      const duration = Date.now() - startTime;
      console.log(chalk.green(`✅ Dynamic AI execution completed in ${duration}ms`));
      console.log(chalk.blue(`💰 Total cost: $${session?.totalCost.toFixed(4) || '0.0000'}`));
      console.log(chalk.blue(`🧠 Total tokens: ${session?.totalTokens || 0}`));

      return {
        success: agentResult.success,
        steps: this.steps,
        screenshots: this.screenshots,
        errors: agentResult.success ? [] : [agentResult.result]
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(chalk.red(`❌ Dynamic AI execution failed: ${errorMsg}`));
      
      this.addStep('Dynamic AI Execution', `Failed: ${errorMsg}`, 'failed');
      
      return {
        success: false,
        steps: this.steps,
        screenshots: this.screenshots,
        errors: [errorMsg]
      };
    }
  }

  /**
   * Add execution step (for tracking purposes only)
   */
  private addStep(description: string, result: string, status: 'success' | 'failed' | 'pending'): void {
    this.steps.push({
      description,
      result,
      status,
      timestamp: new Date(),
      duration: 0
    });
  }

  /**
   * Get total token usage from AI agent
   */
  getTotalTokenUsage(): TokenUsage {
    const agentStats = this.smartAgent?.getSessionStats();
    if (agentStats) {
      return {
        promptTokens: agentStats.totalTokens * 0.7, // Estimate
        completionTokens: agentStats.totalTokens * 0.3, // Estimate
        totalTokens: agentStats.totalTokens,
        model: SMART_AGENT_CONFIG.openai.modelName,
        timestamp: new Date()
      };
    }
    
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      model: 'unknown',
      timestamp: new Date()
    };
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(): Promise<ExecutionStats> {
    const agentStats = this.smartAgent?.getSessionStats();
    
    return {
      totalSteps: this.steps.length,
      successfulSteps: this.steps.filter(s => s.status === 'success').length,
      failedSteps: this.steps.filter(s => s.status === 'failed').length,
      totalCost: agentStats?.totalCost || 0,
      tokenUsage: this.tokenUsage,
      screenshots: this.screenshots,
      adaptiveStrategies: [],
      fastMode: false,
      cacheStats: { size: 0, hitRate: 0 }
    };
  }

  /**
   * Get Smart AI Agent statistics
   */
  getSmartAgentStats() {
    return this.smartAgent?.getSessionStats() || null;
  }

  /**
   * Clear session and reset
   */
  clearSession(): void {
    this.smartAgent?.clearSession();
    this.steps = [];
    this.screenshots = [];
    this.tokenUsage = [];
    this.currentSession = null;
  }

  /**
   * Enable/disable Smart AI Agent
   */
  setSmartAgentMode(enabled: boolean): void {
    if (!enabled) {
      throw new Error('Dynamic AI Test Executor requires Smart AI Agent to be enabled');
    }
    console.log(chalk.blue('🧠 Smart AI Agent is required for dynamic execution'));
  }

  /**
   * Track cost for a test execution (compatibility method)
   */
  async trackTestCost(testId: string, sessionId: string, executionTime: number, success: boolean): Promise<void> {
    if (!this.costTracker) return;

    const totalTokenUsage = this.getTotalTokenUsage();
    const costMetrics = this.costTracker.calculateCost(totalTokenUsage);

    const testCostData: TestCostData = {
      testId,
      sessionId,
      costMetrics,
      executionTime,
      success
    };

    await this.costTracker.trackTestCost(testCostData);
  }
} 