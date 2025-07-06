/**
 * 🧠 Smart Agent Configuration
 * Provides intelligent configuration for the Smart AI Agent
 * Inspired by Endorphin AI's sophisticated agent configuration
 */

import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Smart AI Agent configuration settings
 */
export const SMART_AGENT_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    modelName: process.env.OPENAI_MODEL || 'gpt-4o',
  },

  // Agent behavior settings
  agent: {
    recursionLimit: 150,
    timeout: 5 * 60 * 1000, // 5 minutes

    // Stop phrases that indicate test completion
    stopPhrases: [
      'test completed successfully',
      'verification complete',
      'test finished successfully',
      'all steps completed',
      'task finished',
      'stop',
      'stop - test completed',
      'test passed',
      'test failed',
      'execution complete',
      'task accomplished',
      'goal achieved',
      'mission accomplished',
      'test execution finished',
      'verification passed',
      'verification failed',
      'test result confirmed',
      'test outcome determined',
      'test execution ended',
      'task execution complete',
    ] as string[],
  },

  // Test execution settings
  execution: {
    stepDelay: 2000, // 2 seconds between test steps
    maxRetries: 3,
    retryDelay: 1000,
  },

  // Memory and context settings
  memory: {
    maxHistoryLength: 50,
    contextWindowSize: 10,
    similarityThreshold: 0.9,
  },

  // Tool selection settings
  tools: {
    maxConsecutiveToolCalls: 4,
    toolSelectionTimeout: 30000, // 30 seconds
    enableToolReasoning: true,
  },

  // Cost tracking settings
  costTracking: {
    enabled: true,
    alertThreshold: 0.10, // $0.10
    maxCostPerTest: 1.00, // $1.00
    costModel: 'gpt-4o', // Default cost model
  },

  // Performance settings
  performance: {
    enableFastMode: true,
    parallelToolExecution: false,
    adaptiveTimeout: true,
    intelligentRetry: true,
  },

  // Debug and logging settings
  debug: {
    enableVerboseLogging: process.env.NODE_ENV === 'development',
    logAgentDecisions: true,
    logToolSelections: true,
    logMemoryOperations: false,
    logCostTracking: true,
  },
} as const;

export default SMART_AGENT_CONFIG; 