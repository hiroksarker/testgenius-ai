import { Browser } from 'webdriverio';
import chalk from 'chalk';

export interface ElementMatch {
  element: any;
  confidence: number;
  strategy: string;
  selector: string;
}

export interface DetectionStrategy {
  name: string;
  priority: number;
  selectors: string[];
  description: string;
}

export class SmartElementDetector {
  private browser: Browser | null = null;
  private cache: Map<string, ElementMatch> = new Map();
  private pageContext: any = {};

  constructor(browser: Browser) {
    this.browser = browser;
  }

  /**
   * 🚀 Fast element detection with multiple strategies
   */
  async detectElement(description: string, elementType?: string): Promise<ElementMatch | null> {
    if (!this.browser) throw new Error('Browser not initialized');

    // Check cache first
    const cacheKey = `${description}_${elementType || 'any'}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      console.log(chalk.gray(`⚡ Using cached element: ${cached.strategy}`));
      return cached;
    }

    console.log(chalk.blue(`🔍 Detecting element: ${description}`));

    // Generate strategies based on description and type
    const strategies = this.generateStrategies(description, elementType);
    
    // Try each strategy in priority order
    for (const strategy of strategies) {
      try {
        const result = await this.tryStrategy(strategy, description);
        if (result) {
          // Cache the result
          this.cache.set(cacheKey, result);
          console.log(chalk.green(`✅ Found element using: ${strategy.name} (${result.confidence}% confidence)`));
          return result;
        }
      } catch (error) {
        console.log(chalk.yellow(`⚠️ Strategy failed: ${strategy.name}`));
        continue;
      }
    }

    console.log(chalk.red(`❌ No element found for: ${description}`));
    return null;
  }

  /**
   * 🎯 Generate detection strategies (Fast, no AI)
   */
  private generateStrategies(description: string, elementType?: string): DetectionStrategy[] {
    const words = description.split(' ').filter(word => word.length > 2);
    const descriptionLower = description.toLowerCase();
    
    const strategies: DetectionStrategy[] = [];

    // Strategy 1: Accessibility Name (Highest Priority)
    strategies.push({
      name: 'Accessibility Name',
      priority: 1,
      selectors: words.map(word => `aria/${word}`),
      description: 'Best practice - accessibility focused'
    });

    // Strategy 2: Text-based (User-centric)
    strategies.push({
      name: 'Text-based',
      priority: 2,
      selectors: [
        ...words.map(word => `${word}`),
        ...words.map(word => `*=${word}`),
        ...words.map(word => `.*=${word}`)
      ],
      description: 'User-centric text matching'
    });

    // Strategy 3: Element-specific text
    if (elementType) {
      strategies.push({
        name: `${elementType} Text`,
        priority: 3,
        selectors: words.map(word => `${elementType}=${word}`),
        description: `Element-specific text matching for ${elementType}`
      });
    }

    // Strategy 4: Data attributes
    strategies.push({
      name: 'Data Attributes',
      priority: 4,
      selectors: words.map(word => `[data-testid*="${word}"]`),
      description: 'Test-specific attributes'
    });

    // Strategy 5: ARIA attributes
    strategies.push({
      name: 'ARIA Attributes',
      priority: 5,
      selectors: words.map(word => `[aria-label*="${word}"]`),
      description: 'Accessibility attributes'
    });

    // Strategy 6: Common patterns
    if (descriptionLower.includes('button')) {
      strategies.push({
        name: 'Button Patterns',
        priority: 6,
        selectors: ['button', '[role="button"]', '.btn', '.button'],
        description: 'Common button patterns'
      });
    }

    if (descriptionLower.includes('input') || descriptionLower.includes('field')) {
      strategies.push({
        name: 'Input Patterns',
        priority: 6,
        selectors: ['input', 'textarea', 'select'],
        description: 'Common input patterns'
      });
    }

    // Strategy 7: Generic fallback
    strategies.push({
      name: 'Generic Fallback',
      priority: 7,
      selectors: ['button', 'input', 'a', '[role="button"]'],
      description: 'Generic element types'
    });

    return strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * ⚡ Try a specific strategy
   */
  private async tryStrategy(strategy: DetectionStrategy, description: string): Promise<ElementMatch | null> {
    for (const selector of strategy.selectors) {
      try {
        const element = await this.browser!.$(selector);
        if (element && await element.isExisting()) {
          const confidence = this.calculateConfidence(strategy, selector, description);
          return {
            element,
            confidence,
            strategy: strategy.name,
            selector
          };
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  /**
   * 📊 Calculate confidence score
   */
  private calculateConfidence(strategy: DetectionStrategy, selector: string, description: string): number {
    let confidence = 100;

    // Reduce confidence based on strategy priority
    confidence -= (strategy.priority - 1) * 10;

    // Boost confidence for exact matches
    const words = description.split(' ').filter(word => word.length > 2);
    const exactMatches = words.filter(word => selector.includes(word)).length;
    confidence += exactMatches * 5;

    // Reduce confidence for generic selectors
    if (selector === 'button' || selector === 'input' || selector === 'a') {
      confidence -= 20;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * 🧹 Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 📈 Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }
} 