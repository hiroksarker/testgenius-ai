import { Browser } from 'webdriverio';

export class BrowserTools {
  private browser: Browser | null = null;

  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  async waitForElement(selector: string, timeout = 5000): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    await this.browser.$(selector).waitForExist({ timeout });
  }

  async takeScreenshot(name: string): Promise<string> {
    if (!this.browser) throw new Error('Browser not initialized');
    const filePath = `screenshots/${name}-${Date.now()}.png`;
    await this.browser.saveScreenshot(filePath);
    return filePath;
  }

  // Placeholder methods
  async init(): Promise<void> {
    console.log('BrowserTools initialized');
  }
}
