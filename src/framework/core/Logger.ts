import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  includeTimestamp: boolean;
  includeTestId: boolean;
  maxFileSize: number; // in MB
  maxFiles: number;
}

export class Logger {
  private config: LogConfig;
  private currentTestId: string = '';
  private logFile: string = '';

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false, // Disabled by default for simplicity
      logDir: 'logs',
      includeTimestamp: true,
      includeTestId: true,
      maxFileSize: 10, // 10MB
      maxFiles: 5,
      ...config
    };

    this.initializeLogFile();
  }

  private initializeLogFile(): void {
    if (this.config.enableFile) {
      try {
        fs.ensureDirSync(this.config.logDir);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFile = path.join(this.config.logDir, `testgenius-${timestamp}.log`);
      } catch (error) {
        console.warn('Could not initialize log file:', error);
        this.config.enableFile = false;
      }
    }
  }

  setTestId(testId: string): void {
    this.currentTestId = testId;
  }

  private formatMessage(level: string, message: string): string {
    let formatted = '';
    
    if (this.config.includeTimestamp) {
      formatted += `[${new Date().toLocaleString()}] `;
    }
    
    formatted += `[${level}] `;
    
    if (this.config.includeTestId && this.currentTestId) {
      formatted += `[${this.currentTestId}] `;
    }
    
    formatted += message;
    
    return formatted;
  }

  private async writeToFile(message: string): Promise<void> {
    if (!this.config.enableFile || !this.logFile) return;

    try {
      await fs.appendFile(this.logFile, message + '\n');
    } catch (error) {
      console.warn('Could not write to log file:', error);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.DEBUG) {
      const formattedMessage = this.formatMessage('DEBUG', message);
      
      if (this.config.enableConsole) {
        console.log(chalk.gray(formattedMessage), ...args);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      const formattedMessage = this.formatMessage('INFO', message);
      
      if (this.config.enableConsole) {
        console.log(chalk.blue(formattedMessage), ...args);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.WARN) {
      const formattedMessage = this.formatMessage('WARN', message);
      
      if (this.config.enableConsole) {
        console.log(chalk.yellow(formattedMessage), ...args);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.ERROR) {
      const formattedMessage = this.formatMessage('ERROR', message);
      
      if (this.config.enableConsole) {
        console.log(chalk.red(formattedMessage), ...args);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.config.level <= LogLevel.INFO) {
      const formattedMessage = this.formatMessage('SUCCESS', message);
      
      if (this.config.enableConsole) {
        console.log(chalk.green(formattedMessage), ...args);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  // Test-specific logging methods
  testStart(testId: string, testName: string): void {
    this.setTestId(testId);
    this.info(`Starting test: ${testName} (${testId})`);
  }

  testStep(stepNumber: number, description: string): void {
    this.info(`Step ${stepNumber}: ${description}`);
  }

  testSuccess(testId: string, duration: number): void {
    this.success(`Test ${testId} completed successfully in ${duration}ms`);
  }

  testFailure(testId: string, error: string, duration: number): void {
    this.error(`Test ${testId} failed after ${duration}ms: ${error}`);
  }

  // Browser-specific logging methods
  browserNavigation(url: string): void {
    this.info(`🌐 Navigating to: ${url}`);
  }

  browserScreenshot(path: string): void {
    this.info(`📸 Screenshot saved: ${path}`);
  }

  // AI-specific logging methods
  aiRequest(prompt: string): void {
    this.debug(`🤖 AI Request: ${prompt.substring(0, 100)}...`);
  }

  aiResponse(response: string): void {
    this.debug(`🤖 AI Response: ${response.substring(0, 100)}...`);
  }

  aiError(error: string): void {
    this.error(`🤖 AI Error: ${error}`);
  }

  // Configuration methods
  updateConfig(newConfig: Partial<LogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableFile && !this.config.enableFile) {
      this.initializeLogFile();
    }
  }

  getConfig(): LogConfig {
    return { ...this.config };
  }

  // Simple file management methods
  async getLogFiles(): Promise<string[]> {
    if (!this.config.enableFile || !this.config.logDir) {
      return [];
    }

    try {
      const files = await fs.readdir(this.config.logDir);
      return files
        .filter(file => file.startsWith('testgenius-') && file.endsWith('.log'))
        .map(file => path.join(this.config.logDir, file));
    } catch (error) {
      console.warn('Could not read log directory:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    if (!this.config.enableFile || !this.config.logDir) {
      return;
    }

    try {
      const files = await this.getLogFiles();
      for (const file of files) {
        await fs.remove(file);
      }
      console.log(`🗑️  Cleared ${files.length} log files`);
    } catch (error) {
      console.warn('Could not clear log files:', error);
    }
  }
} 