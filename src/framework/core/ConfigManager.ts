import { FrameworkConfig } from '../../types';
import path from 'path';
import fs from 'fs-extra';
import dotenv from 'dotenv';

export class ConfigManager {
  private config?: FrameworkConfig;

  constructor() {
    dotenv.config();
  }

  async loadConfig(): Promise<FrameworkConfig> {
    if (!this.config) {
      const configPath = path.join(process.cwd(), 'testgenius.config.js');
      if (!(await fs.pathExists(configPath))) {
        throw new Error('testgenius.config.js not found. Please run testgenius init.');
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const baseConfig = require(configPath);
      this.config = baseConfig.default || baseConfig;
    }
    return this.config!;
  }

  getConfig(): FrameworkConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  // Placeholder methods
  async init(): Promise<void> {
    console.log('ConfigManager initialized');
  }
}
