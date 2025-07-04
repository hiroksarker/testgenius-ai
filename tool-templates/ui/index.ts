import { Browser } from 'webdriverio';
import { CustomTool } from '../../framework/core/CustomToolsManager';

export class UiTool {
  private config: any;
  private browser: Browser | null = null;

  constructor(config: any) {
    this.config = config;
  }

  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  async execute(params: any): Promise<any> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const { action, selector, value } = params;
    
    try {
      switch (action) {
        case 'click':
          await this.browser.$(selector).click();
          break;
        case 'type':
          await this.browser.$(selector).setValue(value);
          break;
        case 'getText':
          const text = await this.browser.$(selector).getText();
          return { success: true, text };
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}