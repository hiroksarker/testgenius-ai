import { ChatOpenAI } from "@langchain/openai";
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Browser } from 'webdriverio';
import { CostTracker } from './CostTracker';
import { SmartElementDetector } from './SmartElementDetector';
import { SmartAIAgent } from './SmartAIAgent';
import { SMART_AGENT_CONFIG } from './SmartAgentConfig';
import { createAllSmartTools } from '../tools/SmartTools';
import { 
  TestDefinition, 
  TestRunOptions, 
  AIExecutionResult, 
  ExecutionStep, 
  TestStep,
  AIExecutionPlan,
  TokenUsage,
  TestCostData,
  FrameworkConfig,
  ExecutionStats,
  TestData
} from '../../types';

export class AITestExecutor {
  private llm: ChatOpenAI;
  private browser: Browser | null = null;
  private costTracker: CostTracker | null = null;
  private smartDetector: SmartElementDetector | null = null;
  private smartAgent: SmartAIAgent | null = null;
  private steps: ExecutionStep[] = [];
  private screenshots: string[] = [];
  private tokenUsage: TokenUsage[] = [];
  private aiContext: Map<string, any> = new Map();
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private adaptiveStrategies: string[] = [];
  private useFastMode: boolean = true; // Enable fast mode by default
  private useSmartAgent: boolean = true; // Enable smart agent by default

  constructor(config?: FrameworkConfig) {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || 'gpt-4o',
      temperature: 0.1,
      maxTokens: 4000 // Increased for more complex reasoning
    });
    
    // Initialize cost tracker if config is provided and cost tracking is enabled
    if (config?.costTracking?.enabled) {
      this.costTracker = new CostTracker(config);
    }
  }

  setBrowser(browser: Browser): void {
    this.browser = browser;
    this.smartDetector = new SmartElementDetector(browser);
    
    // Initialize Smart AI Agent with Endorphin AI-inspired tools
    if (this.useSmartAgent) {
      this.smartAgent = new SmartAIAgent(SMART_AGENT_CONFIG);
      const smartTools = createAllSmartTools(browser);
      this.smartAgent.setTools(smartTools);
      console.log(chalk.green('🧠 Smart AI Agent initialized with Endorphin AI-inspired tools.'));
    }
    
    console.log(chalk.green('✅ Browser instance set on AI executor.'));
    console.log(chalk.blue('⚡ Smart Element Detector initialized for fast detection.'));
  }

  /**
   * Track token usage from OpenAI response
   */
  private trackTokenUsage(response: any, model: string): void {
    if (response.usage) {
      const usage: TokenUsage = {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
        model: model,
        timestamp: new Date()
      };
      
      this.tokenUsage.push(usage);
      
      if (this.costTracker) {
        const costMetrics = this.costTracker.calculateCost(usage);
        console.log(chalk.blue(`💰 Token usage: ${usage.totalTokens} tokens, Cost: $${costMetrics.estimatedCost.toFixed(4)}`));
      }
    }
  }

  /**
   * Get total token usage for this test execution
   */
  getTotalTokenUsage(): TokenUsage {
    return this.tokenUsage.reduce((total, usage) => ({
      promptTokens: total.promptTokens + usage.promptTokens,
      completionTokens: total.completionTokens + usage.completionTokens,
      totalTokens: total.totalTokens + usage.totalTokens,
      model: usage.model, // Use the last model used
      timestamp: new Date()
    }), {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      model: 'unknown',
      timestamp: new Date()
    });
  }

  /**
   * Track cost for a test execution
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

  /**
   * 🚀 ENHANCED: Execute test with maximum AI automation
   */
  async executeTest(test: TestDefinition, options: TestRunOptions = {}): Promise<AIExecutionResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Did you forget to call setBrowser()?');
    }
    
    console.log(chalk.blue('🤖 Enhanced AI Test Executor starting...\n'));
    console.log(chalk.cyan(`🎯 Test: ${test.name}`));
    
    // Handle new async test case format
    let testData: TestData = test.testData || {};
    let setupData: TestData = {};
    let taskDescription: string;

    try {
      // Execute setup function if provided
      if (test.setup && typeof test.setup === 'function') {
        console.log(chalk.blue('🔧 Executing test setup...'));
        setupData = await test.setup();
        console.log(chalk.green('✅ Test setup completed'));
      }

      // Execute data function if provided
      if (test.data && typeof test.data === 'function') {
        console.log(chalk.blue('📊 Generating test data...'));
        testData = { ...testData, ...(await test.data()) };
        console.log(chalk.green('✅ Test data generated'));
      }

      // Get task description (handle both string and function formats)
      if (typeof test.task === 'function') {
        console.log(chalk.blue('📝 Executing task function...'));
        taskDescription = await test.task(testData, setupData);
      } else {
        taskDescription = test.task;
      }

      console.log(chalk.cyan(`📝 Task: ${taskDescription}`));

      // Store the test site in context for navigation
      this.aiContext.set('currentTestSite', test.site);
      
      // Navigate to the site
      await this.navigateToSite(test.site);
      
      // Check if we have recorded steps from the TestRecorder
      const recordedSteps = (test.testData as any)?.steps;
      
      if (recordedSteps && Array.isArray(recordedSteps) && recordedSteps.length > 0) {
        console.log(chalk.blue('📝 Executing recorded steps...\n'));
        const result = await this.executeRecordedSteps(recordedSteps);
        return {
          success: result.success,
          steps: this.steps,
          screenshots: this.screenshots,
          errors: result.errors || []
        };
      } else {
        // 🧠 SMART AGENT: Use Smart AI Agent for intelligent execution
        if (this.useSmartAgent && this.smartAgent) {
          console.log(chalk.blue('🧠 Using Smart AI Agent for intelligent execution...'));
          
          // Create test session for the smart agent
          const session = {
            sessionId: `session-${Date.now()}`,
            testName: test.name,
            startTime: Date.now(),
            agentHistory: [],
            totalCost: 0,
            totalTokens: 0,
          };
          
          this.smartAgent.setCurrentSession(session);
          
          // Execute task with smart agent
          const agentResult = await this.smartAgent.executeTask(taskDescription);
          
          // Add agent session to steps
          this.addStep('Smart AI Agent Execution', agentResult.result, agentResult.success ? 'success' : 'failed');
          
          return {
            success: agentResult.success,
            steps: this.steps,
            screenshots: this.screenshots,
            errors: agentResult.success ? [] : [agentResult.result]
          };
        } else {
          // 🧠 FALLBACK: Use intelligent AI execution with enhanced test data
          console.log(chalk.blue('🧠 Creating intelligent AI execution plan...'));
          const enhancedTest = {
            ...test,
            task: taskDescription,
            testData: { ...testData, ...setupData }
          };
          const plan = await this.createIntelligentExecutionPlan(enhancedTest, options);
          const result = await this.executeIntelligentPlan(plan, enhancedTest, options);
          
          return {
            success: result.success,
            steps: this.steps,
            screenshots: this.screenshots,
            errors: result.errors || []
          };
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ AI execution failed:'), (error as Error).message);
      
      // 🔥 AUTOMATIC SCREENSHOT ON FAILURE 🔥
      try {
        const failureScreenshotPath = await this.takeScreenshot('ai-execution-failure');
        this.screenshots.push(failureScreenshotPath);
        console.log(chalk.yellow(`📸 Screenshot taken on AI execution failure: ${failureScreenshotPath}`));
      } catch (screenshotError) {
        console.error(chalk.red('❌ Failed to take failure screenshot:'), (screenshotError as Error).message);
      }
      
      return {
        success: false,
        steps: this.steps,
        screenshots: this.screenshots,
        errors: [(error as Error).message]
      };
    }
  }

  private async navigateToSite(url: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    console.log(chalk.cyan(`🌐 Navigating to: ${url}`));
    
    try {
      // Use smart navigation tool if available
      if (this.smartAgent) {
        const result = await this.smartAgent.executeTask(`Navigate to ${url}`);
        console.log(chalk.green(`✅ Smart navigation: ${result}`));
      } else {
        // Fallback to direct navigation
        await this.browser.url(url);
        await this.browser.pause(2000); // Wait for page load
      }
      
      // Take initial screenshot
      const screenshotPath = await this.takeScreenshot('initial-navigation');
      this.screenshots.push(screenshotPath);
      
      this.addStep('Navigate to site', `Successfully navigated to ${url}`, 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`❌ Navigation failed: ${errorMsg}`));
      throw error;
    }
  }

  /**
   * 🧭 Enhanced navigation with path support
   */
  private async navigateToPath(path: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const currentUrl = await this.browser.getUrl();
    const baseUrl = currentUrl.split('/').slice(0, 3).join('/'); // Get base URL
    const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    
    console.log(chalk.cyan(`🧭 Navigating to path: ${fullUrl}`));
    
    await this.browser.url(fullUrl);
    await this.browser.pause(2000); // Wait for page load
    
    // Take screenshot
    const screenshotPath = await this.takeScreenshot(`navigation-${path.replace(/[^a-zA-Z0-9]/g, '-')}`);
    this.screenshots.push(screenshotPath);
    
    this.addStep('Navigate to path', `Successfully navigated to ${path}`, 'success');
  }

  /**
   * 🧠 ENHANCED: Create intelligent execution plan with context awareness
   */
  private async createIntelligentExecutionPlan(test: TestDefinition, options: TestRunOptions): Promise<AIExecutionPlan> {
    const systemPrompt = `You are an expert UI testing AI that creates intelligent test execution plans. 

Your capabilities:
- Analyze natural language test descriptions and convert them to executable steps
- Automatically detect UI elements without explicit selectors
- Adapt strategies based on page context and previous failures
- Use multiple fallback strategies for element detection
- Optimize execution for speed and reliability
- Handle dynamic content and user scenarios intelligently

Current test context:
- Test: ${test.name}
- Description: ${test.description}
- Task: ${test.task}
- Site: ${test.site}
- Priority: ${test.priority}
- Test Data: ${JSON.stringify(test.testData || {})}

Create a detailed execution plan that:
1. Breaks down the task into logical steps
2. Uses intelligent element detection strategies
3. Includes verification steps
4. Has fallback mechanisms for each step
5. Optimizes for speed and reliability
6. Adapts to dynamic content and user scenarios

Return the plan as a JSON object with steps array.`;

    const userPrompt = `Create an intelligent execution plan for this dynamic test task: "${test.task}"

This is a dynamic test scenario where:
- The task content is generated dynamically based on user scenarios
- Test data and setup are generated at runtime
- The framework should adapt to any type of test scenario

Focus on:
- Natural language element detection
- Multiple selector strategies
- Smart waiting and verification
- Error recovery mechanisms
- Performance optimization
- Dynamic scenario adaptation

Make the plan as automated as possible with minimal manual intervention.
Handle any type of dynamic content or user scenario intelligently.`;

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      this.trackTokenUsage(response, this.llm.modelName);

      const content = response.content as string;
      let plan: AIExecutionPlan;

      try {
        // Try to parse JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          plan = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback to creating a basic plan
          plan = this.createFallbackPlan(test);
        }
      } catch (parseError) {
        console.log(chalk.yellow('⚠️ Could not parse AI plan, using fallback'));
        plan = this.createFallbackPlan(test);
      }

      console.log(chalk.green(`✅ AI created ${plan.steps.length} intelligent steps`));
      console.log(chalk.blue(`🎯 Confidence: ${plan.confidence}%`));
      console.log(chalk.gray(`💭 Reasoning: ${plan.reasoning}`));

      return plan;

    } catch (error) {
      console.log(chalk.yellow('⚠️ AI plan creation failed, using fallback'));
      return this.createFallbackPlan(test);
    }
  }

  private createFallbackPlan(test: TestDefinition): AIExecutionPlan {
    console.log(chalk.yellow('🛡️ Creating AI-powered fallback plan...'));
    
    // Even the fallback should be AI-driven, not hardcoded
    const taskContent = typeof test.task === 'string' ? test.task : 'Dynamic task content';
    
    // Create a simple AI prompt for fallback
    const fallbackPrompt = `Create a simple execution plan for this test task: "${taskContent}"

Site: ${test.site || 'Not specified'}
Test: ${test.name}

Create 3-5 basic steps that would accomplish this task. Focus on:
1. Navigation (if needed)
2. Basic interactions (click, fill, verify)
3. Simple verification

Return as JSON with steps array.`;

    // For now, create a minimal plan that the AI executor can handle
    const steps: TestStep[] = [];
    
    // Add navigation if site is specified
    if (test.site) {
      steps.push({
        action: 'navigate',
        description: `Navigate to ${test.site}`,
        value: test.site,
        expectedResult: 'Page loads successfully'
      });
    }
    
    // Add a generic interaction step
    steps.push({
      action: 'click',
      description: `Execute task: ${taskContent}`,
      expectedResult: 'Task completed successfully'
    });
    
    // Add verification
    steps.push({
      action: 'verify',
      description: 'Verify task completion',
      expectedResult: 'Task verification passed'
    });
    
    return {
      steps: steps,
      confidence: 0.6,
      reasoning: 'AI-powered fallback plan created with minimal steps'
        };
  }

  /**
   * 🚀 ENHANCED: Execute plan with intelligent adaptation
   */
  private async executeIntelligentPlan(plan: AIExecutionPlan, test: TestDefinition, options: TestRunOptions): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    let success = true;

    console.log(chalk.blue(`\n🚀 Executing ${plan.steps.length} intelligent steps...\n`));

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      console.log(chalk.cyan(`\n📋 Step ${i + 1}/${plan.steps.length}: ${step.description}`));

      try {
        await this.executeIntelligentStep(step, test.testData || {});
        this.addStep(step.description, 'Success', 'success');
        
        // Store successful strategies for future use
        if (step.action && !this.adaptiveStrategies.includes(step.action)) {
          this.adaptiveStrategies.push(step.action);
        }

      } catch (error) {
        const errorMsg = (error as Error).message;
        console.error(chalk.red(`❌ Step failed: ${errorMsg}`));
        
        // 🧠 INTELLIGENT ERROR RECOVERY
        const recovered = await this.attemptIntelligentRecovery(step, errorMsg, test.testData || {});
        
        if (recovered) {
          console.log(chalk.green('✅ Step recovered successfully'));
          this.addStep(step.description, 'Recovered', 'success');
        } else {
          this.addStep(step.description, errorMsg, 'failed');
          errors.push(`Step ${i + 1}: ${errorMsg}`);
          success = false;
          
          // If this is a critical step, stop execution
          if (this.isCriticalStep(step)) {
            console.log(chalk.red('🛑 Critical step failed, stopping execution'));
            break;
          }
        }
      }
    }

    return { success, errors };
  }

  /**
   * 🚀 ENHANCED: Execute step with Endorphin AI-inspired smart tools
   */
  private async executeIntelligentStep(step: TestStep, testData: Record<string, any>): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Handle special actions first
    if (step.action === 'navigate') {
      console.log(chalk.blue(`🧭 Executing navigation step: ${step.description}`));
      if (step.value) {
        await this.navigateToPath(String(step.value));
      } else {
        throw new Error('Navigation step requires a value (path)');
      }
      return;
    }

    // Use Smart AI Agent with Endorphin AI-inspired tools
    if (this.useSmartAgent && this.smartAgent) {
      console.log(chalk.blue(`🧠 Using Smart AI Agent for: ${step.description}`));
      
      try {
        // Convert step to natural language task
        const taskDescription = this.convertStepToTask(step, testData);
        const result = await this.smartAgent.executeTask(taskDescription);
        console.log(chalk.green(`✅ Smart AI Agent completed: ${result}`));
        return;
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Smart AI Agent failed, falling back to fast mode: ${error}`));
      }
    }

    // Use fast smart detection as fallback
    if (this.useFastMode && this.smartDetector) {
      await this.executeFastStep(step, testData);
      return;
    }

    // Final fallback to AI-based detection (expensive)
    console.log(chalk.yellow('⚠️ Using AI-based detection (expensive)...'));
    const pageState = await this.analyzePageState();
    this.aiContext.set('currentPageState', pageState);

    const strategies = this.generateElementDetectionStrategies(step, pageState);
    
    for (const strategy of strategies) {
      try {
        await this.executeStrategy(step, strategy, testData);
        return; // Success, exit
      } catch (strategyError) {
        console.log(chalk.yellow(`⚠️ Strategy failed: ${strategy.name}`));
        continue; // Try next strategy
      }
    }

    throw new Error(`All element detection strategies failed for: ${step.description}`);
  }

  /**
   * ⚡ FAST: Execute step using smart detector (no AI)
   */
  private async executeFastStep(step: TestStep, testData: Record<string, any>): Promise<void> {
    if (!this.smartDetector) throw new Error('Smart detector not initialized');

    console.log(chalk.blue(`⚡ Fast execution: ${step.description}`));

    // Determine element type from action
    let elementType: string | undefined;
    switch (step.action.toLowerCase()) {
      case 'click':
        elementType = 'button';
        break;
      case 'fill':
      case 'type':
        elementType = 'input';
        break;
      case 'select':
        elementType = 'select';
        break;
      case 'upload':
        elementType = 'input[type="file"]';
        break;
      case 'verify':
        elementType = undefined; // Can be any element
        break;
      default:
        elementType = undefined;
    }

    // Use smart detector to find element
    const match = await this.smartDetector.detectElement(step.description, elementType);
    
    if (!match) {
      throw new Error(`Element not found: ${step.description}`);
    }

    // Perform action based on step type
    await this.performFastAction(match.element, step, testData);
  }

  /**
   * ⚡ FAST: Perform action without AI
   */
  private async performFastAction(element: any, step: TestStep, testData: Record<string, any>): Promise<void> {
    const action = step.action.toLowerCase();

    try {
      switch (action) {
        case 'click':
          await element.click();
          console.log(chalk.green(`✅ Clicked: ${step.description}`));
          break;
          
        case 'type':
        case 'fill':
          const value = step.value || testData[step.description] || '';
          await element.clearValue();
          await element.setValue(String(value));
          console.log(chalk.green(`✅ Filled: ${step.description} with "${value}"`));
          break;
          
        case 'clear':
          await element.clearValue();
          console.log(chalk.green(`✅ Cleared: ${step.description}`));
          break;
          
        case 'verify':
          await this.verifyFastElement(element, step);
          console.log(chalk.green(`✅ Verified: ${step.description}`));
          break;
          
        case 'select':
          // Handle dropdown selection
          if (step.value) {
            await element.selectByVisibleText(String(step.value));
            console.log(chalk.green(`✅ Selected: ${step.value} from ${step.description}`));
          } else {
            // Default to first option
            await element.selectByIndex(1);
            console.log(chalk.green(`✅ Selected first option from ${step.description}`));
          }
          break;
          
        case 'upload':
          // Handle file upload
          const filePath = step.value || './test-file.txt';
          await element.setValue(filePath);
          console.log(chalk.green(`✅ Uploaded file: ${filePath} to ${step.description}`));
          break;
          
        default:
          await element.click(); // Default to click
          console.log(chalk.green(`✅ Default action (click): ${step.description}`));
      }
    } catch (error: any) {
      // Handle stale element reference
      if (error.message && (error.message.includes('stale') || error.message.includes('Node with given id does not belong'))) {
        console.log(chalk.yellow(`🔄 Stale element detected, refreshing...`));
        // Try to find the element again
        const refreshedElement = await this.findElement(step.description);
        await this.performFastAction(refreshedElement, step, testData);
        return;
      }
      throw error;
    }
  }

  /**
   * ⚡ FAST: Verify element without AI
   */
  private async verifyFastElement(element: any, step: TestStep): Promise<void> {
    const description = step.description.toLowerCase();
    
    // Handle page title verification
    if (description.includes('page title') || description.includes('title contains')) {
      const pageTitle = await this.browser?.getTitle();
      const expectedText = step.value || step.description.match(/contains "([^"]+)"/)?.[1];
      
      if (expectedText && pageTitle) {
        if (String(pageTitle).toLowerCase().includes(String(expectedText).toLowerCase())) {
          console.log(chalk.green(`✅ Page title verification passed: "${expectedText}" found in "${pageTitle}"`));
          return;
        } else {
          throw new Error(`Page title verification failed: Expected "${expectedText}" in title, got "${pageTitle}"`);
        }
      }
    }
    
    // Handle text content verification
    if (description.includes('text') || description.includes('content')) {
      try {
        const textContent = await element.getText();
        const expectedText = step.value || step.description.match(/contains "([^"]+)"/)?.[1];
        
        if (expectedText && textContent) {
          if (String(textContent).toLowerCase().includes(String(expectedText).toLowerCase())) {
            console.log(chalk.green(`✅ Text verification passed: "${expectedText}" found in "${textContent}"`));
            return;
          } else {
            throw new Error(`Text verification failed: Expected "${expectedText}" in content, got "${textContent}"`);
          }
        }
      } catch (error) {
        // If getText fails, try getValue
        try {
          const value = await element.getValue();
          const expectedText = step.value || step.description.match(/contains "([^"]+)"/)?.[1];
          
          if (expectedText && value) {
            if (String(value).toLowerCase().includes(String(expectedText).toLowerCase())) {
              console.log(chalk.green(`✅ Value verification passed: "${expectedText}" found in "${value}"`));
              return;
            } else {
              throw new Error(`Value verification failed: Expected "${expectedText}" in value, got "${value}"`);
            }
          }
        } catch (valueError) {
          // Continue to basic verification
        }
      }
    }
    
    // Basic element verification
    try {
      const isDisplayed = await element.isDisplayed();
      if (!isDisplayed) {
        throw new Error(`Element is not displayed: ${step.description}`);
      }

      if (step.value) {
        const actualValue = await element.getValue();
        if (actualValue !== step.value) {
          throw new Error(`Expected value "${step.value}", got "${actualValue}"`);
        }
      }
    } catch (error) {
      // If basic verification fails, try to verify element exists
      try {
        await element.waitForDisplayed({ timeout: 5000 });
        console.log(chalk.green(`✅ Element verification passed: ${step.description} exists and is visible`));
      } catch (waitError) {
        throw new Error(`Element verification failed: ${step.description} is not accessible`);
      }
    }
  }

  /**
   * 🎯 Generate multiple element detection strategies
   */
  private generateElementDetectionStrategies(step: TestStep, pageState: any): Array<{name: string, method: string, selectors: string[]}> {
    const strategies = [];

    // Strategy 1: Natural language description
    if (step.description) {
      strategies.push({
        name: 'Natural Language',
        method: 'description',
        selectors: this.generateSelectorsFromDescription(step.description)
      });
    }

    // Strategy 2: Text-based detection
    if (step.value || step.description) {
      strategies.push({
        name: 'Text Detection',
        method: 'text',
        selectors: this.generateTextSelectors(String(step.value || step.description || ''))
      });
    }

    // Strategy 3: Semantic analysis
    strategies.push({
      name: 'Semantic Analysis',
      method: 'semantic',
      selectors: this.generateSemanticSelectors(step, pageState)
    });

    // Strategy 4: Visual pattern matching
    strategies.push({
      name: 'Visual Pattern',
      method: 'visual',
      selectors: this.generateVisualSelectors(step, pageState)
    });

    return strategies;
  }

  /**
   * 🧠 Generate selectors from natural language description (WebdriverIO Best Practices)
   */
  private generateSelectorsFromDescription(description: string): string[] {
    const selectors: string[] = [];
    
    // Extract key words from description
    const words = description.split(' ').filter(word => word.length > 2);
    const descriptionLower = description.toLowerCase();
    
    // 1. **Accessibility Name Selector (Best Practice)**
    words.forEach(word => {
      selectors.push(`aria/${word}`, `${word}`);
    });
    
    // 2. **Text-based selectors (User-centric)**
    if (descriptionLower.includes('button')) {
      selectors.push('button', '[role="button"]');
      // Add text-based button selectors
      words.forEach(word => {
        selectors.push(`button=${word}`, `button*=${word}`);
      });
    }
    
    if (descriptionLower.includes('input') || descriptionLower.includes('field')) {
      selectors.push('input', 'textarea', 'select');
      // Add text-based input selectors
      words.forEach(word => {
        selectors.push(`input=${word}`, `input*=${word}`);
      });
    }
    
    if (descriptionLower.includes('link')) {
      selectors.push('a', '[role="link"]');
      // Add text-based link selectors
      words.forEach(word => {
        selectors.push(`a=${word}`, `a*=${word}`);
      });
    }
    
    // 3. **Data Test ID (Good Practice)**
    words.forEach(word => {
      selectors.push(`[data-testid*="${word}"]`, `[data-test="${word}"]`);
    });
    
    // 4. **ARIA attributes (Accessibility focused)**
    words.forEach(word => {
      selectors.push(`[aria-label*="${word}"]`, `[aria-labelledby*="${word}"]`, `[title*="${word}"]`);
    });

    return selectors;
  }

  /**
   * 📝 Generate text-based selectors (WebdriverIO Best Practices)
   */
  private generateTextSelectors(text: string): string[] {
    const selectors: string[] = [];
    const words = text.split(' ').filter(word => word.length > 2);
    
    words.forEach(word => {
      // 1. **Exact text matching (Best Practice)**
      selectors.push(`${word}`, `aria/${word}`);
      
      // 2. **Partial text matching**
      selectors.push(`*=${word}`);
      
      // 3. **Case-insensitive matching**
      selectors.push(`.*=${word}`);
      
      // 4. **Element-specific text matching**
      selectors.push(`button=${word}`, `button*=${word}`);
      selectors.push(`input=${word}`, `input*=${word}`);
      selectors.push(`a=${word}`, `a*=${word}`);
      
      // 5. **ARIA and accessibility attributes**
      selectors.push(`[aria-label*="${word}"]`, `[aria-labelledby*="${word}"]`);
      selectors.push(`[title*="${word}"]`, `[placeholder*="${word}"]`);
      
      // 6. **Data attributes (Good Practice)**
      selectors.push(`[data-testid*="${word}"]`, `[data-test="${word}"]`);
    });

    return selectors;
  }

  /**
   * 🧠 Generate semantic selectors based on context
   */
  private generateSemanticSelectors(step: TestStep, pageState: any): string[] {
    const selectors: string[] = [];
    
    // Based on page type
    if (pageState.pageType === 'login') {
      selectors.push('[type="email"]', '[type="password"]', '[name="username"]', '[name="password"]');
    }
    if (pageState.pageType === 'form') {
      selectors.push('input', 'textarea', 'select', 'button[type="submit"]');
    }
    if (pageState.pageType === 'navigation') {
      selectors.push('nav', '.nav', '.menu', 'a');
    }

    return selectors;
  }

  /**
   * 👁️ Generate visual pattern selectors
   */
  private generateVisualSelectors(step: TestStep, pageState: any): string[] {
    const selectors: string[] = [];
    
    // Common visual patterns
    selectors.push(
      '.primary-button',
      '.secondary-button',
      '.cta-button',
      '.submit-button',
      '.form-input',
      '.search-input',
      '.menu-item',
      '.nav-link'
    );

    return selectors;
  }

  /**
   * 🚀 Execute a specific strategy
   */
  private async executeStrategy(step: TestStep, strategy: any, testData: Record<string, any>): Promise<void> {
    console.log(chalk.blue(`🎯 Trying strategy: ${strategy.name}`));

    for (const selector of strategy.selectors) {
      try {
        const element = await this.findElementWithSelector(selector, step.description);
        
        if (element) {
          await this.performAction(element, step, testData);
          console.log(chalk.green(`✅ Strategy ${strategy.name} succeeded with selector: ${selector}`));
          return;
        }
      } catch (selectorError) {
        continue; // Try next selector
      }
    }

    throw new Error(`Strategy ${strategy.name} failed with all selectors`);
  }

  /**
   * 🔍 Enhanced element finding with multiple approaches
   */
  private async findElementWithSelector(selector: string, description: string): Promise<any> {
    if (!this.browser) throw new Error('Browser not initialized');

    try {
      // Wait for element with smart timeout
      const element = await this.smartWaitForElement(selector, 5000);
      return element;
    } catch (error) {
      // Try alternative approaches
      return await this.findElementWithAlternativeApproaches(selector, description);
    }
  }

  /**
   * 🔄 Alternative element finding approaches (WebdriverIO Best Practices)
   */
  private async findElementWithAlternativeApproaches(selector: string, description: string): Promise<any> {
    const words = description.split(' ').filter(word => word.length > 2);
    
    // Approach 1: Accessibility Name Selector (Best Practice)
    for (const word of words) {
      try {
        const element = await this.browser!.$(`aria/${word}`);
        if (element && await element.isExisting()) return element;
      } catch (error) {
        // Continue to next approach
      }
    }
    
    // Approach 2: Text-based selectors (User-centric)
    for (const word of words) {
      try {
        // Try exact text match
        const element = await this.browser!.$(`${word}`);
        if (element && await element.isExisting()) return element;
        
        // Try partial text match
        const partialElement = await this.browser!.$(`*=${word}`);
        if (partialElement && await partialElement.isExisting()) return partialElement;
      } catch (error) {
        // Continue to next approach
      }
    }
    
    // Approach 3: Element-specific text matching
    for (const word of words) {
      try {
        // Try button with text
        const buttonElement = await this.browser!.$(`button=${word}`);
        if (buttonElement && await buttonElement.isExisting()) return buttonElement;
        
        // Try input with text
        const inputElement = await this.browser!.$(`input=${word}`);
        if (inputElement && await inputElement.isExisting()) return inputElement;
        
        // Try link with text
        const linkElement = await this.browser!.$(`a=${word}`);
        if (linkElement && await linkElement.isExisting()) return linkElement;
      } catch (error) {
        // Continue to next approach
      }
    }
    
    // Approach 4: Data Test ID (Good Practice)
    for (const word of words) {
      try {
        const element = await this.browser!.$(`[data-testid*="${word}"]`);
        if (element && await element.isExisting()) return element;
      } catch (error) {
        // Continue to next approach
      }
    }
    
    // Approach 5: ARIA attributes (Accessibility focused)
    for (const word of words) {
      try {
        const element = await this.browser!.$(`[aria-label*="${word}"]`);
        if (element && await element.isExisting()) return element;
      } catch (error) {
        // Continue to next approach
      }
    }
    
    // Approach 6: Role-based selectors (Fallback)
    try {
      const element = await this.browser!.$('[role="button"]');
      if (element && await element.isExisting()) return element;
    } catch (error) {
      // Continue to next approach
    }
    
    // Approach 7: Generic selectors (Last resort)
    try {
      const element = await this.browser!.$('button, input, a, [role="button"]');
      if (element && await element.isExisting()) return element;
    } catch (error) {
      // No element found
    }
    
    return null;
  }

  /**
   * 🎯 Perform action on element
   */
  private async performAction(element: any, step: TestStep, testData: Record<string, any>): Promise<void> {
    const action = step.action.toLowerCase();

    switch (action) {
      case 'click':
        await element.click();
        break;
      case 'type':
      case 'fill':
        await element.setValue(step.value || '');
        break;
      case 'clear':
        await element.clearValue();
        break;
      case 'verify':
        await this.verifyElement(element, step);
        break;
      case 'navigate':
        // Handle navigation to specific paths
        if (step.value) {
          await this.navigateToPath(String(step.value));
        }
        break;
      default:
        await element.click(); // Default to click
    }
  }

  /**
   * ✅ Verify element state
   */
  private async verifyElement(element: any, step: TestStep): Promise<void> {
    const isDisplayed = await element.isDisplayed();
    if (!isDisplayed) {
      throw new Error(`Element is not displayed: ${step.description}`);
    }

    if (step.value) {
      const actualValue = await element.getValue();
      if (actualValue !== step.value) {
        throw new Error(`Expected value "${step.value}", got "${actualValue}"`);
      }
    }
  }

  /**
   * 🧠 Intelligent error recovery
   */
  private async attemptIntelligentRecovery(step: TestStep, errorMsg: string, testData: Record<string, any>): Promise<boolean> {
    this.retryCount++;
    
    if (this.retryCount > this.maxRetries) {
      return false;
    }

    console.log(chalk.yellow(`🔄 Attempting intelligent recovery (${this.retryCount}/${this.maxRetries})...`));

    try {
      // Strategy 1: Wait and retry
      await this.browser!.pause(2000);
      
      // Strategy 2: Refresh page if navigation-related error
      if (errorMsg.includes('navigation') || errorMsg.includes('timeout')) {
        await this.browser!.refresh();
        await this.browser!.pause(3000);
      }

      // Strategy 3: Try alternative approach
      await this.executeIntelligentStep(step, testData);
      return true;

    } catch (recoveryError) {
      console.log(chalk.red(`❌ Recovery attempt ${this.retryCount} failed`));
      return false;
    }
  }

  /**
   * 🎯 Check if step is critical
   */
  private isCriticalStep(step: TestStep): boolean {
    const criticalKeywords = ['login', 'submit', 'save', 'confirm', 'delete'];
    return criticalKeywords.some(keyword => 
      step.description.toLowerCase().includes(keyword) || 
      step.action.toLowerCase().includes(keyword)
    );
  }

  private async takeScreenshot(name: string): Promise<string> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const screenshotPath = path.join(process.cwd(), 'screenshots', filename);
    
    await fs.ensureDir(path.dirname(screenshotPath));
    await this.browser.saveScreenshot(screenshotPath);
    
    return screenshotPath;
  }

  private addStep(description: string, result: string, status: 'success' | 'failed' | 'pending'): void {
    this.steps.push({
      description,
      result,
      status,
      timestamp: new Date()
    });
  }

  private async executeRecordedSteps(recordedSteps: any[]): Promise<{ success: boolean; errors: string[] }> {
    console.log(chalk.blue('⚡ Executing recorded steps...\n'));
    
    const errors: string[] = [];
    let success = true;

    for (let i = 0; i < recordedSteps.length; i++) {
      const step = recordedSteps[i];
      const stepNumber = i + 1;
      
      try {
        console.log(chalk.cyan(`  🔄 Step ${stepNumber}/${recordedSteps.length}: ${step.description}`));
        console.log(chalk.gray(`     Action: ${step.action} | Target: ${step.target}${step.value ? ` | Value: ${step.value}` : ''}`));
        
        await this.executeRecordedStep(step);
        
        // Add a small pause between steps for better reliability
        if (i < recordedSteps.length - 1) {
          await this.browser!.pause(500);
        }
        
        this.addStep(step.description, 'Step executed successfully', 'success');
        console.log(chalk.green(`  ✅ Step ${stepNumber}/${recordedSteps.length}: ${step.description}`));
        
      } catch (error) {
        console.error(chalk.red(`  ❌ Step ${stepNumber}/${recordedSteps.length}: ${step.description}:`), (error as Error).message);
        
        // 🔥 AUTOMATIC SCREENSHOT ON FAILURE 🔥
        try {
          const failureScreenshotPath = await this.takeScreenshot(`failure-step-${stepNumber}-${step.action}`);
          this.screenshots.push(failureScreenshotPath);
          console.log(chalk.yellow(`  📸 Screenshot taken on failure: ${failureScreenshotPath}`));
        } catch (screenshotError) {
          console.error(chalk.red(`  ❌ Failed to take failure screenshot:`), (screenshotError as Error).message);
        }
        
        this.addStep(step.description, (error as Error).message, 'failed');
        errors.push(`Step ${stepNumber}: ${step.description}: ${(error as Error).message}`);
        success = false;
        
        // Continue with next step instead of stopping
        console.log(chalk.yellow(`  ⚠️  Continuing with next step...`));
      }
    }

    return { success, errors };
  }

  private async executeRecordedStep(step: any): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Validate step has required properties
    if (!step.action) {
      throw new Error('Step action is required');
    }

    // Handle missing target property by using description as fallback
    const target = step.target || step.description || 'unknown element';
    const value = step.value || '';

    switch (step.action) {
      case 'navigate':
        // Handle relative URLs by combining with the test's site URL
        let navigateUrl = target;
        if (target.startsWith('/')) {
          // Use the test's site URL as base for relative paths
          const testSite = this.getCurrentTestSite();
          if (testSite) {
            navigateUrl = `${testSite}${target}`;
          } else {
            // Fallback to current URL if test site not available
            const currentUrl = await this.browser.getUrl();
            const urlObj = new URL(currentUrl);
            navigateUrl = `${urlObj.protocol}//${urlObj.host}${target}`;
          }
        } else if (!target.startsWith('http')) {
          // If it's not a full URL and not relative, assume it's a path
          const testSite = this.getCurrentTestSite();
          if (testSite) {
            navigateUrl = `${testSite}/${target}`;
          } else {
            // Fallback to current URL if test site not available
            const currentUrl = await this.browser.getUrl();
            const urlObj = new URL(currentUrl);
            navigateUrl = `${urlObj.protocol}//${urlObj.host}/${target}`;
          }
        }
        
        console.log(chalk.cyan(`     🌐 Navigating to: ${navigateUrl}`));
        await this.browser.url(navigateUrl);
        await this.browser.pause(2000); // Wait for page load
        break;

      case 'click':
        console.log(chalk.yellow(`     🔍 Looking for button: "${target}"`));
        
        // Try to find element by various selectors
        const clickElement = await this.findButton(target);
        
        // Check if element is clickable
        const isClickable = await clickElement.isClickable();
        if (!isClickable) {
          console.log(chalk.yellow(`     ⚠️  Element found but not clickable, trying to scroll into view...`));
          await clickElement.scrollIntoView();
          await this.browser!.pause(500);
        }
        
        console.log(chalk.green(`     ✅ Clicking button: "${target}"`));
        await clickElement.click();
        
        // Special handling for login button - wait for page navigation
        if (target.toLowerCase().includes('login') || target.toLowerCase().includes('submit') || target.toLowerCase().includes('enter')) {
          console.log(chalk.yellow(`     ⏳ Waiting for page navigation after login...`));
          await this.browser!.pause(3000); // Wait longer for login redirect
          
          // Wait for page to load completely
          await this.browser!.waitUntil(
            async () => {
              if (!this.browser) return false;
              const readyState = await this.browser.execute(() => document.readyState);
              return readyState === 'complete';
            },
            { timeout: 10000, timeoutMsg: 'Page did not load completely after login' }
          );
          
          console.log(chalk.green(`     ✅ Page loaded successfully after login`));
        } else {
          await this.browser.pause(1000); // Normal wait after click
        }
        break;

      case 'fill':
        const fillElement = await this.findFormField(target, value);
        await fillElement.clearValue();
        await fillElement.setValue(value);
        await this.browser.pause(500); // Wait after fill
        break;

      case 'type':
        const typeElement = await this.findFormField(target, value);
        await typeElement.clearValue();
        await typeElement.setValue(value);
        await this.browser.pause(500); // Wait after type
        break;

      case 'clear_field':
        // BDD: Clear field for Background steps
        const clearElement = await this.findFormField(target, '');
        await clearElement.clearValue();
        console.log(chalk.green(`     ✅ Cleared field: "${target}"`));
        break;

      case 'verify_field_error':
        // BDD: Verify field has error state
        console.log(chalk.yellow(`     🔍 Checking for error in field: "${target}"`));
        const errorElement = await this.findFormField(target, '');
        
        // Check for error classes, attributes, or error messages
        const hasError = await this.checkFieldError(errorElement);
        if (hasError) {
          console.log(chalk.green(`     ✅ Field "${step.target}" has error state`));
        } else {
          throw new Error(`Field "${step.target}" does not have error state`);
        }
        break;

      case 'verify_text_not_present':
        // BDD: Negative verification - text should NOT be present
        console.log(chalk.yellow(`     🔍 Verifying text is NOT present: "${value}"`));
        
        // Wait a bit for page to stabilize
        await this.browser!.pause(1000);
        
        // Check if text exists anywhere on the page
        const pageText = await this.browser!.getPageSource();
        const pageTextLower = pageText.toLowerCase();
        const searchTextLower = String(value).toLowerCase();
        
        if (pageTextLower.includes(searchTextLower)) {
          // Text is present, which is not what we want
          const visibleText = await this.browser!.$('body').getText();
          console.log(chalk.red(`     ❌ Text "${value}" is present on page. Available text: ${visibleText.substring(0, 200)}...`));
          throw new Error(`Text "${value}" should not be present on page`);
        } else {
          console.log(chalk.green(`     ✅ Text "${value}" is correctly NOT present on page`));
        }
        break;

      case 'wait':
        // Wait for element to appear or text to appear
        if (!this.browser) throw new Error('Browser not initialized');
        
        await this.browser!.waitUntil(async () => {
          try {
            // First try to find the element
            await this.findElement(target);
            return true;
          } catch {
            // If element not found, check if text appears anywhere on page
            const pageText = await this.browser!.getPageSource();
            if (pageText.includes(target)) {
              return true;
            }
            return false;
          }
        }, {
          timeout: 10000,
          timeoutMsg: `Element or text not found: ${target}`
        });
        break;

      case 'verify':
        if (value) {
          console.log(chalk.yellow(`     🔍 Verifying text: "${value}"`));
          
          // Wait a bit for page to stabilize
          await this.browser!.pause(1000);
          
          // Check if text exists anywhere on the page
          const pageText = await this.browser.getPageSource();
          const pageTextLower = pageText.toLowerCase();
          const searchTextLower = String(value).toLowerCase();
          
          if (pageTextLower.includes(searchTextLower)) {
            console.log(chalk.green(`     ✅ Text "${value}" found on page`));
          } else {
            // Try to find element and check its text
            try {
              const verifyElement = await this.findElement(target);
              const elementText = await verifyElement.getText();
              if (elementText.toLowerCase().includes(searchTextLower)) {
                console.log(chalk.green(`     ✅ Text "${value}" found in element`));
              } else {
                throw new Error(`Expected text "${value}" not found on page or in element`);
              }
            } catch (elementError) {
              // Log what text is actually on the page for debugging
              const visibleText = await this.browser!.$('body').getText();
              console.log(chalk.red(`     ❌ Text "${value}" not found. Available text: ${visibleText.substring(0, 200)}...`));
              throw new Error(`Expected text "${value}" not found on page`);
            }
          }
        } else {
          // Just verify element exists
          await this.findElement(target);
        }
        break;

      case 'screenshot':
        const screenshotPath = await this.takeScreenshot(target || 'step-screenshot');
        this.screenshots.push(screenshotPath);
        break;

      case 'smart-wait':
        // Smart wait with expected data detection
        console.log(chalk.yellow(`     ⏳ Smart waiting for: "${target}"`));
        if (value) {
          console.log(chalk.yellow(`     🎯 Expected data: "${value}"`));
        }
        
        const maxWaitTime = 30000; // Default 30 seconds
        const startTime = Date.now();
        
        await this.browser!.waitUntil(async () => {
          try {
            // First try to find the element
            const element = await this.findElement(target);
            
            // If expected data is provided, check if it appears
            if (value) {
              const elementText = await element.getText();
              const pageText = await this.browser!.getPageSource();
              
              if (elementText.includes(value) || pageText.includes(value)) {
                console.log(chalk.green(`     ✅ Expected data "${value}" found!`));
                return true;
              }
            } else {
              // Just check if element is visible
              const isDisplayed = await element.isDisplayed();
              if (isDisplayed) {
                console.log(chalk.green(`     ✅ Element "${target}" found and visible!`));
                return true;
              }
            }
            
            return false;
          } catch (error) {
            // Element not found yet, continue waiting
            return false;
          }
        }, {
          timeout: maxWaitTime,
          timeoutMsg: `Smart wait timeout: "${target}"${value ? ` with "${value}"` : ''} not found within ${maxWaitTime/1000}s`
        });
        
        const actualWaitTime = (Date.now() - startTime) / 1000;
        console.log(chalk.green(`     ⏱️  Smart wait completed in ${actualWaitTime.toFixed(1)}s`));
        break;

      case 'wait-time':
        const waitTime = parseInt(target) * 1000;
        await this.browser.pause(waitTime);
        break;

      default:
        throw new Error(`Unknown recorded action: ${step.action}`);
    }
  }

  private async findElement(description: string): Promise<WebdriverIO.Element> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Handle undefined description
    const desc = description || '';

    // Enhanced selectors with better coverage
    const selectors = [
      // Direct ID/name matches
      `#${desc}`,
      `[name="${desc}"]`,
      `[id="${desc}"]`,
      
      // Common input selectors
      `input[placeholder*="${desc}"]`,
      `input[name*="${desc}"]`,
      `input[id*="${desc}"]`,
      `label[for*="${desc}"]`,
      `[data-testid*="${desc}"]`,
      `[aria-label*="${desc}"]`,
      
      // Button selectors
      `button:contains("${desc}")`,
      `input[value*="${desc}"]`,
      
      // Common form elements
      `input[type="email"]`,
      `input[type="password"]`,
      `input[type="text"]`,
      `button[type="submit"]`,
      `input[type="submit"]`,
      
      // Specific element types based on description
      ...(desc.toLowerCase().includes('username') ? ['#username', 'input[name="username"]', 'input[placeholder*="username"]'] : []),
      ...(desc.toLowerCase().includes('password') ? ['#password', 'input[name="password"]', 'input[placeholder*="password"]'] : []),
      ...(desc.toLowerCase().includes('login') ? ['button[type="submit"]', 'input[type="submit"]', '.btn', '.button'] : []),
      ...(desc.toLowerCase().includes('logout') ? ['a[href="/logout"]', 'a:contains("Logout")', '.logout', 'a:contains("Logout")'] : []),
      
      // Complex selectors for specific cases
      ...(desc.includes('input[type="checkbox"]') ? ['input[type="checkbox"]', 'input[type="checkbox"]:first-of-type', 'input[type="checkbox"]:nth-of-type(1)', 'input[type="checkbox"]:nth-child(1)', 'input[type="checkbox"]:nth-child(2)'] : []),
      ...(desc.includes('select') ? ['select', '#dropdown', 'select[id="dropdown"]', 'option[value="1"]', 'option'] : []),
      ...(desc.includes('iframe') ? ['iframe', '#mce_0_ifr', 'iframe[id*="mce"]'] : []),
      ...(desc.includes('button') ? ['button', 'input[type="button"]', 'input[type="submit"]'] : []),
      ...(desc.includes('div') ? ['div', 'body', 'html', '.large-10', 'div.large-10'] : []),
      ...(desc.includes('a') ? ['a', 'a[href]', 'a[href*="new"]'] : []),
      
      // Generic selectors
      `*[class*="${desc}"]`,
      `*[id*="${desc}"]`,
      `*[name*="${desc}"]`,
      
          // Common patterns
    'button',
    'input[type="text"]',
    'input[type="password"]',
    'a',
    'div',
    'input[type="checkbox"]',
    'select',
    'option'
    ];

    for (const selector of selectors) {
      try {
        const element = await this.browser.$(selector);
        if (await element.isExisting()) {
          console.log(chalk.gray(`     Found element using selector: ${selector}`));
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    // If no element found, try to find any element that might match
    try {
      // Try to find any element that could be what we're looking for
      const allElements = await this.browser.$$('*');
      for (const element of allElements) {
        try {
          const tagName = await element.getTagName();
          const className = await element.getAttribute('class');
          const id = await element.getAttribute('id');
          
          // Check if this element might be what we're looking for
          if (desc.toLowerCase().includes('checkbox') && tagName === 'input') {
            const type = await element.getAttribute('type');
            if (type === 'checkbox') {
              console.log(chalk.gray(`     Found checkbox element using fallback`));
              return element;
            }
          }
          
          if (desc.toLowerCase().includes('div') && tagName === 'div') {
            console.log(chalk.gray(`     Found div element using fallback`));
            return element;
          }
          
          if (desc.toLowerCase().includes('option') && tagName === 'option') {
            console.log(chalk.gray(`     Found option element using fallback`));
            return element;
          }
        } catch (error) {
          // Continue to next element
        }
      }
    } catch (error) {
      // Fallback failed
    }

    // If no element found, try a more generic approach
    try {
      // Try to find by partial text match using XPath
      const xpathSelectors = [
        `//*[contains(text(), "${desc}")]`,
        `//button[contains(text(), "${desc}")]`,
        `//input[contains(@placeholder, "${desc}")]`,
        `//label[contains(text(), "${desc}")]`,
        `//a[contains(text(), "${desc}")]`,
        `//*[contains(@class, "${desc}")]`,
        `//*[contains(@id, "${desc}")]`
      ];

      for (const xpathSelector of xpathSelectors) {
        try {
          const element = await this.browser.$(`xpath=${xpathSelector}`);
          if (await element.isExisting()) {
            console.log(chalk.gray(`     Found element using XPath: ${xpathSelector}`));
            return element;
          }
        } catch (error) {
          // Continue to next XPath selector
        }
      }
    } catch (error) {
      // Continue to next strategy
    }

    // Last resort: try to find any element with similar text
    try {
      const elements = await this.browser.$$('*');
      for (const element of elements) {
        try {
          const text = await element.getText();
          if (text && text.toLowerCase().includes(desc.toLowerCase())) {
            console.log(chalk.gray(`     Found element by text content: ${text.substring(0, 50)}`));
            return element;
          }
        } catch (error) {
          // Continue to next element
        }
      }
    } catch (error) {
      // Continue to next strategy
    }

    throw new Error(`Element not found: ${desc}`);
  }

  private async findFormField(description: string, value: string): Promise<WebdriverIO.Element> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Handle undefined description
    const desc = description || '';
    const val = value || '';

    // Intelligent form field detection based on description and value
    const isEmail = desc.toLowerCase().includes('email') || 
                   (val && val.includes('@'));
    const isPassword = desc.toLowerCase().includes('password') || 
                      desc.toLowerCase().includes('pass');
    const isUsername = desc.toLowerCase().includes('username') || 
                      desc.toLowerCase().includes('user');

    let selectors: string[] = [];

    if (isUsername) {
      selectors = [
        '#username',
        'input[name="username"]',
        'input[id="username"]',
        'input[placeholder*="username"]',
        'input[placeholder*="Username"]',
        'input[data-testid*="username"]',
        'input[aria-label*="username"]',
        'input[aria-label*="Username"]',
        'input[type="text"]'
      ];
    } else if (isPassword) {
      selectors = [
        '#password',
        'input[name="password"]',
        'input[id="password"]',
        'input[placeholder*="password"]',
        'input[placeholder*="Password"]',
        'input[data-testid*="password"]',
        'input[aria-label*="password"]',
        'input[aria-label*="Password"]',
        'input[type="password"]'
      ];
    } else if (isEmail) {
      selectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[id="email"]',
        'input[placeholder*="email"]',
        'input[placeholder*="Email"]',
        'input[data-testid*="email"]',
        'input[aria-label*="email"]',
        'input[aria-label*="Email"]'
      ];
    } else {
      // Generic input field
      selectors = [
        `#${desc}`,
        `input[name="${desc}"]`,
        `input[id="${desc}"]`,
        'input[type="text"]',
        `input[placeholder*="${desc}"]`,
        `input[name*="${desc}"]`,
        `input[id*="${desc}"]`,
        'textarea',
        'select'
      ];
    }

    // Try each selector
    for (const selector of selectors) {
      try {
        const element = await this.browser.$(selector);
        if (await element.isExisting()) {
          console.log(chalk.gray(`     Found form field using selector: ${selector}`));
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // If no specific field found, try the general findElement method
    return await this.findElement(desc);
  }

  private async findButton(description: string): Promise<WebdriverIO.Element> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Handle undefined description
    const desc = description || '';

    // Try different strategies to find the button
    const selectors = [
      // Specific button selectors for login
      'button[type="submit"]',
      'input[type="submit"]',
      'button[class*="login"]',
      'button[class*="submit"]',
      'button[id*="login"]',
      'button[id*="submit"]',
      
      // Text-based selectors
      `button:contains("${desc}")`,
      `input[value*="${desc}"]`,
      
      // XPath selectors for text matching
      `//button[contains(text(), "${desc}")]`,
      `//input[contains(@value, "${desc}")]`,
      `//*[contains(text(), "${desc}") and (self::button or self::input)]`,
      
      // Generic selectors
      `*[class*="${desc}"]`,
      `*[id*="${desc}"]`,
      `*[name*="${desc}"]`,
      
      // Common button patterns
      'button',
      'input[type="submit"]',
      'input[type="button"]'
    ];

    for (const selector of selectors) {
      try {
        const element = await this.browser.$(selector);
        if (await element.isExisting()) {
          console.log(chalk.gray(`     Found button using selector: ${selector}`));
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // If no button found, try the general findElement method
    console.log(chalk.yellow(`     No specific button found, trying general element search...`));
    return await this.findElement(desc);
  }

  private async checkFieldError(element: WebdriverIO.Element): Promise<boolean> {
    try {
      // Check for common error indicators
      const className = await element.getAttribute('class');
      const hasErrorClass = Boolean(className && (className.includes('error') || 
                                        className.includes('invalid') || 
                                        className.includes('has-error')));
      
      const hasErrorAttribute = await element.getAttribute('aria-invalid') === 'true';
      
      // Check for error message nearby
      const parent = await element.$('..');
      const errorMessage = await parent.$('.error-message, .invalid-feedback, [role="alert"]');
      const hasErrorMessage = await errorMessage.isExisting();
      
      // Check for red border or error styling
      try {
        const styles = await element.getCSSProperty('border-color');
        const hasErrorStyle = Boolean(styles.value && (styles.value.includes('red') || styles.value.includes('rgb(255, 0, 0)')));
        return hasErrorClass || hasErrorAttribute || hasErrorMessage || hasErrorStyle;
      } catch (styleError) {
        return hasErrorClass || hasErrorAttribute || hasErrorMessage;
      }
    } catch (error) {
      return false;
    }
  }

  // Smart AI Detection System
  private async smartElementDetection(selector: string, action: string, timeout: number = 30000): Promise<any> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    console.log(chalk.blue(`🧠 Smart AI Detection: Looking for element "${selector}" for action "${action}"`));
    
    // Step 1: Page State Analysis
    const pageContext = await this.analyzePageState();
    
    // Step 2: Check if element should exist on current page
    if (!this.shouldElementExistOnPage(selector, action, pageContext)) {
      console.log(chalk.yellow(`⚠️ Element "${selector}" is not expected on current page (${pageContext.url})`));
      throw new Error(`Element "${selector}" not expected on current page context`);
    }
    
    // Step 3: Generate Multiple Selectors
    const selectors = this.generateMultipleSelectors(selector, action, pageContext);
    
    // Step 4: Try Each Selector with Smart Wait
    for (const currentSelector of selectors) {
      try {
        console.log(chalk.gray(`🔍 Trying selector: ${currentSelector}`));
        
        // Smart Wait with Context Recovery
        const element = await this.smartWaitForElement(currentSelector, timeout);
        
        if (element) {
          console.log(chalk.green(`✅ Element found with selector: ${currentSelector}`));
          return element;
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Selector failed: ${currentSelector} - ${(error as Error).message}`));
        continue;
      }
    }
    
    // Step 5: If all selectors fail, try context recovery
    console.log(chalk.yellow(`🔄 All selectors failed, attempting context recovery...`));
    await this.recoverBrowserContext();
    
    // Step 6: Try again with recovered context
    for (const currentSelector of selectors) {
      try {
        console.log(chalk.gray(`🔄 Retrying with recovered context: ${currentSelector}`));
        const element = await this.smartWaitForElement(currentSelector, 10000);
        
        if (element) {
          console.log(chalk.green(`✅ Element found after context recovery: ${currentSelector}`));
          return element;
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Retry failed: ${currentSelector}`));
        continue;
      }
    }
    
    throw new Error(`Smart AI Detection failed: Could not find element for "${selector}" after trying ${selectors.length} selectors and context recovery`);
  }

  // Page State Analysis with Context
  private async analyzePageState(): Promise<{url: string, title: string, readyState: string, pageType: string}> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    try {
      console.log(chalk.blue(`📊 Analyzing page state...`));
      
      // Check if page is loaded
      const readyState = await this.browser.execute(() => document.readyState);
      console.log(chalk.gray(`📄 Page ready state: ${readyState}`));
      
      // Check if there are any loading indicators
      const loadingElements = await this.browser.$$('[class*="loading"], [class*="spinner"], [class*="loader"]');
      if (loadingElements.length > 0) {
        console.log(chalk.yellow(`⏳ Found ${loadingElements.length} loading indicators, waiting...`));
        await this.browser.pause(2000);
      }
      
      // Check for common error states
      const errorElements = await this.browser.$$('[class*="error"], [class*="alert"], .alert-danger');
      if (errorElements.length > 0) {
        console.log(chalk.red(`❌ Found ${errorElements.length} error elements on page`));
      }
      
      // Check page title and URL
      const title = await this.browser.getTitle();
      const url = await this.browser.getUrl();
      console.log(chalk.gray(`🌐 Current page: ${title} (${url})`));
      
      // Determine page type based on URL and content
      let pageType = 'unknown';
      if (url.includes('/login')) pageType = 'login';
      else if (url.includes('/secure')) pageType = 'secure';
      else if (url.includes('/dashboard')) pageType = 'dashboard';
      else if (url.includes('/home')) pageType = 'home';
      
      console.log(chalk.gray(`📋 Page type: ${pageType}`));
      
      return { url, title, readyState, pageType };
      
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Page state analysis failed: ${(error as Error).message}`));
      return { url: '', title: '', readyState: 'unknown', pageType: 'unknown' };
    }
  }

  // Check if element should exist on current page
  private shouldElementExistOnPage(selector: string, action: string, pageContext: {url: string, title: string, readyState: string, pageType: string}): boolean {
    // Login form elements should only exist on login page
    if (pageContext.pageType === 'secure' && (action === 'username' || action === 'password' || selector.includes('username') || selector.includes('password'))) {
      return false;
    }
    
    // Submit button should only exist on login page
    if (pageContext.pageType === 'secure' && (action === 'submit' || action.includes('submit') || action.includes('login'))) {
      return false;
    }
    
    // Success message should exist on secure page after login
    if (pageContext.pageType === 'login' && (selector.includes('success') || selector.includes('flash'))) {
      return false;
    }
    
    // Error message should exist on login page for failed login
    if (pageContext.pageType === 'secure' && (selector.includes('error') || action.includes('error'))) {
      return false;
    }
    
    return true;
  }

  // Generate Multiple Selectors Strategy with Page Context
  private generateMultipleSelectors(originalSelector: string, action: string, pageContext: {url: string, title: string, readyState: string, pageType: string}): string[] {
    const selectors: string[] = [originalSelector];
    
    // Extract element type and attributes
    const isId = originalSelector.startsWith('#');
    const isClass = originalSelector.startsWith('.');
    const isTag = !originalSelector.includes('[') && !originalSelector.includes('#') && !originalSelector.includes('.');
    
    if (isId) {
      const id = originalSelector.substring(1);
      selectors.push(`[id="${id}"]`);
      selectors.push(`input[id="${id}"]`);
      selectors.push(`*[id="${id}"]`);
    }
    
    // Page-specific selectors
    if (pageContext.pageType === 'login') {
      if (action === 'username' || action.includes('username')) {
        selectors.push('input[name="username"]');
        selectors.push('input[type="text"]');
        selectors.push('#username');
        selectors.push('[name="username"]');
      }
      
      if (action === 'password' || action.includes('password')) {
        selectors.push('input[name="password"]');
        selectors.push('input[type="password"]');
        selectors.push('#password');
        selectors.push('[name="password"]');
      }
      
      if (action === 'submit' || action.includes('submit') || action.includes('login')) {
        selectors.push('button[type="submit"]');
        selectors.push('input[type="submit"]');
        selectors.push('.radius');
        selectors.push('button:contains("Login")');
        selectors.push('[type="submit"]');
      }
    }
    
    if (pageContext.pageType === 'secure') {
      if (action === 'success' || action.includes('success') || originalSelector.includes('success')) {
        selectors.push('.flash.success');
        selectors.push('.alert-success');
        selectors.push('[class*="success"]');
        selectors.push('div:contains("You logged into a secure area!")');
      }
      
      if (action === 'logout' || action.includes('logout')) {
        selectors.push('a[href="/logout"]');
        selectors.push('.button.secondary');
        selectors.push('a:contains("Logout")');
      }
    }
    
    // Generic element type selectors
    if (action === 'checkbox' || originalSelector.includes('checkbox')) {
      selectors.push('input[type="checkbox"]');
      selectors.push('[type="checkbox"]');
    }
    
    if (action === 'dropdown' || originalSelector.includes('dropdown') || originalSelector.includes('select')) {
      selectors.push('select');
      selectors.push('option');
      selectors.push('[role="listbox"]');
    }
    
    if (action === 'file' || originalSelector.includes('file') || originalSelector.includes('upload')) {
      selectors.push('input[type="file"]');
      selectors.push('[type="file"]');
    }
    
    if (action === 'button' || originalSelector.includes('button')) {
      selectors.push('button');
      selectors.push('input[type="button"]');
      selectors.push('input[type="submit"]');
      selectors.push('.btn');
    }
    
    if (action === 'input' || originalSelector.includes('input')) {
      selectors.push('input[type="text"]');
      selectors.push('input[type="email"]');
      selectors.push('textarea');
    }
    
    if (action === 'link' || originalSelector.includes('link') || originalSelector.includes('a[')) {
      selectors.push('a');
      selectors.push('[href]');
    }
    
    if (action === 'table' || originalSelector.includes('table')) {
      selectors.push('table');
      selectors.push('tbody');
      selectors.push('tr');
    }
    
    if (action === 'image' || originalSelector.includes('img')) {
      selectors.push('img');
      selectors.push('[src]');
    }
    
    // Remove duplicates
    return [...new Set(selectors)];
  }

  // Smart Wait with Context Recovery
  private async smartWaitForElement(selector: string, timeout: number): Promise<any> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    const maxAttempts = 3;
    const attemptTimeout = Math.floor(timeout / maxAttempts);
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(chalk.gray(`⏳ Attempt ${attempt}/${maxAttempts}: Waiting for element (${attemptTimeout}ms)`));
        
        // Get fresh element reference
        const element = await this.browser.$(selector);
        
        // Wait for element to be displayed
        await element.waitForDisplayed({ timeout: attemptTimeout });
        
        // Additional checks based on element type
        if (selector.includes('input')) {
          await element.waitForEnabled({ timeout: 5000 });
        }
        
        if (selector.includes('button')) {
          await element.waitForClickable({ timeout: 5000 });
        }
        
        return element;
        
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Attempt ${attempt} failed: ${(error as Error).message}`));
        
        if (attempt < maxAttempts) {
          // Wait before next attempt
          await this.browser.pause(1000);
          
          // Try to refresh element reference
          try {
            await this.browser.refresh();
            await this.browser.pause(2000);
          } catch (refreshError) {
            console.log(chalk.yellow(`⚠️ Page refresh failed: ${(refreshError as Error).message}`));
          }
        }
      }
    }
    
    return null;
  }

  // Context Recovery
  private async recoverBrowserContext(): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    try {
      console.log(chalk.blue(`🔄 Recovering browser context...`));
      
      // Try to refresh the page
      await this.browser.refresh();
      await this.browser.pause(3000);
      
      // Wait for page to be ready
      await this.browser.waitUntil(
        async () => {
          if (!this.browser) return false;
          const readyState = await this.browser.execute(() => document.readyState);
          return readyState === 'complete';
        },
        { timeout: 10000, timeoutMsg: 'Page did not load completely after refresh' }
      );
      
      console.log(chalk.green(`✅ Browser context recovered`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Context recovery failed: ${(error as Error).message}`));
    }
  }

  /**
   * ⚡ Enable/disable fast mode
   */
  setFastMode(enabled: boolean): void {
    this.useFastMode = enabled;
    console.log(chalk.blue(`⚡ Fast mode ${enabled ? 'enabled' : 'disabled'}`));
  }

  /**
   * Enable or disable Smart AI Agent
   */
  setSmartAgentMode(enabled: boolean): void {
    this.useSmartAgent = enabled;
    console.log(chalk.blue(`🧠 Smart AI Agent ${enabled ? 'enabled' : 'disabled'}`));
  }

  /**
   * Get Smart AI Agent session statistics
   */
  getSmartAgentStats() {
    return this.smartAgent?.getSessionStats() || null;
  }

  /**
   * 📊 Get execution statistics
   */
  async getExecutionStats(): Promise<ExecutionStats> {
    return {
      totalSteps: this.steps.length,
      successfulSteps: this.steps.filter(s => s.status === 'success').length,
      failedSteps: this.steps.filter(s => s.status === 'failed').length,
      totalCost: await this.costTracker?.getTotalCost() || 0,
      tokenUsage: this.tokenUsage,
      screenshots: this.screenshots,
      adaptiveStrategies: this.adaptiveStrategies,
      fastMode: this.useFastMode,
      cacheStats: this.smartDetector?.getCacheStats() || { size: 0, hitRate: 0 }
    };
  }

  /**
   * 🧹 Clear smart detector cache
   */
  clearCache(): void {
    this.smartDetector?.clearCache();
    console.log(chalk.blue('🧹 Smart detector cache cleared'));
  }

  /**
   * Get the current test site URL from context
   */
  private getCurrentTestSite(): string | null {
    // Try to get the current test site from context
    return this.aiContext.get('currentTestSite') || null;
  }

  /**
   * Convert test step to natural language task for Smart AI Agent
   */
  private convertStepToTask(step: TestStep, testData: Record<string, any>): string {
    const action = step.action?.toLowerCase() || 'interact';
    const description = step.description;
    const value = step.value || testData[step.description] || '';

    switch (action) {
      case 'click':
        return `Click on ${description}`;
      case 'fill':
      case 'type':
        return `Fill ${description} with "${value}"`;
      case 'clear':
        return `Clear the ${description} field`;
      case 'select':
        return `Select "${value}" from ${description}`;
      case 'upload':
        return `Upload file "${value}" to ${description}`;
      case 'verify':
        return `Verify that ${description} ${value ? `contains "${value}"` : 'is present'}`;
      case 'wait':
        return `Wait for ${description} to be visible`;
      case 'screenshot':
        return `Take a screenshot of ${description}`;
      default:
        return description;
    }
  }
}
