/**
 * 🧠 Smart AI Demo Test
 * Demonstrates the enhanced Smart AI Agent with intelligent tools
 */

const { TestRunner } = require('../dist/framework/core/TestRunner');
const { AITestExecutor } = require('../dist/framework/core/AITestExecutor');

// Test case with async functions (new format)
const smartAITest = {
  name: 'Smart AI Demo Test',
  description: 'Demonstrates the enhanced Smart AI Agent with intelligent tools',
  priority: 'high',
  site: 'https://the-internet.herokuapp.com/login',
  
  // Async setup function
  setup: async () => {
    console.log('🔧 Setting up Smart AI demo test...');
    return {
      testEnvironment: 'production',
      timestamp: new Date().toISOString()
    };
  },
  
  // Async data generation function
  data: async () => {
    console.log('📊 Generating test data...');
    return {
      username: 'tomsmith',
      password: 'SuperSecretPassword!',
      expectedTitle: 'The Internet'
    };
  },
  
  // Async task function
  task: async (testData, setupData) => {
    console.log('📝 Generating dynamic task...');
    return `Login to the application using username "${testData.username}" and password "${testData.password}", then verify the page title contains "${testData.expectedTitle}"`;
  }
};

// Test case with static task (backward compatibility)
const simpleSmartTest = {
  name: 'Simple Smart AI Test',
  description: 'Simple test using the new Smart AI Agent',
  priority: 'medium',
  site: 'https://the-internet.herokuapp.com/',
  task: 'Navigate to the page and verify the title contains "The Internet"'
};

async function runSmartAIDemo() {
  console.log('🚀 Starting Smart AI Demo...\n');
  
  const testRunner = new TestRunner();
  const aiExecutor = new AITestExecutor();
  
  try {
    // Auto-setup the framework
    await testRunner.autoSetup();
    
    console.log('🧠 Smart AI Agent Features:');
    console.log('   ✅ Intelligent tools with schema validation');
    console.log('   ✅ Schema validation with Zod');
    console.log('   ✅ Multiple element detection strategies');
    console.log('   ✅ Intelligent error handling');
    console.log('   ✅ Smart navigation and verification');
    console.log('   ✅ Dynamic task generation');
    console.log('   ✅ Memory persistence with thread_id');
    console.log('   ✅ Cost tracking and optimization\n');
    
    // Run the enhanced test
    console.log('🎯 Running Enhanced Smart AI Test...');
    const result1 = await testRunner.runAutoTest(smartAITest);
    console.log(`✅ Enhanced test result: ${result1.success ? 'PASSED' : 'FAILED'}\n`);
    
    // Run the simple test
    console.log('🎯 Running Simple Smart AI Test...');
    const result2 = await testRunner.runAutoTest(simpleSmartTest);
    console.log(`✅ Simple test result: ${result2.success ? 'PASSED' : 'FAILED'}\n`);
    
    // Display Smart AI Agent statistics
    const stats = aiExecutor.getSmartAgentStats();
    console.log('📊 Smart AI Agent Statistics:');
    console.log(`   🧠 Agent calls: ${stats.agentCalls}`);
    console.log(`   🛠️ Tool executions: ${stats.toolExecutions}`);
    console.log(`   ✅ Success rate: ${stats.successRate}%`);
    console.log(`   ⚡ Average response time: ${stats.avgResponseTime}ms`);
    console.log(`   💰 Estimated cost: $${stats.estimatedCost.toFixed(4)}\n`);
    
    // Display execution statistics
    const executionStats = await aiExecutor.getExecutionStats();
    console.log('📈 Execution Statistics:');
    console.log(`   🎯 Tests executed: ${executionStats.testsExecuted}`);
    console.log(`   ✅ Successful: ${executionStats.successfulTests}`);
    console.log(`   ❌ Failed: ${executionStats.failedTests}`);
    console.log(`   📊 Success rate: ${executionStats.successRate}%`);
    console.log(`   ⏱️ Total execution time: ${executionStats.totalExecutionTime}ms`);
    console.log(`   🧠 Total token usage: ${executionStats.totalTokenUsage.totalTokens}`);
    console.log(`   💰 Total estimated cost: $${executionStats.totalEstimatedCost.toFixed(4)}\n`);
    
    console.log('🎉 Smart AI Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runSmartAIDemo().catch(console.error);
}

module.exports = {
  smartAITest,
  simpleSmartTest,
  runSmartAIDemo
}; 