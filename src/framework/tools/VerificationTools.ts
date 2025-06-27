import { Browser } from 'webdriverio';

export class VerificationTools {
  private browser: Browser | null = null;

  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  async verifyText(text: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    const pageSource = await this.browser.getPageSource();
    if (!pageSource.includes(text)) throw new Error(`Text not found: ${text}`);
  }

  async verifyElement(selector: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    const exists = await this.browser.$(selector).isExisting();
    if (!exists) throw new Error(`Element not found: ${selector}`);
  }

  // Placeholder methods
  async init(): Promise<void> {
    console.log('VerificationTools initialized');
  }
}
