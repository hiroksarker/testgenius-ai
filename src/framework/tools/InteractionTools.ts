import { Browser } from 'webdriverio';

export class InteractionTools {
  private browser: Browser | null = null;

  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  async clickElement(selector: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    await this.browser.$(selector).click();
  }

  async fillForm(selector: string, value: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    const el = await this.browser.$(selector);
    await el.setValue(value);
  }

  // Placeholder methods
  async init(): Promise<void> {
    console.log('InteractionTools initialized');
  }
}
