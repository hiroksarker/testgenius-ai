// Core type definitions for TestGenius AI Framework

// Test Definition Types
export interface TestData {
  [key: string]: string | number | boolean | object;
}

export interface TestDefinition {
  id: string;
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  tags: string[];
  site: string;
  testData?: TestData;
  task: string | (() => Promise<string>) | ((data?: any, setupData?: any) => Promise<string>);
  steps?: TestStep[];
  // New async properties for enhanced test cases
  data?: () => Promise<TestData>;
  setup?: () => Promise<TestData>;
}

// Legacy TestDefinition for backward compatibility
export interface LegacyTestDefinition {
  id: string;
  name: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  tags: string[];
  site: string;
  testData?: TestData;
  task: string;
  steps?: TestStep[];
}

// Test Execution Types
export interface TestStep {
  action: string;
  selector?: string;
  value?: string | number | boolean;
  description: string;
  expectedResult: string;
}

export interface ExecutionStep {
  description: string;
  result: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  duration?: number;
}

export interface TestSession {
  testId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'passed' | 'failed' | 'pending';
  steps: ExecutionStep[];
  screenshots: string[];
  errors: string[];
  duration?: number;
}

export interface TestResult extends TestSession {
  id: string;
  success: boolean;
  browser?: string;
  viewport?: string;
  environment?: string;
}

// Test Suite Result for Allure reporting
export interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  totalDuration: number;
  successRate: number;
  results: TestResult[];
  timestamp: string;
}

// Configuration Types
export interface OpenAIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  retryAttempts: number;
}

export interface WebdriverIOConfig {
  automationProtocol?: 'webdriver' | 'devtools' | 'appium';
  hostname?: string;
  port?: number;
  path?: string;
  capabilities: {
    browserName: string;
    'goog:chromeOptions'?: {
      args: string[];
    };
    'moz:firefoxOptions'?: {
      args: string[];
    };
  };
  logLevel: string;
  timeout: number;
  waitforTimeout: number;
  connectionRetryCount?: number;
  connectionRetryTimeout?: number;
}

export interface BrowserConfig {
  defaultBrowser: string;
  headless: boolean;
  viewport: string;
  screenshotQuality: number;
}

export interface TestConfig {
  defaultEnvironment: string;
  parallelExecution: number;
  retryFailedTests: boolean;
  maxRetries: number;
}

export interface ReportingConfig {
  outputDir: string;
  retentionDays: number;
  includeScreenshots: boolean;
  includeConsoleLogs: boolean;
  generateSummary: boolean;
  // Allure reporting configuration
  allure: {
    enabled: boolean;
    resultsDir: string;
    reportDir: string;
    categories?: string;
    environment?: string;
    severity?: string;
    attachments?: boolean;
  };
}

export interface SessionConfig {
  dataDir: string;
  retentionCount: number;
  includeScreenshots: boolean;
  includePageSource: boolean;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeTimestamps: boolean;
  includeTestId: boolean;
}

export interface EnvironmentConfig {
  baseUrl: string;
  timeout: number;
}

export interface FrameworkConfig {
  openai: OpenAIConfig;
  webdriverio: WebdriverIOConfig;
  browser: BrowserConfig;
  test: TestConfig;
  reporting: ReportingConfig;
  session: SessionConfig;
  logging: LoggingConfig;
  environments: Record<string, EnvironmentConfig>;
  costTracking?: {
    enabled: boolean;
    currency: string;
    modelPricing: {
      'gpt-4o': { inputCostPer1k: number; outputCostPer1k: number };
      'gpt-4': { inputCostPer1k: number; outputCostPer1k: number };
      'gpt-3.5-turbo': { inputCostPer1k: number; outputCostPer1k: number };
    };
    budgetAlerts: {
      enabled: boolean;
      dailyLimit: number;
      monthlyLimit: number;
    };
    optimization: {
      enabled: boolean;
      suggestAlternativeModels: boolean;
      trackCostSavings: boolean;
    };
  };
}

// CLI Options Types
export interface TestRunOptions {
  tag?: string;
  priority?: string;
  browser?: string;
  headless?: boolean;
  viewport?: string;
  model?: string;
  parallel?: number;
  env?: string;
  file?: string;
  files?: string[];
  testIds?: string[];
  excludeFiles?: string[];
  allure?: boolean;
}

export interface ReportOptions {
  summary?: boolean;
  output?: string;
}

export interface CleanupOptions {
  keepCount?: number;
  days?: number;
}

export interface InitOptions {
  force?: boolean;
}

// AI Execution Types
export interface AIExecutionPlan {
  steps: TestStep[];
  confidence: number;
  reasoning: string;
}

export interface AIExecutionResult {
  success: boolean;
  steps: ExecutionStep[];
  screenshots: string[];
  errors: string[];
  aiPlan?: AIExecutionPlan;
}

export interface ExecutionStats {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalCost: number;
  tokenUsage: TokenUsage[];
  screenshots: string[];
  adaptiveStrategies: string[];
  fastMode: boolean;
  cacheStats: { size: number; hitRate: number };
}

// Browser Tools Types
export interface ElementSelector {
  css?: string;
  xpath?: string;
  text?: string;
  id?: string;
  name?: string;
  className?: string;
}

export interface ScreenshotOptions {
  quality?: number;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WaitOptions {
  timeout?: number;
  interval?: number;
  message?: string;
}

// Report Types
export interface ReportData {
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
    successRate: number;
  };
  tests: TestResult[];
  environment: string;
  timestamp: Date;
  version: string;
}

export interface ReportTemplate {
  name: string;
  path: string;
  data: ReportData;
}

// Recorder Types
export interface RecorderStep {
  type: 'click' | 'type' | 'navigate' | 'verify' | 'wait' | 'screenshot';
  selector?: ElementSelector;
  value?: string;
  description: string;
  timestamp: Date;
}

export interface RecorderSession {
  id: string;
  steps: RecorderStep[];
  startTime: Date;
  endTime?: Date;
  site: string;
}

// Error Types
export interface TestError {
  message: string;
  stack?: string;
  timestamp: Date;
  step?: string;
  screenshot?: string;
}

export interface FrameworkError extends Error {
  code: string;
  context?: Record<string, unknown>;
}

// Utility Types
export type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge';
export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type Priority = 'High' | 'Medium' | 'Low';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// OpenAI Types
export interface OpenAIMessage {
  content: string;
  role: 'system' | 'user' | 'assistant';
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Cost Tracking Types
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp: Date;
}

export interface CostMetrics {
  tokenUsage: TokenUsage;
  estimatedCost: number;
  costCurrency: string;
  modelPricing: {
    inputCostPer1k: number;
    outputCostPer1k: number;
  };
}

export interface TestCostData {
  testId: string;
  sessionId: string;
  costMetrics: CostMetrics;
  executionTime: number;
  success: boolean;
  optimizationScore?: number;
  costSavings?: number;
}

export interface CostOptimizationReport {
  totalTests: number;
  totalCost: number;
  averageCostPerTest: number;
  costSavings: number;
  optimizationRecommendations: string[];
  costTrend: {
    date: string;
    cost: number;
    tests: number;
  }[];
  topExpensiveTests: TestCostData[];
  costByCategory: {
    category: string;
    cost: number;
    tests: number;
  }[];
}

// File System Types
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: Date;
  type: 'file' | 'directory';
}

export interface DirectoryStructure {
  name: string;
  type: 'file' | 'directory';
  children?: DirectoryStructure[];
  size?: number;
  modified?: Date;
} 