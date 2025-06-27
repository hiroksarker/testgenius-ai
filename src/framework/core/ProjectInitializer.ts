import fs from 'fs-extra';
import path from 'path';
import { InitOptions } from '../../types';

export class ProjectInitializer {
  constructor() {}

  async init(options: InitOptions = {}): Promise<void> {
    const dirs = ['src/tests', 'test-results', 'reports', 'screenshots', 'logs'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(process.cwd(), dir));
    }
    // Copy env.example to .env if not present
    const envPath = path.join(process.cwd(), '.env');
    const envExample = path.join(process.cwd(), 'env.example');
    if (!(await fs.pathExists(envPath)) && (await fs.pathExists(envExample))) {
      await fs.copyFile(envExample, envPath);
      console.log('✅ .env file created from env.example');
    }
    // Create config if not present
    const configPath = path.join(process.cwd(), 'testgenius.config.js');
    if (!(await fs.pathExists(configPath))) {
      await fs.writeFile(configPath, `module.exports = require('./src/types').defaultConfig;\n`, 'utf8');
      console.log('✅ testgenius.config.js created');
    }
    console.log('✅ Project initialized!');
  }
}
