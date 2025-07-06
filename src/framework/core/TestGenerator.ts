import { ChatOpenAI } from "@langchain/openai";
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { TestDefinition, TestStep } from '../../types';

export class TestGenerator {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || 'gpt-4o',
      temperature: 0.1,
      maxTokens: 4000
    });
  }

  /**
   * 🧠 Generate test scenarios from natural language description
   */
  async generateFromScenario(scenario: string, baseUrl: string = 'https://the-internet.herokuapp.com'): Promise<TestDefinition[]> {
    console.log(chalk.blue('🧠 Analyzing scenario and generating test cases...'));

    const systemPrompt = `You are an expert test automation engineer. Your task is to analyze a user scenario and generate comprehensive test cases.

Available test patterns:
- Login/Logout flows
- Form submissions
- Navigation testing
- Data validation
- Error handling
- User interactions
- Visual verification

Generate multiple test cases that cover:
1. Happy path scenarios
2. Edge cases
3. Error scenarios
4. Performance considerations

Return the tests as a JSON array of test definitions.`;

    const userPrompt = `Generate comprehensive test cases for this scenario: "${scenario}"

Base URL: ${baseUrl}

Create 3-5 different test cases that cover various aspects of this scenario. Each test should be realistic and executable.

Return as JSON array with this structure:
[
  {
    "id": "unique-test-id",
    "name": "Descriptive test name",
    "description": "Detailed description",
    "priority": "High|Medium|Low",
    "tags": ["tag1", "tag2"],
    "site": "base-url",
    "task": "Specific task description",
    "testData": {},
    "steps": [
      {
        "action": "action-type",
        "description": "step description",
        "expectedResult": "expected outcome"
      }
    ]
  }
]`;

    try {
      const response = await this.llm.invoke([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const content = response.content as string;
      let tests: TestDefinition[];

      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tests = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      } catch (parseError) {
        console.log(chalk.yellow('⚠️ Could not parse AI response, creating fallback tests'));
        tests = this.createFallbackTests(scenario, baseUrl);
      }

      // Validate and enhance tests
      tests = tests.map(test => this.validateAndEnhanceTest(test, baseUrl));

      console.log(chalk.green(`✅ Generated ${tests.length} test scenarios`));
      return tests;

    } catch (error) {
      console.log(chalk.yellow('⚠️ AI generation failed, creating fallback tests'));
      return this.createFallbackTests(scenario, baseUrl);
    }
  }

  /**
   * 💾 Save generated tests to file
   */
  async saveTests(tests: TestDefinition[], outputPath: string, format: string = 'js'): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(outputPath));

      let content: string;

      switch (format.toLowerCase()) {
        case 'json':
          content = JSON.stringify(tests, null, 2);
          break;
        case 'bdd':
          content = this.generateBDDContent(tests);
          break;
        case 'js':
        default:
          content = this.generateJSContent(tests);
          break;
      }

      await fs.writeFile(outputPath, content);
      console.log(chalk.green(`✅ Tests saved to ${outputPath}`));

    } catch (error) {
      console.error(chalk.red('❌ Failed to save tests:'), (error as Error).message);
      throw error;
    }
  }

  /**
   * 📝 Generate JavaScript test content
   */
  private generateJSContent(tests: TestDefinition[]): string {
    let content = `// Auto-generated tests by TestGenius AI
// Generated on: ${new Date().toISOString()}

module.exports = [\n`;

    tests.forEach((test, index) => {
      const taskContent = typeof test.task === 'string' ? `'${test.task}'` : 'async () => { /* Task function */ }';
      
      content += `  // Test ${index + 1}: ${test.name}
  {
    id: '${test.id}',
    name: '${test.name}',
    description: '${test.description}',
    priority: '${test.priority}',
    tags: ${JSON.stringify(test.tags)},
    site: '${test.site}',
    task: ${taskContent},
    testData: ${JSON.stringify(test.testData || {}, null, 4)},
    steps: ${JSON.stringify(test.steps || [], null, 4)}
  }${index < tests.length - 1 ? ',' : ''}\n`;
    });

    content += '];\n';
    return content;
  }

  /**
   * 📝 Generate BDD test content
   */
  private generateBDDContent(tests: TestDefinition[]): string {
    let content = `# Auto-generated BDD tests by TestGenius AI
# Generated on: ${new Date().toISOString()}\n\n`;

    tests.forEach((test, index) => {
      const taskDescription = typeof test.task === 'string' ? test.task : 'execute test scenario';
      
      content += `Feature: ${test.name}
  As a user
  I want to ${taskDescription.toLowerCase()}
  So that I can achieve my goal

  Scenario: ${test.description}
    Given I am on the "${test.site}" website\n`;

      if (test.steps) {
        test.steps.forEach(step => {
          content += `    When I ${step.description.toLowerCase()}\n`;
        });
      }

      content += `    Then I should see the expected results\n\n`;
    });

    return content;
  }

  /**
   * 🔧 Validate and enhance test definition
   */
  private validateAndEnhanceTest(test: any, baseUrl: string): TestDefinition {
    return {
      id: test.id || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: test.name || 'Generated Test',
      description: test.description || 'Auto-generated test',
      priority: test.priority || 'Medium',
      tags: Array.isArray(test.tags) ? test.tags : ['generated'],
      site: test.site || baseUrl,
      task: test.task || 'Execute test scenario',
      testData: test.testData || {},
      steps: Array.isArray(test.steps) ? test.steps : [],
      // Support new async properties
      data: test.data,
      setup: test.setup
    };
  }

  /**
   * 🛠️ Create fallback tests when AI generation fails
   */
  private createFallbackTests(scenario: string, baseUrl: string): TestDefinition[] {
    const scenarioLower = scenario.toLowerCase();
    
    const tests: TestDefinition[] = [];

    // Basic test
    tests.push({
      id: `fallback-${Date.now()}-1`,
      name: `Basic ${scenario} Test`,
      description: `Basic test for ${scenario}`,
      priority: 'Medium',
      tags: ['fallback', 'basic'],
      site: baseUrl,
      task: scenario,
      testData: {},
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to the website',
          expectedResult: 'Page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify page elements are present',
          expectedResult: 'All expected elements are visible'
        }
      ]
    });

    // If scenario mentions login, add login test
    if (scenarioLower.includes('login') || scenarioLower.includes('auth')) {
      tests.push({
        id: `fallback-${Date.now()}-2`,
        name: `Login ${scenario} Test`,
        description: `Login test for ${scenario}`,
        priority: 'High',
        tags: ['fallback', 'login'],
        site: baseUrl,
        task: `Login and ${scenario}`,
        testData: {
          username: 'tomsmith',
          password: 'SuperSecretPassword!'
        },
        steps: [
          {
            action: 'navigate',
            description: 'Navigate to login page',
            expectedResult: 'Login page loads'
          },
          {
            action: 'fill',
            description: 'Enter username',
            expectedResult: 'Username field is filled'
          },
          {
            action: 'fill',
            description: 'Enter password',
            expectedResult: 'Password field is filled'
          },
          {
            action: 'click',
            description: 'Click login button',
            expectedResult: 'User is logged in successfully'
          }
        ]
      });
    }

    return tests;
  }
} 