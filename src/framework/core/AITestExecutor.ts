import OpenAI from 'openai';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Browser } from 'webdriverio';
import { BrowserTools } from '../tools/BrowserTools';
import { NavigationTools } from '../tools/NavigationTools';
import { InteractionTools } from '../tools/InteractionTools';
import { VerificationTools } from '../tools/VerificationTools';
import { 
  TestDefinition, 
  TestRunOptions, 
  AIExecutionResult, 
  ExecutionStep, 
  TestStep,
  AIExecutionPlan 
} from '../../types';

export class AITestExecutor {
  private openai: OpenAI;
  private browser: Browser | null = null;
  private browserTools: BrowserTools;
  private navigationTools: NavigationTools;
  private interactionTools: InteractionTools;
  private verificationTools: VerificationTools;
  private steps: ExecutionStep[] = [];
  private screenshots: string[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.browserTools = new BrowserTools();
    this.navigationTools = new NavigationTools();
    this.interactionTools = new InteractionTools();
    this.verificationTools = new VerificationTools();
  }

  setBrowser(browser: Browser): void {
    this.browser = browser;
    this.browserTools.setBrowser(browser);
    this.navigationTools.setBrowser(browser);
    this.interactionTools.setBrowser(browser);
    this.verificationTools.setBrowser(browser);
  }

  async executeTest(test: TestDefinition, options: TestRunOptions = {}): Promise<AIExecutionResult> {
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
      const response = await this.openai.chat.completions.create({
        model: options.model || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const planText = response.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = planText?.match(/\[[\s\S]*\]/);
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
    // Intelligent fallback plan based on test data and task description
    const testData = test.testData || {};
    const task = test.task.toLowerCase();
    
    // Extract field names from test data with proper typing
    const username = String(testData.username || testData.email || 'test@example.com');
    const password = String(testData.password || 'password123');
    
    // Determine field selectors based on available data
    const usernameSelectors = testData.username ? 
      'input[name="username"], input[id="username"], #username' : 
      'input[type="email"], input[name="email"], #email, input[name="username"], input[id="username"], #username';
    
    const passwordSelectors = 'input[type="password"], input[name="password"], #password';
    
    // Common test patterns
    const plans: Record<string, TestStep[]> = {
      'login': [
        {
          action: 'fill_form',
          selector: usernameSelectors,
          value: username,
          description: `Fill username field with '${username}'`,
          expectedResult: 'Username field should be filled'
        },
        {
          action: 'fill_form',
          selector: passwordSelectors,
          value: password,
          description: `Fill password field with '${password}'`,
          expectedResult: 'Password field should be filled'
        },
        {
          action: 'click_element',
          selector: 'button[type="submit"], input[type="submit"], .login-button',
          description: 'Click login button',
          expectedResult: 'Should be logged in successfully'
        }
      ],
      'search': [
        {
          action: 'fill_form',
          selector: 'input[type="search"], input[name="q"], #search',
          value: String(testData.searchTerm || 'test search'),
          description: 'Fill search field',
          expectedResult: 'Search field should be filled'
        },
        {
          action: 'click_element',
          selector: 'button[type="submit"], input[type="submit"], .search-button',
          description: 'Click search button',
          expectedResult: 'Search should be executed'
        }
      ],
      'form': [
        {
          action: 'fill_form',
          selector: 'input, textarea, select',
          value: 'test value',
          description: 'Fill form fields',
          expectedResult: 'Form fields should be filled'
        },
        {
          action: 'click_element',
          selector: 'button[type="submit"], input[type="submit"]',
          description: 'Submit form',
          expectedResult: 'Form should be submitted'
        }
      ]
    };

    // Determine which plan to use based on task description
    let planType = 'form'; // default
    if (task.includes('login') || task.includes('username') || task.includes('password')) {
      planType = 'login';
    } else if (task.includes('search')) {
      planType = 'search';
    }

    return {
      steps: plans[planType] || plans.form,
      confidence: 0.7,
      reasoning: `Fallback plan based on task analysis: ${planType} pattern detected`
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
          await this.browser!.waitUntil(async () => {
            const readyState = await this.browser!.execute(() => document.readyState);
            return readyState === 'complete';
          }, {
            timeout: 10000,
            timeoutMsg: 'Page did not load completely after login'
          });
          
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
        const pageText = await this.browser.getPageSource();
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
}
