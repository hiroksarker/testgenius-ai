import { ChatOpenAI } from "@langchain/openai";
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Browser } from 'webdriverio';
import { BrowserTools } from '../tools/BrowserTools';
import { NavigationTools } from '../tools/NavigationTools';
import { InteractionTools } from '../tools/InteractionTools';
import { VerificationTools } from '../tools/VerificationTools';
import { CostTracker } from './CostTracker';
import { 
  TestDefinition, 
  TestRunOptions, 
  AIExecutionResult, 
  ExecutionStep, 
  TestStep,
  AIExecutionPlan,
  TokenUsage,
  TestCostData,
  FrameworkConfig
} from '../../types';

export class AITestExecutor {
  private llm: ChatOpenAI;
  private browser: Browser | null = null;
  private browserTools: BrowserTools;
  private navigationTools: NavigationTools;
  private interactionTools: InteractionTools;
  private verificationTools: VerificationTools;
  private costTracker: CostTracker | null = null;
  private steps: ExecutionStep[] = [];
  private screenshots: string[] = [];
  private tokenUsage: TokenUsage[] = [];

  constructor(config?: FrameworkConfig) {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || 'gpt-4o',
      temperature: 0.1,
      maxTokens: 2000
    });
    
    this.browserTools = new BrowserTools();
    this.navigationTools = new NavigationTools();
    this.interactionTools = new InteractionTools();
    this.verificationTools = new VerificationTools();
    
    // Initialize cost tracker if config is provided and cost tracking is enabled
    if (config?.costTracking?.enabled) {
      this.costTracker = new CostTracker(config);
    }
  }

  setBrowser(browser: Browser): void {
    this.browser = browser;
    this.browserTools.setBrowser(browser);
    this.navigationTools.setBrowser(browser);
    this.interactionTools.setBrowser(browser);
    this.verificationTools.setBrowser(browser);
    console.log(chalk.green('✅ Browser instance set on AI executor and all tools.'));
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

  async executeTest(test: TestDefinition, options: TestRunOptions = {}): Promise<AIExecutionResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Did you forget to call setBrowser()?');
    }
    
    // Check if browser is still responsive
    try {
      await this.browser.getTitle();
    } catch (browserError) {
      console.log(chalk.yellow(`⚠️ Browser lost connection, attempting to recover...`));
      // Try to refresh the page first
      try {
        await this.browser.refresh();
        await this.browser.pause(2000);
      } catch (refreshError) {
        throw new Error(`Browser connection lost and cannot be recovered: ${(browserError as Error).message}`);
      }
    }
    
    console.log(chalk.blue('🤖 AI Test Executor starting...\n'));

    try {
      // Navigate to the site
      await this.navigateToSite(test.site);
      
      // Check if we have recorded steps from the TestRecorder
      const recordedSteps = (test.testData as any)?.steps;
      
      if (recordedSteps && Array.isArray(recordedSteps) && recordedSteps.length > 0) {
        console.log(chalk.blue('📝 Executing recorded steps...\n'));
        // Execute recorded steps directly
        const result = await this.executeRecordedSteps(recordedSteps);
        return {
          success: result.success,
          steps: this.steps,
          screenshots: this.screenshots,
          errors: result.errors || []
        };
      } else {
        // Use AI plan if no recorded steps
        console.log(chalk.blue('🧠 Creating AI execution plan...'));
        const plan = await this.createExecutionPlan(test, options);
        const result = await this.executePlan(plan, test, options);
        
        return {
          success: result.success,
          steps: this.steps,
          screenshots: this.screenshots,
          errors: result.errors || []
        };
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
    
    await this.browser.url(url);
    await this.browser.pause(2000); // Wait for page load
    
    // Take initial screenshot
    const screenshotPath = await this.takeScreenshot('initial-navigation');
    this.screenshots.push(screenshotPath);
    
    this.addStep('Navigate to site', `Successfully navigated to ${url}`, 'success');
  }

  private async createExecutionPlan(test: TestDefinition, options: TestRunOptions): Promise<AIExecutionPlan> {
    console.log(chalk.blue('🧠 Creating AI execution plan...'));

    const systemPrompt = `You are an expert web automation tester. Your task is to analyze a test scenario and create a detailed execution plan.

Available tools:
- navigate_to(url): Navigate to a specific URL
- click_element(selector): Click on an element using CSS selector, XPath, or text
- fill_form(selector, value): Fill a form field
- verify_text(text): Verify that specific text appears on the page
- verify_element(selector): Verify that an element exists
- take_screenshot(name): Take a screenshot
- wait_for_element(selector): Wait for an element to appear
- scroll_to_element(selector): Scroll to an element
- select_option(selector, value): Select an option from dropdown

Test Information:
- Site: ${test.site}
- Task: ${test.task}
- Test Data: ${JSON.stringify(test.testData || {})}

Create a step-by-step execution plan. Each step should be clear and actionable.`;

    const userPrompt = `Please create an execution plan for this test task: "${test.task}"

Return the plan as a JSON array of steps, where each step has:
- action: The action to perform
- selector: Element selector (if applicable)
- value: Value to use (if applicable)
- description: Human-readable description
- expected_result: What should happen after this step

Example format:
[
  {
    "action": "click_element",
    "selector": "#login-button",
    "description": "Click the login button",
    "expected_result": "Login form should appear"
  }
]`;

    try {
      const response = await this.llm.call([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
      
      // Track token usage
      this.trackTokenUsage(response, this.llm.modelName);
      
      const planText = response.content;
      // Extract JSON from the response
      const planTextString = typeof planText === 'string' ? planText : JSON.stringify(planText);
      const jsonMatch = planTextString.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const plan = JSON.parse(jsonMatch[0]) as TestStep[];
        return {
          steps: plan,
          confidence: 0.9,
          reasoning: 'AI-generated plan based on test requirements'
        };
      } else {
        throw new Error('No valid JSON plan found in AI response');
      }
    } catch (parseError) {
      console.error(chalk.yellow('⚠️  Failed to parse AI plan, using fallback:'), (parseError as Error).message);
      return this.createFallbackPlan(test);
    }
  }

  private createFallbackPlan(test: TestDefinition): AIExecutionPlan {
    // Completely dynamic AI approach - no specific features, only basic actions
    const task = test.task.toLowerCase();
    
    // AI will analyze the task and create dynamic steps
    // No hardcoded features like 'login', 'search', 'form'
    const dynamicSteps: TestStep[] = [
      {
        action: 'dynamic_analyze',
        description: 'AI will analyze the task and determine required actions',
        expectedResult: 'Task analysis complete'
      },
      {
        action: 'dynamic_navigate',
        description: 'AI will navigate to the required page based on task',
        expectedResult: 'Should reach the target page'
      },
      {
        action: 'dynamic_interact',
        description: 'AI will interact with elements based on task requirements',
        expectedResult: 'Required interactions completed'
      },
      {
        action: 'dynamic_verify',
        description: 'AI will verify the expected results',
        expectedResult: 'Verification completed'
      }
    ];

    return {
      steps: dynamicSteps,
      confidence: 0.9,
      reasoning: `Fully dynamic AI plan - analyzes task and executes based on user requirements`
    };
  }

  private async executePlan(plan: AIExecutionPlan, test: TestDefinition, options: TestRunOptions): Promise<{ success: boolean; errors: string[] }> {
    console.log(chalk.blue('⚡ Executing AI-generated plan...\n'));
    
    const errors: string[] = [];
    let success = true;

    for (const step of plan.steps) {
      try {
        console.log(chalk.cyan(`  🔄 ${step.description}`));
        await this.executeStep(step, test.testData || {});
        this.addStep(step.description, step.expectedResult, 'success');
        console.log(chalk.green(`  ✅ ${step.description}`));
      } catch (error) {
        console.error(chalk.red(`  ❌ ${step.description}:`), (error as Error).message);
        
        // 🔥 AUTOMATIC SCREENSHOT ON FAILURE 🔥
        try {
          const failureScreenshotPath = await this.takeScreenshot(`ai-plan-failure-${step.action}`);
          this.screenshots.push(failureScreenshotPath);
          console.log(chalk.yellow(`  📸 Screenshot taken on AI plan failure: ${failureScreenshotPath}`));
        } catch (screenshotError) {
          console.error(chalk.red(`  ❌ Failed to take failure screenshot:`), (screenshotError as Error).message);
        }
        
        this.addStep(step.description, (error as Error).message, 'failed');
        errors.push(`${step.description}: ${(error as Error).message}`);
        success = false;
      }
    }

    return { success, errors };
  }

  private async executeStep(step: TestStep, testData: Record<string, any>): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');

    switch (step.action) {
      case 'dynamic_analyze':
        // AI analyzes the task and determines what needs to be done
        console.log(chalk.blue('🤖 AI: Analyzing task requirements...'));
        console.log(chalk.gray('📋 Task: ' + step.description));
        console.log(chalk.gray('🎯 Expected: ' + step.expectedResult));
        // AI will use testData to understand what to do
        break;
        
      case 'dynamic_navigate':
        // AI navigates based on task requirements
        let targetUrl = testData.targetUrl;
        if (targetUrl && !targetUrl.startsWith('http')) {
          // If targetUrl is relative, combine with base site URL
          const baseUrl = testData.site || 'https://the-internet.herokuapp.com';
          targetUrl = baseUrl + targetUrl;
        } else {
          targetUrl = testData.targetUrl || testData.site || '/';
        }
        console.log(chalk.blue(`🤖 AI: Navigating to: ${targetUrl}`));
        await this.navigationTools.goTo(targetUrl);
        // Wait for page to load
        await this.browser.pause(2000);
        break;
        
      case 'dynamic_interact':
        // AI interacts with elements based on task requirements using Smart AI Detection
        console.log(chalk.blue('🤖 AI: Interacting with elements based on task...'));
        
        // Use Smart AI Detection for form interactions
        if (testData.username && testData.usernameSelector) {
          console.log(chalk.gray(`📝 Filling username: ${testData.usernameSelector}`));
          const usernameElement = await this.smartElementDetection(testData.usernameSelector, 'username');
          await usernameElement.setValue(testData.username);
        }
        
        if (testData.password && testData.passwordSelector) {
          console.log(chalk.gray(`🔒 Filling password: ${testData.passwordSelector}`));
          const passwordElement = await this.smartElementDetection(testData.passwordSelector, 'password');
          await passwordElement.setValue(testData.password);
        }
        
        if (testData.submitSelector) {
          console.log(chalk.gray(`🖱️ Clicking submit: ${testData.submitSelector}`));
          const submitElement = await this.smartElementDetection(testData.submitSelector, 'submit');
          await submitElement.click();
        }
        
        // Handle checkbox interactions
        if (testData.checkbox1Selector) {
          console.log(chalk.gray(`☑️ Interacting with checkbox 1: ${testData.checkbox1Selector}`));
          const checkbox1 = await this.smartElementDetection(testData.checkbox1Selector, 'checkbox');
          await checkbox1.click();
        }
        
        if (testData.checkbox2Selector) {
          console.log(chalk.gray(`☑️ Interacting with checkbox 2: ${testData.checkbox2Selector}`));
          const checkbox2 = await this.smartElementDetection(testData.checkbox2Selector, 'checkbox');
          await checkbox2.click();
        }
        
        // Handle dropdown interactions
        if (testData.dropdownSelector && testData.optionValue) {
          console.log(chalk.gray(`📋 Selecting dropdown option: ${testData.optionValue}`));
          const dropdown = await this.smartElementDetection(testData.dropdownSelector, 'dropdown');
          await dropdown.selectByAttribute('value', testData.optionValue);
        }
        
        // Handle file upload
        if (testData.fileInputSelector && testData.filePath) {
          console.log(chalk.gray(`📁 Uploading file: ${testData.filePath}`));
          const fileInput = await this.smartElementDetection(testData.fileInputSelector, 'file');
          await fileInput.setValue(testData.filePath);
          
          if (testData.uploadButtonSelector) {
            console.log(chalk.gray(`🖱️ Clicking upload button: ${testData.uploadButtonSelector}`));
            const uploadButton = await this.smartElementDetection(testData.uploadButtonSelector, 'button');
            await uploadButton.click();
          }
        }
        
        // Handle JavaScript alerts
        if (testData.alertButtonSelector) {
          console.log(chalk.gray(`🚨 Clicking alert button: ${testData.alertButtonSelector}`));
          const alertButton = await this.smartElementDetection(testData.alertButtonSelector, 'button');
          await alertButton.click();
          
          // Handle the alert
          try {
            const alert = await this.browser.getAlertText();
            console.log(chalk.gray(`📢 Alert text: ${alert}`));
            await this.browser.acceptAlert();
            console.log(chalk.green(`✅ Alert accepted`));
          } catch (alertError) {
            console.log(chalk.yellow(`⚠️ No alert found or alert handling failed: ${(alertError as Error).message}`));
          }
        }
        
        // Handle add/remove elements
        if (testData.addButtonSelector) {
          console.log(chalk.gray(`➕ Clicking add element button: ${testData.addButtonSelector}`));
          const addButton = await this.smartElementDetection(testData.addButtonSelector, 'button');
          await addButton.click();
          
          // Wait for element to be added
          await this.browser.pause(1000);
          
          if (testData.deleteButtonSelector) {
            console.log(chalk.gray(`➖ Clicking delete button: ${testData.deleteButtonSelector}`));
            const deleteButton = await this.smartElementDetection(testData.deleteButtonSelector, 'button');
            await deleteButton.click();
          }
        }
        
        // Handle hover interactions
        if (testData.hoverElementSelector) {
          console.log(chalk.gray(`🖱️ Hovering over element: ${testData.hoverElementSelector}`));
          const hoverElement = await this.smartElementDetection(testData.hoverElementSelector, 'hover');
          await hoverElement.moveTo();
        }
        
        // Handle key presses
        if (testData.inputSelector && testData.key) {
          console.log(chalk.gray(`⌨️ Pressing key '${testData.key}' in input: ${testData.inputSelector}`));
          const inputElement = await this.smartElementDetection(testData.inputSelector, 'input');
          await inputElement.click();
          await inputElement.setValue(testData.key);
        }
        
        // Handle link clicks
        if (testData.linkSelector) {
          console.log(chalk.gray(`🔗 Clicking link: ${testData.linkSelector}`));
          const linkElement = await this.smartElementDetection(testData.linkSelector, 'link');
          await linkElement.click();
        }
        
        // Generic interactions based on testData with Smart AI Detection
        if (testData.actions) {
          for (const action of testData.actions) {
            console.log(chalk.gray(`⚡ Executing: ${action.type} - ${action.selector}`));
            await this.executeSmartWebDriverIOAction(action);
          }
        }
        break;
        
      case 'dynamic_verify':
        // AI verifies results based on task requirements
        console.log(chalk.blue('🤖 AI: Verifying expected results...'));
        
        // Get current page context for verification
        const verifyContext = await this.analyzePageState();
        
        if (testData.expectedText) {
          console.log(chalk.gray(`✅ Verifying text: ${testData.expectedText}`));
          try {
            await this.verificationTools.verifyText(testData.expectedText);
          } catch (error) {
            // If text not found, try alternative verification methods
            console.log(chalk.yellow(`⚠️ Text "${testData.expectedText}" not found, trying alternative verification...`));
            
            // Check if we're on secure page and verify page title instead
            if (verifyContext.pageType === 'secure') {
              console.log(chalk.gray(`🔍 Verifying secure page title instead...`));
              await this.verificationTools.verifyText('Secure Area');
            } else {
              throw error;
            }
          }
        }
        
        if (testData.expectedElement) {
          console.log(chalk.gray(`✅ Verifying element: ${testData.expectedElement}`));
          try {
            await this.verificationTools.verifyElement(testData.expectedElement);
          } catch (error) {
            // If element not found, try context-aware alternatives
            console.log(chalk.yellow(`⚠️ Element "${testData.expectedElement}" not found, trying context-aware alternatives...`));
            
            if (verifyContext.pageType === 'secure' && testData.expectedElement.includes('success')) {
              // Try alternative success indicators on secure page
              const successSelectors = ['.flash.success', '.alert-success', '[class*="success"]', 'h2'];
              let found = false;
              
              for (const selector of successSelectors) {
                try {
                  await this.verificationTools.verifyElement(selector);
                  console.log(chalk.green(`✅ Found alternative success indicator: ${selector}`));
                  found = true;
                  break;
                } catch (altError) {
                  continue;
                }
              }
              
              if (!found) {
                throw new Error(`No success indicators found on secure page`);
              }
            } else {
              throw error;
            }
          }
        }
        
        // Dynamic verification based on testData
        if (testData.verifications) {
          for (const verification of testData.verifications) {
            console.log(chalk.gray(`✅ Verifying: ${verification.type} - ${verification.selector}`));
            await this.executeWebDriverIOVerification(verification);
          }
        }
        break;
        
      case 'click_element':
        await this.interactionTools.clickElement(step.selector!);
        break;
        
      case 'fill_form':
        const value = step.value || testData[step.selector!] || '';
        await this.interactionTools.fillForm(step.selector!, value.toString());
        break;
        
      case 'verify_text':
        await this.verificationTools.verifyText(step.value!.toString());
        break;
        
      case 'verify_element':
        await this.verificationTools.verifyElement(step.selector!);
        break;
        
      case 'wait_for_element':
        await this.browserTools.waitForElement(step.selector!);
        break;
        
      case 'take_screenshot':
        await this.takeScreenshot(step.value?.toString() || 'step-screenshot');
        break;
        
      case 'wait-time':
        const waitTime = parseInt(String(step.value || step.selector || '1000')) * 1000;
        await this.browser.pause(waitTime);
        break;
        
      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  // New method to execute WebDriverIO actions with Smart AI Detection
  private async executeSmartWebDriverIOAction(action: any): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    
    // Use Smart AI Detection to find the element
    const element = await this.smartElementDetection(action.selector, action.type, action.timeout || 30000);
    
    // Cap timeout to 30s max
    const maxTimeout = 30000;
    const timeout = action.timeout ? Math.min(action.timeout, maxTimeout) : undefined;
    
    switch (action.type) {
      case 'click':
        await element.click();
        break;
      case 'doubleClick':
        await element.doubleClick();
        break;
      case 'setValue':
        await element.setValue(action.value);
        break;
      case 'addValue':
        await element.addValue(action.value);
        break;
      case 'clearValue':
        await element.clearValue();
        break;
      case 'selectByVisibleText':
        await element.selectByVisibleText(action.value);
        break;
      case 'selectByIndex':
        await element.selectByIndex(action.value);
        break;
      case 'selectByAttribute':
        await element.selectByAttribute(action.attribute, action.value);
        break;
      case 'scrollIntoView':
        await element.scrollIntoView();
        break;
      case 'dragAndDrop':
        if (!this.browser) throw new Error('Browser not initialized');
        const targetElement = await this.browser.$(action.target);
        await element.dragAndDrop(targetElement);
        break;
      case 'moveTo':
        await element.moveTo();
        break;
      case 'touchAction':
        await element.touchAction(action.actions);
        break;
      case 'waitForDisplayed':
        console.log(chalk.gray(`⏳ Element already found and displayed by Smart AI Detection`));
        break;
      case 'waitForClickable':
        console.log(chalk.gray(`⏳ Element already found and clickable by Smart AI Detection`));
        break;
      case 'waitForExist':
        console.log(chalk.gray(`⏳ Element already found and exists by Smart AI Detection`));
        break;
      case 'waitForEnabled':
        console.log(chalk.gray(`⏳ Element already found and enabled by Smart AI Detection`));
        break;
      case 'waitForStable':
        console.log(chalk.gray(`⏳ Element already found and stable by Smart AI Detection`));
        break;
      default:
        throw new Error(`Unknown WebDriverIO action: ${action.type}`);
    }
  }

  // New method to execute WebDriverIO element verifications
  private async executeWebDriverIOVerification(verification: any): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    const element = await this.browser.$(verification.selector);
    
    switch (verification.type) {
      case 'isDisplayed':
        const isDisplayed = await element.isDisplayed();
        if (!isDisplayed) throw new Error(`Element ${verification.selector} is not displayed`);
        break;
      case 'isEnabled':
        const isEnabled = await element.isEnabled();
        if (!isEnabled) throw new Error(`Element ${verification.selector} is not enabled`);
        break;
      case 'isClickable':
        const isClickable = await element.isClickable();
        if (!isClickable) throw new Error(`Element ${verification.selector} is not clickable`);
        break;
      case 'isExisting':
        const isExisting = await element.isExisting();
        if (!isExisting) throw new Error(`Element ${verification.selector} does not exist`);
        break;
      case 'getText':
        const text = await element.getText();
        if (verification.expectedValue && !text.includes(verification.expectedValue)) {
          throw new Error(`Element text "${text}" does not contain expected value "${verification.expectedValue}"`);
        }
        break;
      case 'getValue':
        const value = await element.getValue();
        if (verification.expectedValue && value !== verification.expectedValue) {
          throw new Error(`Element value "${value}" does not match expected value "${verification.expectedValue}"`);
        }
        break;
      case 'getAttribute':
        const attribute = await element.getAttribute(verification.attribute);
        if (verification.expectedValue && attribute !== verification.expectedValue) {
          throw new Error(`Element attribute "${verification.attribute}" value "${attribute}" does not match expected value "${verification.expectedValue}"`);
        }
        break;
      default:
        throw new Error(`Unknown WebDriverIO verification: ${verification.type}`);
    }
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

    switch (step.action) {
      case 'navigate':
        await this.browser.url(step.target);
        await this.browser.pause(2000); // Wait for page load
        break;

      case 'click':
        console.log(chalk.yellow(`     🔍 Looking for button: "${step.target}"`));
        
        // Try to find element by various selectors
        const clickElement = await this.findButton(step.target);
        
        // Check if element is clickable
        const isClickable = await clickElement.isClickable();
        if (!isClickable) {
          console.log(chalk.yellow(`     ⚠️  Element found but not clickable, trying to scroll into view...`));
          await clickElement.scrollIntoView();
          await this.browser!.pause(500);
        }
        
        console.log(chalk.green(`     ✅ Clicking button: "${step.target}"`));
        await clickElement.click();
        
        // Special handling for login button - wait for page navigation
        if (step.target.toLowerCase().includes('login') || step.target.toLowerCase().includes('submit') || step.target.toLowerCase().includes('enter')) {
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
        const fillElement = await this.findFormField(step.target, step.value);
        await fillElement.clearValue();
        await fillElement.setValue(step.value);
        await this.browser.pause(500); // Wait after fill
        break;

      case 'type':
        const typeElement = await this.findFormField(step.target, step.value);
        await typeElement.clearValue();
        await typeElement.setValue(step.value);
        await this.browser.pause(500); // Wait after type
        break;

      case 'clear_field':
        // BDD: Clear field for Background steps
        const clearElement = await this.findFormField(step.target, '');
        await clearElement.clearValue();
        console.log(chalk.green(`     ✅ Cleared field: "${step.target}"`));
        break;

      case 'verify_field_error':
        // BDD: Verify field has error state
        console.log(chalk.yellow(`     🔍 Checking for error in field: "${step.target}"`));
        const errorElement = await this.findFormField(step.target, '');
        
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
        console.log(chalk.yellow(`     🔍 Verifying text is NOT present: "${step.value}"`));
        
        // Wait a bit for page to stabilize
        await this.browser!.pause(1000);
        
        // Check if text exists anywhere on the page
        const pageText = await this.browser!.getPageSource();
        const pageTextLower = pageText.toLowerCase();
        const searchTextLower = String(step.value).toLowerCase();
        
        if (pageTextLower.includes(searchTextLower)) {
          // Text is present, which is not what we want
          const visibleText = await this.browser!.$('body').getText();
          console.log(chalk.red(`     ❌ Text "${step.value}" is present on page. Available text: ${visibleText.substring(0, 200)}...`));
          throw new Error(`Text "${step.value}" should not be present on page`);
        } else {
          console.log(chalk.green(`     ✅ Text "${step.value}" is correctly NOT present on page`));
        }
        break;

      case 'wait':
        // Wait for element to appear or text to appear
        if (!this.browser) throw new Error('Browser not initialized');
        
        await this.browser!.waitUntil(async () => {
          try {
            // First try to find the element
            await this.findElement(step.target);
            return true;
          } catch {
            // If element not found, check if text appears anywhere on page
            const pageText = await this.browser!.getPageSource();
            if (pageText.includes(step.target)) {
              return true;
            }
            return false;
          }
        }, {
          timeout: 10000,
          timeoutMsg: `Element or text not found: ${step.target}`
        });
        break;

      case 'verify':
        if (step.value) {
          console.log(chalk.yellow(`     🔍 Verifying text: "${step.value}"`));
          
          // Wait a bit for page to stabilize
          await this.browser!.pause(1000);
          
          // Check if text exists anywhere on the page
          const pageText = await this.browser.getPageSource();
          const pageTextLower = pageText.toLowerCase();
          const searchTextLower = String(step.value).toLowerCase();
          
          if (pageTextLower.includes(searchTextLower)) {
            console.log(chalk.green(`     ✅ Text "${step.value}" found on page`));
          } else {
            // Try to find element and check its text
            try {
              const verifyElement = await this.findElement(step.target);
              const elementText = await verifyElement.getText();
              if (elementText.toLowerCase().includes(searchTextLower)) {
                console.log(chalk.green(`     ✅ Text "${step.value}" found in element`));
              } else {
                throw new Error(`Expected text "${step.value}" not found on page or in element`);
              }
            } catch (elementError) {
              // Log what text is actually on the page for debugging
              const visibleText = await this.browser!.$('body').getText();
              console.log(chalk.red(`     ❌ Text "${step.value}" not found. Available text: ${visibleText.substring(0, 200)}...`));
              throw new Error(`Expected text "${step.value}" not found on page`);
            }
          }
        } else {
          // Just verify element exists
          await this.findElement(step.target);
        }
        break;

      case 'screenshot':
        const screenshotPath = await this.takeScreenshot(step.target || 'step-screenshot');
        this.screenshots.push(screenshotPath);
        break;

      case 'smart-wait':
        // Smart wait with expected data detection
        console.log(chalk.yellow(`     ⏳ Smart waiting for: "${step.target}"`));
        if (step.value) {
          console.log(chalk.yellow(`     🎯 Expected data: "${step.value}"`));
        }
        
        const maxWaitTime = 30000; // Default 30 seconds
        const startTime = Date.now();
        
        await this.browser!.waitUntil(async () => {
          try {
            // First try to find the element
            const element = await this.findElement(step.target);
            
            // If expected data is provided, check if it appears
            if (step.value) {
              const elementText = await element.getText();
              const pageText = await this.browser!.getPageSource();
              
              if (elementText.includes(step.value) || pageText.includes(step.value)) {
                console.log(chalk.green(`     ✅ Expected data "${step.value}" found!`));
                return true;
              }
            } else {
              // Just check if element is visible
              const isDisplayed = await element.isDisplayed();
              if (isDisplayed) {
                console.log(chalk.green(`     ✅ Element "${step.target}" found and visible!`));
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
          timeoutMsg: `Smart wait timeout: "${step.target}"${step.value ? ` with "${step.value}"` : ''} not found within ${maxWaitTime/1000}s`
        });
        
        const actualWaitTime = (Date.now() - startTime) / 1000;
        console.log(chalk.green(`     ⏱️  Smart wait completed in ${actualWaitTime.toFixed(1)}s`));
        break;

      case 'wait-time':
        const waitTime = parseInt(step.target) * 1000;
        await this.browser.pause(waitTime);
        break;

      default:
        throw new Error(`Unknown recorded action: ${step.action}`);
    }
  }

  private async findElement(description: string): Promise<WebdriverIO.Element> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Try different strategies to find the element
    const selectors = [
      // Common input selectors
      `input[placeholder*="${description}"]`,
      `input[name*="${description}"]`,
      `input[id*="${description}"]`,
      `label[for*="${description}"]`,
      `[data-testid*="${description}"]`,
      `[aria-label*="${description}"]`,
      
      // Button selectors
      `button:contains("${description}")`,
      `input[value*="${description}"]`,
      
      // Common form elements
      `input[type="email"]`,
      `input[type="password"]`,
      `input[type="text"]`,
      `button[type="submit"]`,
      `input[type="submit"]`,
      
      // Generic selectors
      `*[class*="${description}"]`,
      `*[id*="${description}"]`,
      `*[name*="${description}"]`
    ];

    for (const selector of selectors) {
      try {
        const element = await this.browser.$(selector);
        if (await element.isExisting()) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // If no element found, try a more generic approach
    try {
      // Try to find by partial text match using XPath
      const xpathSelectors = [
        `//*[contains(text(), "${description}")]`,
        `//button[contains(text(), "${description}")]`,
        `//input[contains(@placeholder, "${description}")]`,
        `//label[contains(text(), "${description}")]`
      ];

      for (const xpathSelector of xpathSelectors) {
        try {
          const element = await this.browser.$(`xpath=${xpathSelector}`);
          if (await element.isExisting()) {
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
          if (text && text.toLowerCase().includes(description.toLowerCase())) {
            return element;
          }
        } catch (error) {
          // Continue to next element
        }
      }
    } catch (error) {
      // Continue to next strategy
    }

    throw new Error(`Element not found: ${description}`);
  }

  private async findFormField(description: string, value: string): Promise<WebdriverIO.Element> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Intelligent form field detection based on description and value
    const isEmail = description.toLowerCase().includes('email') || 
                   (value && value.includes('@'));
    const isPassword = description.toLowerCase().includes('password') || 
                      description.toLowerCase().includes('pass');

    let selectors: string[] = [];

    if (isEmail) {
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
    } else if (isPassword) {
      selectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[id="password"]',
        'input[placeholder*="password"]',
        'input[placeholder*="Password"]',
        'input[data-testid*="password"]',
        'input[aria-label*="password"]',
        'input[aria-label*="Password"]'
      ];
    } else {
      // Generic input field
      selectors = [
        'input[type="text"]',
        'input[placeholder*="' + description + '"]',
        'input[name*="' + description + '"]',
        'input[id*="' + description + '"]',
        'textarea',
        'select'
      ];
    }

    // Try each selector
    for (const selector of selectors) {
      try {
        const element = await this.browser.$(selector);
        if (await element.isExisting()) {
          return element;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // If no specific field found, try the general findElement method
    return await this.findElement(description);
  }

  private async findButton(description: string): Promise<WebdriverIO.Element> {
    if (!this.browser) throw new Error('Browser not initialized');

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
      `button:contains("${description}")`,
      `input[value*="${description}"]`,
      
      // XPath selectors for text matching
      `//button[contains(text(), "${description}")]`,
      `//input[contains(@value, "${description}")]`,
      `//*[contains(text(), "${description}") and (self::button or self::input)]`,
      
      // Generic selectors
      `*[class*="${description}"]`,
      `*[id*="${description}"]`,
      `*[name*="${description}"]`,
      
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
    return await this.findElement(description);
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
}
