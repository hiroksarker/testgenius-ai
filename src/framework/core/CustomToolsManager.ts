import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { ConfigManager } from './ConfigManager';
import { FrameworkConfig } from '../../types';

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'api' | 'ui' | 'database' | 'file' | 'custom';
  template: string;
  dependencies: string[];
  config: Record<string, any>;
  enabled: boolean;
  path: string;
}

export interface ToolTemplate {
  name: string;
  description: string;
  category: string;
  template: string;
  dependencies: string[];
  configSchema: Record<string, any>;
}

export class CustomToolsManager {
  private configManager: ConfigManager;
  private toolsDir: string;
  private templatesDir: string;

  constructor() {
    this.configManager = new ConfigManager();
    this.toolsDir = path.join(process.cwd(), 'tools');
    this.templatesDir = path.join(process.cwd(), 'tool-templates');
  }

  /**
   * Initialize custom tools system
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.toolsDir);
    await fs.ensureDir(this.templatesDir);
    
    // Create default templates
    await this.createDefaultTemplates();
  }

  /**
   * Create a new custom tool
   */
  async createTool(toolId: string, options: {
    template?: string;
    name?: string;
    description?: string;
    category?: string;
    author?: string;
  } = {}): Promise<CustomTool> {
    const config = await this.configManager.loadConfig();
    
    const tool: CustomTool = {
      id: toolId,
      name: options.name || toolId,
      description: options.description || `Custom tool: ${toolId}`,
      version: '1.0.0',
      author: options.author || 'Unknown',
      category: (options.category as any) || 'custom',
      template: options.template || 'basic',
      dependencies: [],
      config: {},
      enabled: true,
      path: path.join(this.toolsDir, toolId)
    };

    // Create tool directory
    await fs.ensureDir(tool.path);

    // Copy template files
    await this.copyTemplateFiles(tool.template, tool.path);

    // Create tool configuration
    await this.createToolConfig(tool);

    // Create tool implementation
    await this.createToolImplementation(tool);

    console.log(chalk.green(`✅ Custom tool "${toolId}" created successfully!`));
    console.log(chalk.blue(`📁 Location: ${tool.path}`));
    console.log(chalk.yellow(`💡 Next steps:`));
    console.log(chalk.yellow(`   1. Edit ${tool.path}/index.ts`));
    console.log(chalk.yellow(`   2. Configure ${tool.path}/config.json`));
    console.log(chalk.yellow(`   3. Run: testgenius validate tools`));

    return tool;
  }

  /**
   * List all custom tools
   */
  async listTools(verbose: boolean = false): Promise<CustomTool[]> {
    const tools: CustomTool[] = [];

    if (!await fs.pathExists(this.toolsDir)) {
      return tools;
    }

    const toolDirs = await fs.readdir(this.toolsDir);
    
    for (const toolDir of toolDirs) {
      const toolPath = path.join(this.toolsDir, toolDir);
      const stats = await fs.stat(toolPath);
      
      if (stats.isDirectory()) {
        try {
          const configPath = path.join(toolPath, 'config.json');
          const config = await fs.readJson(configPath);
          
          const tool: CustomTool = {
            id: toolDir,
            name: config.name || toolDir,
            description: config.description || '',
            version: config.version || '1.0.0',
            author: config.author || 'Unknown',
            category: config.category || 'custom',
            template: config.template || 'basic',
            dependencies: config.dependencies || [],
            config: config.config || {},
            enabled: config.enabled !== false,
            path: toolPath
          };

          tools.push(tool);

          if (verbose) {
            console.log(chalk.blue(`\n🔧 Tool: ${tool.name} (${tool.id})`));
            console.log(chalk.gray(`   Description: ${tool.description}`));
            console.log(chalk.gray(`   Category: ${tool.category}`));
            console.log(chalk.gray(`   Version: ${tool.version}`));
            console.log(chalk.gray(`   Author: ${tool.author}`));
            console.log(chalk.gray(`   Status: ${tool.enabled ? '✅ Enabled' : '❌ Disabled'}`));
            console.log(chalk.gray(`   Path: ${tool.path}`));
          }
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Invalid tool: ${toolDir}`));
        }
      }
    }

    return tools;
  }

  /**
   * Validate all custom tools
   */
  async validateTools(): Promise<{ valid: CustomTool[]; invalid: string[] }> {
    const tools = await this.listTools();
    const valid: CustomTool[] = [];
    const invalid: string[] = [];

    for (const tool of tools) {
      try {
        await this.validateTool(tool);
        valid.push(tool);
      } catch (error) {
        invalid.push(`${tool.id}: ${(error as Error).message}`);
      }
    }

    return { valid, invalid };
  }

  /**
   * Validate a single tool
   */
  async validateTool(tool: CustomTool): Promise<void> {
    // Check required files
    const requiredFiles = ['index.ts', 'config.json', 'README.md'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(tool.path, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Missing required file: ${file}`);
      }
    }

    // Check TypeScript compilation
    try {
      // This would require TypeScript compilation check
      // For now, just check if files exist
    } catch (error) {
      throw new Error(`TypeScript compilation failed: ${(error as Error).message}`);
    }

    // Check configuration
    if (!tool.name || !tool.description) {
      throw new Error('Invalid configuration: name and description are required');
    }
  }

  /**
   * Enable/disable a tool
   */
  async toggleTool(toolId: string, enabled: boolean): Promise<void> {
    const configPath = path.join(this.toolsDir, toolId, 'config.json');
    
    if (!await fs.pathExists(configPath)) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const config = await fs.readJson(configPath);
    config.enabled = enabled;
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    console.log(chalk.green(`✅ Tool "${toolId}" ${enabled ? 'enabled' : 'disabled'}`));
  }

  /**
   * Delete a tool
   */
  async deleteTool(toolId: string): Promise<void> {
    const toolPath = path.join(this.toolsDir, toolId);
    
    if (!await fs.pathExists(toolPath)) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    await fs.remove(toolPath);
    console.log(chalk.green(`✅ Tool "${toolId}" deleted successfully`));
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<ToolTemplate[]> {
    const templates: ToolTemplate[] = [
      {
        name: 'basic',
        description: 'Basic tool template with minimal setup',
        category: 'custom',
        template: 'basic',
        dependencies: [],
        configSchema: {
          name: { type: 'string', required: true },
          description: { type: 'string', required: true }
        }
      },
      {
        name: 'api',
        description: 'API testing tool template',
        category: 'api',
        template: 'api',
        dependencies: ['axios'],
        configSchema: {
          baseUrl: { type: 'string', required: true },
          headers: { type: 'object', required: false }
        }
      },
      {
        name: 'ui',
        description: 'UI interaction tool template',
        category: 'ui',
        template: 'ui',
        dependencies: ['webdriverio'],
        configSchema: {
          selectors: { type: 'object', required: true },
          timeouts: { type: 'object', required: false }
        }
      },
      {
        name: 'database',
        description: 'Database testing tool template',
        category: 'database',
        template: 'database',
        dependencies: ['mysql2', 'pg'],
        configSchema: {
          connection: { type: 'object', required: true },
          queries: { type: 'object', required: false }
        }
      }
    ];

    return templates;
  }

  /**
   * Create default templates
   */
  private async createDefaultTemplates(): Promise<void> {
    const templates = await this.getTemplates();
    
    for (const template of templates) {
      await this.createTemplateFiles(template);
    }
  }

  /**
   * Create template files
   */
  private async createTemplateFiles(template: ToolTemplate): Promise<void> {
    const templateDir = path.join(this.templatesDir, template.name);
    await fs.ensureDir(templateDir);

    // Create template files based on type
    switch (template.template) {
      case 'basic':
        await this.createBasicTemplate(templateDir);
        break;
      case 'api':
        await this.createApiTemplate(templateDir);
        break;
      case 'ui':
        await this.createUiTemplate(templateDir);
        break;
      case 'database':
        await this.createDatabaseTemplate(templateDir);
        break;
    }
  }

  /**
   * Create basic template files
   */
  private async createBasicTemplate(templateDir: string): Promise<void> {
    const files = {
      'index.ts': `import { CustomTool } from '../../framework/core/CustomToolsManager';

export class BasicTool {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async execute(params: any): Promise<any> {
    // Your tool logic here
    console.log('Basic tool executed with params:', params);
    return { success: true, result: 'Basic tool completed' };
  }
}`,
      'config.json': `{
  "name": "Basic Tool",
  "description": "A basic custom tool",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "custom",
  "template": "basic",
  "dependencies": [],
  "config": {},
  "enabled": true
}`,
      'README.md': `# Basic Tool

A basic custom tool template.

## Usage

\`\`\`typescript
const tool = new BasicTool(config);
const result = await tool.execute(params);
\`\`\`

## Configuration

Edit \`config.json\` to customize the tool behavior.
`
    };

    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(templateDir, filename), content);
    }
  }

  /**
   * Create API template files
   */
  private async createApiTemplate(templateDir: string): Promise<void> {
    const files = {
      'index.ts': `import axios from 'axios';
import { CustomTool } from '../../framework/core/CustomToolsManager';

export class ApiTool {
  private config: any;
  private client: any;

  constructor(config: any) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: config.headers || {}
    });
  }

  async execute(params: any): Promise<any> {
    const { method = 'GET', endpoint, data } = params;
    
    try {
      const response = await this.client.request({
        method,
        url: endpoint,
        data
      });
      
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}`,
      'config.json': `{
  "name": "API Tool",
  "description": "API testing tool",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "api",
  "template": "api",
  "dependencies": ["axios"],
  "config": {
    "baseUrl": "https://api.example.com",
    "headers": {
      "Content-Type": "application/json"
    }
  },
  "enabled": true
}`,
      'README.md': `# API Tool

API testing tool for making HTTP requests.

## Usage

\`\`\`typescript
const tool = new ApiTool(config);
const result = await tool.execute({
  method: 'POST',
  endpoint: '/users',
  data: { name: 'John' }
});
\`\`\`

## Configuration

- \`baseUrl\`: Base URL for API requests
- \`headers\`: Default headers to include in requests
`
    };

    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(templateDir, filename), content);
    }
  }

  /**
   * Create UI template files
   */
  private async createUiTemplate(templateDir: string): Promise<void> {
    const files = {
      'index.ts': `import { Browser } from 'webdriverio';
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
          throw new Error(\`Unknown action: \${action}\`);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}`,
      'config.json': `{
  "name": "UI Tool",
  "description": "UI interaction tool",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "ui",
  "template": "ui",
  "dependencies": ["webdriverio"],
  "config": {
    "selectors": {
      "loginButton": "#login-btn",
      "usernameField": "#username",
      "passwordField": "#password"
    },
    "timeouts": {
      "implicit": 10000,
      "explicit": 5000
    }
  },
  "enabled": true
}`,
      'README.md': `# UI Tool

UI interaction tool for WebDriverIO automation.

## Usage

\`\`\`typescript
const tool = new UiTool(config);
tool.setBrowser(browser);

const result = await tool.execute({
  action: 'click',
  selector: '#login-btn'
});
\`\`\`

## Actions

- \`click\`: Click an element
- \`type\`: Type text into an element
- \`getText\`: Get text from an element

## Configuration

- \`selectors\`: Common selectors used by the tool
- \`timeouts\`: Timeout configurations
`
    };

    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(templateDir, filename), content);
    }
  }

  /**
   * Create database template files
   */
  private async createDatabaseTemplate(templateDir: string): Promise<void> {
    const files = {
      'index.ts': `import mysql from 'mysql2/promise';
import { CustomTool } from '../../framework/core/CustomToolsManager';

export class DatabaseTool {
  private config: any;
  private connection: any;

  constructor(config: any) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection(this.config.connection);
  }

  async execute(params: any): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }

    const { query, values } = params;
    
    try {
      const [rows] = await this.connection.execute(query, values);
      return {
        success: true,
        rows
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
  }
}`,
      'config.json': `{
  "name": "Database Tool",
  "description": "Database testing tool",
  "version": "1.0.0",
  "author": "Your Name",
  "category": "database",
  "template": "database",
  "dependencies": ["mysql2"],
  "config": {
    "connection": {
      "host": "localhost",
      "user": "root",
      "password": "password",
      "database": "testdb"
    },
    "queries": {
      "getUser": "SELECT * FROM users WHERE id = ?",
      "createUser": "INSERT INTO users (name, email) VALUES (?, ?)"
    }
  },
  "enabled": true
}`,
      'README.md': `# Database Tool

Database testing tool for MySQL operations.

## Usage

\`\`\`typescript
const tool = new DatabaseTool(config);

const result = await tool.execute({
  query: "SELECT * FROM users WHERE id = ?",
  values: [1]
});
\`\`\`

## Configuration

- \`connection\`: Database connection parameters
- \`queries\`: Common queries used by the tool
`
    };

    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(templateDir, filename), content);
    }
  }

  /**
   * Copy template files to tool directory
   */
  private async copyTemplateFiles(templateName: string, toolPath: string): Promise<void> {
    const templatePath = path.join(this.templatesDir, templateName);
    
    if (!await fs.pathExists(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    await fs.copy(templatePath, toolPath);
  }

  /**
   * Create tool configuration
   */
  private async createToolConfig(tool: CustomTool): Promise<void> {
    const configPath = path.join(tool.path, 'config.json');
    await fs.writeJson(configPath, {
      name: tool.name,
      description: tool.description,
      version: tool.version,
      author: tool.author,
      category: tool.category,
      template: tool.template,
      dependencies: tool.dependencies,
      config: tool.config,
      enabled: tool.enabled
    }, { spaces: 2 });
  }

  /**
   * Create tool implementation
   */
  private async createToolImplementation(tool: CustomTool): Promise<void> {
    // The implementation file is already copied from template
    // This method can be used for additional customization if needed
  }
} 