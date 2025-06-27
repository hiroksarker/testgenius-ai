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
      
      // Analyze the task and create execution plan
      const plan = await this.createExecutionPlan(test, options);
      
      // Execute the plan
      const result = await this.executePlan(plan, test, options);
      
      return {
        success: result.success,
        steps: this.steps,
        screenshots: this.screenshots,
        errors: result.errors || []
      };

    } catch (error) {
      console.error(chalk.red('❌ AI execution failed:'), (error as Error).message);
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
}
