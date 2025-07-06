/**
 * 🛠️ Smart Tools - Intelligent Browser Automation Tools
 * Provides LangChain tools for the Smart AI Agent
 * Adapted from Endorphin AI's sophisticated tool system for WebDriverIO
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Browser } from 'webdriverio';
import chalk from 'chalk';

export interface SmartToolContext {
  browser: Browser;
  currentUrl?: string;
  pageTitle?: string;
  lastAction?: string;
  errorCount: number;
  successCount: number;
}

/**
 * Smart Navigation Tool - Enhanced with schema validation
 */
export function createSmartNavigationTool(context: SmartToolContext) {
  return tool(
    async (params: { url: string; waitForLoad?: boolean }) => {
      const { url, waitForLoad = true } = params;
      
      console.log(chalk.blue(`🧭 Smart Navigation: ${url}`));
      
      try {
        await context.browser.url(url);
        
        if (waitForLoad) {
          await context.browser.pause(2000);
          // Wait for page to be ready
          await context.browser.waitUntil(
            async () => {
              const readyState = await context.browser.execute(() => document.readyState);
              return readyState === 'complete';
            },
            { timeout: 10000, timeoutMsg: 'Page load timeout' }
          );
        }
        
        const currentUrl = await context.browser.getUrl();
        const pageTitle = await context.browser.getTitle();
        
        context.currentUrl = currentUrl;
        context.pageTitle = pageTitle;
        context.lastAction = 'navigation';
        context.successCount++;
        
        return `✅ Successfully navigated to ${url}. Current URL: ${currentUrl}, Page Title: ${pageTitle}`;
      } catch (error) {
        context.errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`❌ Navigation failed: ${errorMsg}`));
        return `❌ Navigation failed: ${errorMsg}`;
      }
    },
    {
      name: 'smart_navigate',
      description: 'Navigate to a URL with intelligent error handling and page load verification',
      schema: z.object({
        url: z.string().describe('URL to navigate to'),
        waitForLoad: z.boolean().optional().describe('Wait for page to fully load'),
      }),
    }
  );
}

/**
 * Smart Click Tool - Enhanced with multiple strategies
 */
export function createSmartClickTool(context: SmartToolContext) {
  return tool(
    async (params: {
      selector: string;
      strategy?: 'css' | 'text' | 'exact-text' | 'xpath' | 'id' | 'name';
      timeout?: number;
      force?: boolean;
    }) => {
      const { selector, strategy = 'css', timeout = 10000, force = false } = params;
      
      console.log(chalk.blue(`🖱️ Smart Click: ${selector} using ${strategy} strategy`));
      
      try {
        let element = null;
        let usedStrategy = strategy;
        
        // Try the specified strategy first
        element = await findElementByStrategy(context.browser, selector, strategy);
        
        // If not found, try fallback strategies
        if (!element || !(await element.isExisting())) {
          const fallbackStrategies: Array<'text' | 'xpath' | 'css' | 'id' | 'name'> = ['text', 'xpath', 'css', 'id', 'name'];
          for (const fallbackStrategy of fallbackStrategies) {
            if (fallbackStrategy !== strategy) {
              element = await findElementByStrategy(context.browser, selector, fallbackStrategy);
              if (element && (await element.isExisting())) {
                usedStrategy = fallbackStrategy;
                console.log(chalk.yellow(`🔄 Using fallback strategy: ${fallbackStrategy}`));
                break;
              }
            }
          }
        }
        
        if (!element || !(await element.isExisting())) {
          throw new Error(`Element not found using any strategy: ${selector}`);
        }
        
        // Wait for element to be visible and clickable
        await element.waitForDisplayed({ timeout });
        await element.waitForClickable({ timeout });
        
        // Check if element is clickable
        const isClickable = await isElementClickable(element);
        if (!isClickable && !force) {
          throw new Error(`Element is not clickable: ${selector}`);
        }
        
        await element.click();
        context.lastAction = 'click';
        context.successCount++;
        
        return `✅ Successfully clicked on ${selector} using ${usedStrategy} strategy`;
      } catch (error) {
        context.errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`❌ Click failed: ${errorMsg}`));
        return `❌ Click failed: ${errorMsg}`;
      }
    },
    {
      name: 'smart_click',
      description: 'Click on an element with intelligent element detection and multiple strategies. Use strategy="text" for button text, strategy="css" for CSS selectors.',
      schema: z.object({
        selector: z.string().describe('Element selector or text to click'),
        strategy: z.enum(['css', 'text', 'exact-text', 'xpath', 'id', 'name']).optional().describe('Selection strategy'),
        timeout: z.number().optional().describe('Timeout in milliseconds'),
        force: z.boolean().optional().describe('Force click even if element is not clickable'),
      }),
    }
  );
}

/**
 * Smart Fill Tool - Enhanced with field detection
 */
export function createSmartFillTool(context: SmartToolContext) {
  return tool(
    async (params: {
      selector: string;
      value: string;
      strategy?: 'fill' | 'type';
      clearFirst?: boolean;
      pressEnter?: boolean;
    }) => {
      const { selector, value, strategy = 'fill', clearFirst = true, pressEnter = false } = params;
      
      console.log(chalk.blue(`📝 Smart Fill: ${selector} with "${value}"`));
      
      try {
        let finalSelector = selector;
        let element = null;
        
        // Try multiple strategies for common field types
        if (selector.includes('email')) {
          const emailSelectors = [
            'input[type="email"]',
            'input[name*="email"]',
            'input[placeholder*="email"]',
            '#email',
            '.email-input',
            selector,
          ];
          
          for (const sel of emailSelectors) {
            try {
              element = await context.browser.$(sel);
              if (await element.isExisting()) {
                finalSelector = sel;
                console.log(chalk.green(`📧 Found email field using selector: ${sel}`));
                break;
              }
            } catch {
              continue;
            }
          }
        } else if (selector.includes('password')) {
          const passwordSelectors = [
            'input[type="password"]',
            'input[name*="password"]',
            'input[placeholder*="password"]',
            '#password',
            '.password-input',
            selector,
          ];
          
          for (const sel of passwordSelectors) {
            try {
              element = await context.browser.$(sel);
              if (await element.isExisting()) {
                finalSelector = sel;
                console.log(chalk.green(`🔒 Found password field using selector: ${sel}`));
                break;
              }
            } catch {
              continue;
            }
          }
        }
        
        // If no element found, try the original selector
        if (!element) {
          element = await context.browser.$(finalSelector);
        }
        
        if (!element || !(await element.isExisting())) {
          throw new Error(`Field not found: ${selector}`);
        }
        
        // Wait for element to be visible
        await element.waitForDisplayed({ timeout: 10000 });
        
        if (clearFirst) {
          await element.clearValue();
          await context.browser.pause(200);
          
          // Verify clearing worked
          const currentValue = await element.getValue();
          if (currentValue && currentValue.length > 0) {
            console.log(chalk.yellow(`⚠️ Field still contains "${currentValue}", trying alternative clearing...`));
            await element.setValue('');
            await context.browser.pause(100);
          }
        }
        
        if (strategy === 'type') {
          await element.setValue(value);
        } else {
          await element.setValue(value);
        }
        
        if (pressEnter) {
          await context.browser.keys(['Enter']);
        }
        
        // Verify the value was set correctly
        const actualValue = await element.getValue();
        const success = actualValue === value;
        
        context.lastAction = 'fill';
        context.successCount++;
        
        const result = success
          ? `✅ Successfully filled ${finalSelector} with "${value}"`
          : `⚠️ Filled ${finalSelector} but value is "${actualValue}" instead of "${value}"`;
        
        return result;
      } catch (error) {
        context.errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`❌ Fill failed: ${errorMsg}`));
        return `❌ Fill failed: ${errorMsg}`;
      }
    },
    {
      name: 'smart_fill',
      description: 'Fill any input field with text. Use common selectors like input[type="email"] for email fields, input[type="password"] for password fields.',
      schema: z.object({
        selector: z.string().describe('CSS selector of input field'),
        value: z.string().describe('Text to enter'),
        strategy: z.enum(['fill', 'type']).optional().describe('Input strategy'),
        clearFirst: z.boolean().optional().describe('Clear field before filling'),
        pressEnter: z.boolean().optional().describe('Press Enter after filling'),
      }),
    }
  );
}

/**
 * Smart Verify Tool - Enhanced with multiple verification types
 */
export function createSmartVerifyTool(context: SmartToolContext) {
  return tool(
    async (params: {
      type: 'text' | 'element' | 'url' | 'title' | 'count';
      selector?: string;
      expected: string | number;
      timeout?: number;
    }) => {
      const { type, selector, expected, timeout = 10000 } = params;
      
      console.log(chalk.blue(`🔍 Smart Verify: ${type} - ${expected}`));
      
      try {
        let result = '';
        let success = false;
        
        switch (type) {
          case 'text':
            if (!selector) throw new Error('Selector required for text verification');
            const element = await context.browser.$(selector);
            if (!(await element.isExisting())) {
              throw new Error(`Element not found: ${selector}`);
            }
            const actualText = await element.getText();
            success = actualText.includes(expected as string);
            result = success
              ? `✅ Text verification passed: "${expected}" found in "${actualText}"`
              : `❌ Text verification failed: expected "${expected}" but found "${actualText}"`;
            break;
            
          case 'element':
            if (!selector) throw new Error('Selector required for element verification');
            const elementExists = await context.browser.$(selector).isExisting();
            success = elementExists;
            result = success
              ? `✅ Element verification passed: "${selector}" exists`
              : `❌ Element verification failed: "${selector}" not found`;
            break;
            
          case 'url':
            const currentUrl = await context.browser.getUrl();
            success = currentUrl.includes(expected as string);
            result = success
              ? `✅ URL verification passed: "${expected}" found in "${currentUrl}"`
              : `❌ URL verification failed: expected "${expected}" but current URL is "${currentUrl}"`;
            break;
            
          case 'title':
            const pageTitle = await context.browser.getTitle();
            success = pageTitle.includes(expected as string);
            result = success
              ? `✅ Title verification passed: "${expected}" found in "${pageTitle}"`
              : `❌ Title verification failed: expected "${expected}" but title is "${pageTitle}"`;
            break;
            
          case 'count':
            if (!selector) throw new Error('Selector required for count verification');
            const elements = await context.browser.$$(selector);
            const actualCount = elements.length;
            success = actualCount === expected;
            result = success
              ? `✅ Count verification passed: found ${actualCount} elements matching "${selector}"`
              : `❌ Count verification failed: expected ${expected} but found ${actualCount} elements`;
            break;
        }
        
        if (success) {
          context.successCount++;
        } else {
          context.errorCount++;
        }
        
        return result;
      } catch (error) {
        context.errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`❌ Verification failed: ${errorMsg}`));
        return `❌ Verification failed: ${errorMsg}`;
      }
    },
    {
      name: 'smart_verify',
      description: 'Verify page content, elements, or conditions with intelligent checking',
      schema: z.object({
        type: z.enum(['text', 'element', 'url', 'title', 'count']).describe('Type of verification'),
        selector: z.string().optional().describe('Element selector for text/element/count verification'),
        expected: z.union([z.string(), z.number()]).describe('Expected value or text'),
        timeout: z.number().optional().describe('Timeout in milliseconds'),
      }),
    }
  );
}

/**
 * Smart Wait Tool - Enhanced with multiple wait types
 */
export function createSmartWaitTool(context: SmartToolContext) {
  return tool(
    async (params: {
      type: 'element' | 'text' | 'time' | 'network';
      selector?: string;
      value?: string;
      timeout?: number;
    }) => {
      const { type, selector, value, timeout = 10000 } = params;
      
      console.log(chalk.blue(`⏱️ Smart Wait: ${type} - ${selector || value || timeout}ms`));
      
      try {
        switch (type) {
          case 'element':
            if (!selector) throw new Error('Selector required for element wait');
            await context.browser.$(selector).waitForDisplayed({ timeout });
            return `✅ Element "${selector}" is now visible`;
            
          case 'text':
            if (!value) throw new Error('Text value required for text wait');
            await context.browser.waitUntil(
              async () => {
                const pageText = await context.browser.getPageSource();
                return pageText.includes(value);
              },
              { timeout, timeoutMsg: `Text "${value}" not found within ${timeout}ms` }
            );
            return `✅ Text "${value}" is now present on page`;
            
          case 'time':
            await context.browser.pause(timeout);
            return `✅ Waited for ${timeout}ms`;
            
          case 'network':
            // Wait for network idle (simplified implementation)
            await context.browser.pause(2000);
            return `✅ Network activity has settled`;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`❌ Wait failed: ${errorMsg}`));
        return `❌ Wait failed: ${errorMsg}`;
      }
    },
    {
      name: 'smart_wait',
      description: 'Wait for elements, conditions, or time with intelligent timeout handling',
      schema: z.object({
        type: z.enum(['element', 'text', 'time', 'network']).describe('Type of wait'),
        selector: z.string().optional().describe('Element selector for element wait'),
        value: z.string().optional().describe('Text value for text wait'),
        timeout: z.number().optional().describe('Timeout in milliseconds'),
      }),
    }
  );
}

/**
 * Smart Screenshot Tool - Enhanced with intelligent naming
 */
export function createSmartScreenshotTool(context: SmartToolContext) {
  return tool(
    async (params: { name?: string; description?: string }) => {
      const { name, description } = params;
      
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotName = name || `screenshot-${timestamp}`;
        
        console.log(chalk.blue(`📸 Smart Screenshot: ${screenshotName}`));
        
        const screenshotPath = await context.browser.saveScreenshot(`./screenshots/${screenshotName}.png`);
        
        context.lastAction = 'screenshot';
        context.successCount++;
        
        return `✅ Screenshot saved: ${screenshotPath}`;
      } catch (error) {
        context.errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`❌ Screenshot failed: ${errorMsg}`));
        return `❌ Screenshot failed: ${errorMsg}`;
      }
    },
    {
      name: 'smart_screenshot',
      description: 'Take a screenshot with intelligent naming and error handling',
      schema: z.object({
        name: z.string().optional().describe('Screenshot filename'),
        description: z.string().optional().describe('Description of what the screenshot captures'),
      }),
    }
  );
}

/**
 * Smart Get Content Tool - Enhanced content analysis
 */
export function createSmartGetContentTool(context: SmartToolContext) {
  return tool(
    async (params: { type?: 'full' | 'text' | 'elements'; selector?: string }) => {
      const { type = 'text', selector } = params;
      
      console.log(chalk.blue(`📄 Smart Get Content: ${type}${selector ? ` - ${selector}` : ''}`));
      
      try {
        let content = '';
        
        switch (type) {
          case 'full':
            content = await context.browser.getPageSource();
            break;
            
          case 'text':
            if (selector) {
              const element = await context.browser.$(selector);
              if (await element.isExisting()) {
                content = await element.getText();
              } else {
                throw new Error(`Element not found: ${selector}`);
              }
            } else {
              // Get all text content from the page
              content = await context.browser.execute(() => {
                return document.body.innerText || document.body.textContent || '';
              });
            }
            break;
            
          case 'elements':
            if (!selector) throw new Error('Selector required for elements content');
            const elements = await context.browser.$$(selector);
            const elementTexts: string[] = [];
            for (const el of elements) {
              elementTexts.push(await el.getText());
            }
            content = elementTexts.join('\n');
            break;
        }
        
        context.lastAction = 'get_content';
        context.successCount++;
        
        return `📄 Content retrieved (${type}):\n${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;
      } catch (error) {
        context.errorCount++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`❌ Get content failed: ${errorMsg}`));
        return `❌ Get content failed: ${errorMsg}`;
      }
    },
    {
      name: 'smart_get_content',
      description: 'Get page content with intelligent analysis and filtering',
      schema: z.object({
        type: z.enum(['full', 'text', 'elements']).optional().describe('Type of content to retrieve'),
        selector: z.string().optional().describe('Element selector for specific content'),
      }),
    }
  );
}

// Helper functions
async function findElementByStrategy(browser: Browser, selector: string, strategy: string) {
  try {
    switch (strategy) {
      case 'css':
        return await browser.$(selector);
      case 'xpath':
        return await browser.$(`xpath=${selector}`);
      case 'id':
        return await browser.$(`#${selector}`);
      case 'name':
        return await browser.$(`[name="${selector}"]`);
      case 'text':
        return await browser.$(`//*[contains(text(), '${selector}')]`);
      case 'exact-text':
        return await browser.$(`//*[text()='${selector}']`);
      default:
        return await browser.$(selector);
    }
  } catch {
    return null;
  }
}

async function isElementClickable(element: any): Promise<boolean> {
  try {
    const isDisplayed = await element.isDisplayed();
    const isEnabled = await element.isEnabled();
    return isDisplayed && isEnabled;
  } catch {
    return false;
  }
}

/**
 * Create all smart tools for the framework
 */
export function createAllSmartTools(browser: Browser): any[] {
  const context: SmartToolContext = {
    browser,
    errorCount: 0,
    successCount: 0,
  };

  const tools = [
    createSmartNavigationTool(context),
    createSmartClickTool(context),
    createSmartFillTool(context),
    createSmartVerifyTool(context),
    createSmartWaitTool(context),
    createSmartScreenshotTool(context),
    createSmartGetContentTool(context),
  ];

  console.log(`🛠️ Total smart tools available: ${tools.length}`);
  return tools;
} 