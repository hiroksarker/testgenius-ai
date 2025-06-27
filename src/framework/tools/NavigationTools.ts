import { Browser } from 'webdriverio';

export class NavigationTools {
  private browser: Browser | null = null;

  setBrowser(browser: Browser): void {
    this.browser = browser;
  }

  async goTo(url: string): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    await this.browser.url(url);
  }

  async back(): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    await this.browser.back();
  }

  async forward(): Promise<void> {
    if (!this.browser) throw new Error('Browser not initialized');
    await this.browser.forward();
  }

  // Placeholder methods
  async init(): Promise<void> {
    console.log('NavigationTools initialized');
  }
}
