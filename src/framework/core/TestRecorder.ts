import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { TestDefinition } from '../../types';

interface TestStep {
  action: string;
  description: string;
  target?: string;
  value?: string;
  timestamp: Date;
}

interface BDDStep {
  keyword: 'Given' | 'When' | 'Then' | 'And' | 'But';
  description: string;
  action: string;
  target?: string;
  value?: string;
}

export class TestRecorder {
  private testSteps: TestStep[] = [];
  private testInfo: Partial<TestDefinition> = {};
  private bddMode: boolean = false;
  private bddInputMethod: string = 'auto-detect';
  private currentScenario: string = '';

  constructor() {}

  async start(): Promise<void> {
    console.log(chalk.cyan('\n🎬 Interactive Test Recorder - Enhanced Mode\n'));
    console.log(chalk.yellow('Commands:'));
    console.log('  • done/stop - Finish recording and save test');
    console.log('  • back - Remove last step');
    console.log('  • list - Show all recorded steps');
    console.log('  • bdd - Show BDD format preview');
    console.log('  • clear - Clear all steps');
    console.log('  • help - Show this help\n');

    // Get basic test information first
    await this.getTestInfo();
    
    // Ask for BDD mode preference
    await this.setupBDDMode();
    
    // Start continuous recording
    await this.recordSteps();
  }

  private async getTestInfo(): Promise<void> {
    console.log(chalk.blue('📋 Test Information Setup\n'));
    
    const answers = await inquirer.prompt([
      { 
        name: 'id', 
        message: 'Test ID:', 
        validate: (v: string) => !!v ? true : 'Test ID is required',
        default: `test-${Date.now()}`
      },
      { 
        name: 'name', 
        message: 'Test Name:', 
        validate: (v: string) => !!v ? true : 'Test name is required',
        default: 'Recorded Test'
      },
      { 
        name: 'description', 
        message: 'Description:', 
        validate: (v: string) => !!v ? true : 'Description is required',
        default: 'Test recorded using interactive recorder'
      },
      { 
        name: 'priority', 
        message: 'Priority (High/Medium/Low):', 
        type: 'list',
        choices: ['High', 'Medium', 'Low'],
        default: 'Medium' 
      },
      { 
        name: 'tags', 
        message: 'Tags (comma separated):', 
        filter: (v: string) => v.split(',').map(t => t.trim()).filter(t => t.length > 0),
        default: 'recorded'
      },
      { 
        name: 'site', 
        message: 'Target site URL:', 
        validate: (v: string) => !!v ? true : 'Site URL is required',
        default: 'https://example.com'
      }
    ]);

    this.testInfo = {
      ...answers,
      priority: answers.priority || 'Medium',
      tags: answers.tags || ['recorded'],
      testData: {},
    };

    console.log(chalk.green('\n✅ Test information saved!\n'));
  }

  private async setupBDDMode(): Promise<void> {
    const { bddMode } = await inquirer.prompt([
      {
        name: 'bddMode',
        message: 'Enable BDD mode?',
        type: 'confirm',
        default: true
      }
    ]);

    this.bddMode = bddMode;
    
    if (bddMode) {
      console.log(chalk.green('🎯 BDD mode enabled! You will enter plain steps, then can provide a full BDD scenario at the end.\n'));
      this.bddInputMethod = 'plain-then-scenario';
    } else {
      console.log(chalk.blue('🤖 Regular mode: AI will auto-assign keywords and structure.\n'));
      this.bddInputMethod = 'ai-auto';
    }
  }

  private async recordSteps(): Promise<void> {
    while (true) {
      // Show current step count and BDD preview if enabled
      this.showCurrentStatus();
      
      console.log(chalk.cyan(`\n📝 Step ${this.testSteps.length + 1} - What would you like to do?`));
      
      const { action } = await inquirer.prompt([
        {
          name: 'action',
          message: 'Action:',
          type: 'list',
          choices: [
            { name: '🔍 Navigate to page', value: 'navigate' },
            { name: '👆 Click element', value: 'click' },
            { name: '✏️  Fill input field', value: 'fill' },
            { name: '⌨️  Type text', value: 'type' },
            { name: '🧹 Clear field', value: 'clear_field' },
            { name: '⏳ Smart Wait (with expected data)', value: 'smart-wait' },
            { name: '✅ Verify/Assert', value: 'verify' },
            { name: '❌ Verify field error', value: 'verify_field_error' },
            { name: '📸 Take screenshot', value: 'screenshot' },
            { name: '⏸️  Wait (seconds)', value: 'wait-time' },
            { name: '📋 Show recorded steps', value: 'list' },
            { name: '🎯 Show BDD preview', value: 'bdd' },
            { name: '↩️  Remove last step', value: 'back' },
            { name: '🗑️  Clear all steps', value: 'clear' },
            { name: '❓ Help', value: 'help' },
            { name: '✅ Done - Save test', value: 'done' },
            { name: '🛑 Stop - Cancel', value: 'stop' }
          ]
        }
      ]);

      switch (action) {
        case 'done':
        case 'stop':
          return await this.finishRecording(action === 'done');
        case 'list':
          this.showSteps();
          break;
        case 'bdd':
          this.showBDDPreview();
          break;
        case 'back':
          this.removeLastStep();
          break;
        case 'clear':
          this.clearSteps();
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          await this.recordStep(action);
          break;
      }
    }
  }

  private showCurrentStatus(): void {
    if (this.testSteps.length > 0) {
      console.log(chalk.blue(`\n📊 Current Status: ${this.testSteps.length} steps recorded`));
      
      if (this.bddMode) {
        console.log(chalk.green('🎯 BDD Mode: Active'));
        // Show last 3 steps in BDD format
        const recentSteps = this.testSteps.slice(-3);
        if (recentSteps.length > 0) {
          console.log(chalk.yellow('\n📝 Recent Steps (BDD Preview):'));
          recentSteps.forEach((step, index) => {
            const bddStep = this.convertToBDD(step, index === 0);
            console.log(chalk.cyan(`  ${bddStep.keyword} ${bddStep.description}`));
          });
        }
      }
    }
  }

  private convertToBDD(step: TestStep, isFirst: boolean): BDDStep {
    let keyword: 'Given' | 'When' | 'Then' | 'And' | 'But' = 'And';
    
    // Check if user has selected a custom BDD keyword
    if ((step as any).bddKeyword) {
      keyword = (step as any).bddKeyword;
    } else if (isFirst) {
      keyword = 'Given';
    } else if (step.action === 'navigate') {
      keyword = 'Given';
    } else if (step.action === 'click' || step.action === 'fill' || step.action === 'type') {
      keyword = 'When';
    } else if (step.action === 'verify' || step.action === 'verify_field_error') {
      keyword = 'Then';
    }

    return {
      keyword,
      description: step.description,
      action: step.action,
      target: step.target,
      value: step.value
    };
  }

  private async recordStep(actionType: string): Promise<void> {
    let step: TestStep;

    switch (actionType) {
      case 'navigate':
        const { url } = await inquirer.prompt([
          { name: 'url', message: 'Navigate to URL:', validate: (v: string) => !!v ? true : 'URL is required' }
        ]);
        step = {
          action: 'navigate',
          description: `Navigate to ${url}`,
          target: url,
          timestamp: new Date()
        };
        break;

      case 'click':
        const { clickTarget } = await inquirer.prompt([
          { name: 'clickTarget', message: 'Click on (element description):', validate: (v: string) => !!v ? true : 'Target is required' }
        ]);
        step = {
          action: 'click',
          description: `Click on ${clickTarget}`,
          target: clickTarget,
          timestamp: new Date()
        };
        break;

      case 'fill':
        const { fillTarget, fillValue } = await inquirer.prompt([
          { name: 'fillTarget', message: 'Fill field (element description):', validate: (v: string) => !!v ? true : 'Target is required' },
          { name: 'fillValue', message: 'Value to fill:', validate: (v: string) => !!v ? true : 'Value is required' }
        ]);
        step = {
          action: 'fill',
          description: `Fill ${fillTarget} with ${fillValue}`,
          target: fillTarget,
          value: fillValue,
          timestamp: new Date()
        };
        break;

      case 'type':
        const { typeTarget, typeValue } = await inquirer.prompt([
          { name: 'typeTarget', message: 'Type in (element description):', validate: (v: string) => !!v ? true : 'Target is required' },
          { name: 'typeValue', message: 'Text to type:', validate: (v: string) => !!v ? true : 'Text is required' }
        ]);
        step = {
          action: 'type',
          description: `Type "${typeValue}" in ${typeTarget}`,
          target: typeTarget,
          value: typeValue,
          timestamp: new Date()
        };
        break;

      case 'clear_field':
        const { clearTarget } = await inquirer.prompt([
          { name: 'clearTarget', message: 'Clear field (element description):', validate: (v: string) => !!v ? true : 'Target is required' }
        ]);
        step = {
          action: 'clear_field',
          description: `Clear ${clearTarget} field`,
          target: clearTarget,
          timestamp: new Date()
        };
        break;

      case 'smart-wait':
        const { waitTarget, expectedData, maxTimeout } = await inquirer.prompt([
          { name: 'waitTarget', message: 'Wait for (element description):', validate: (v: string) => !!v ? true : 'Target is required' },
          { name: 'expectedData', message: 'Expected data/text to appear (optional):', default: '' },
          { name: 'maxTimeout', message: 'Maximum wait time (seconds):', type: 'number', default: 30, validate: (v: number) => v > 0 ? true : 'Must be positive number' }
        ]);
        
        const waitDescription = expectedData 
          ? `Wait for ${waitTarget} to appear with "${expectedData}" (max ${maxTimeout}s)`
          : `Wait for ${waitTarget} to appear (max ${maxTimeout}s)`;
          
        step = {
          action: 'smart-wait',
          description: waitDescription,
          target: waitTarget,
          value: expectedData || undefined,
          timestamp: new Date()
        };
        break;

      case 'verify':
        const { verifyTarget, verifyValue } = await inquirer.prompt([
          { name: 'verifyTarget', message: 'Verify (element description):', validate: (v: string) => !!v ? true : 'Target is required' },
          { name: 'verifyValue', message: 'Expected value (optional):' }
        ]);
        step = {
          action: 'verify',
          description: `Verify ${verifyTarget}${verifyValue ? ` contains "${verifyValue}"` : ''}`,
          target: verifyTarget,
          value: verifyValue,
          timestamp: new Date()
        };
        break;

      case 'verify_field_error':
        const { errorTarget } = await inquirer.prompt([
          { name: 'errorTarget', message: 'Verify field error (element description):', validate: (v: string) => !!v ? true : 'Target is required' }
        ]);
        step = {
          action: 'verify_field_error',
          description: `Verify ${errorTarget} has error`,
          target: errorTarget,
          timestamp: new Date()
        };
        break;

      case 'screenshot':
        const { screenshotName } = await inquirer.prompt([
          { name: 'screenshotName', message: 'Screenshot name (optional):', default: 'screenshot' }
        ]);
        step = {
          action: 'screenshot',
          description: `Take screenshot: ${screenshotName}`,
          target: screenshotName,
          timestamp: new Date()
        };
        break;

      case 'wait-time':
        const { waitSeconds } = await inquirer.prompt([
          { name: 'waitSeconds', message: 'Wait for (seconds):', type: 'number', validate: (v: number) => v > 0 ? true : 'Must be positive number' }
        ]);
        step = {
          action: 'wait-time',
          description: `Wait for ${waitSeconds} seconds`,
          target: waitSeconds.toString(),
          timestamp: new Date()
        };
        break;

      default:
        console.log(chalk.red('❌ Unknown action type'));
        return;
    }

    this.testSteps.push(step);
    console.log(chalk.green(`✅ Step ${this.testSteps.length} recorded: ${step.description}`));
    
    // Show BDD preview if enabled
    if (this.bddMode) {
      // No keyword selection, just show as plain
      const bddStep = this.convertToBDD(step, this.testSteps.length === 1);
      console.log(chalk.cyan(`🎯 Step: ${bddStep.description}`));
    }
  }

  private showSteps(): void {
    if (this.testSteps.length === 0) {
      console.log(chalk.yellow('\n📋 No steps recorded yet.\n'));
      return;
    }

    console.log(chalk.blue('\n📋 Recorded Steps:\n'));
    this.testSteps.forEach((step, index) => {
      console.log(chalk.cyan(`${index + 1}. ${step.description}`));
    });
    console.log('');
  }

  private showBDDPreview(): void {
    if (this.testSteps.length === 0) {
      console.log(chalk.yellow('\n📋 No steps recorded yet.\n'));
      return;
    }

    console.log(chalk.blue('\n🎯 BDD Format Preview:\n'));
    console.log(chalk.green('Feature: ' + (this.testInfo.name || 'Recorded Test')));
    console.log(chalk.gray('  ' + (this.testInfo.description || 'Test recorded using interactive recorder')));
    console.log('');
    
    console.log(chalk.yellow('  Scenario: ' + (this.testInfo.name || 'Recorded Scenario')));
    
    this.testSteps.forEach((step, index) => {
      const bddStep = this.convertToBDD(step, index === 0);
      console.log(chalk.cyan(`    ${bddStep.keyword} ${bddStep.description}`));
    });
    console.log('');
  }

  private removeLastStep(): void {
    if (this.testSteps.length === 0) {
      console.log(chalk.yellow('\n📋 No steps to remove.\n'));
      return;
    }

    const removedStep = this.testSteps.pop();
    console.log(chalk.yellow(`\n↩️  Removed step: ${removedStep?.description}\n`));
  }

  private clearSteps(): void {
    this.testSteps = [];
    console.log(chalk.yellow('\n🗑️  All steps cleared.\n'));
  }

  private showHelp(): void {
    console.log(chalk.cyan('\n❓ Help - Available Commands:\n'));
    console.log('  • done/stop - Finish recording and save test');
    console.log('  • back - Remove last step');
    console.log('  • list - Show all recorded steps');
    console.log('  • bdd - Show BDD format preview');
    console.log('  • clear - Clear all steps');
    console.log('  • help - Show this help\n');
    
    if (this.bddMode) {
      console.log(chalk.green('🎯 BDD Mode Features:\n'));
      console.log('  • Real-time BDD step preview');
      console.log('  • Automatic keyword assignment (Given/When/Then)');
      console.log('  • BDD format export capability\n');
    }
  }

  private async finishRecording(save: boolean): Promise<void> {
    if (!save) {
      console.log(chalk.yellow('\n🛑 Recording cancelled.\n'));
      return;
    }

    if (this.testSteps.length === 0) {
      console.log(chalk.red('\n❌ No steps recorded. Cannot save empty test.\n'));
      return;
    }

    // If BDD mode, ask if user wants to provide a full BDD scenario
    if (this.bddMode && this.bddInputMethod === 'plain-then-scenario') {
      const { provideBDD } = await inquirer.prompt([
        {
          name: 'provideBDD',
          message: 'Do you want to provide a full BDD scenario (Given/When/Then format) for these steps?',
          type: 'confirm',
          default: false
        }
      ]);
      if (provideBDD) {
        await this.handleBDDFormatInput();
      }
    }

    // Show final BDD preview
    if (this.bddMode) {
      this.showBDDPreview();
    }

    // Create task description from steps
    const taskDescription = this.testSteps.map(step => step.description).join(', then ');

    const test: TestDefinition = {
      ...this.testInfo,
      task: taskDescription,
      testData: {
        steps: this.testSteps
      }
    } as TestDefinition;

    const fileName = `${this.testInfo.id?.replace(/[^a-zA-Z0-9_-]/g, '_')}.ts`;
    const filePath = path.join(process.cwd(), 'src', 'tests', fileName);
    const fileContent = `// Auto-generated by TestRecorder\nexport const ${this.testInfo.id?.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()} = ${JSON.stringify(test, null, 2)};\n`;
    
    await fs.writeFile(filePath, fileContent, 'utf8');
    
    console.log(chalk.green('\n✅ Test saved successfully!'));
    console.log(chalk.blue(`📁 File: src/tests/${fileName}`));
    console.log(chalk.blue(`📝 Steps recorded: ${this.testSteps.length}`));
    console.log(chalk.blue(`🎯 Task: ${taskDescription}`));
    
    if (this.bddMode) {
      console.log(chalk.green(`🎯 BDD Mode: Enabled - Test ready for BDD execution`));
    }
    
    console.log('');
  }

  private async handleBDDFormatInput(): Promise<void> {
    console.log(chalk.blue('\n📋 BDD Format Input\n'));
    console.log(chalk.yellow('Please provide your BDD scenario. You can use:'));
    console.log(chalk.cyan('  • Given - for preconditions'));
    console.log(chalk.cyan('  • When - for actions'));
    console.log(chalk.cyan('  • Then - for verifications'));
    console.log(chalk.cyan('  • And/But - for additional steps\n'));

    const { bddScenario } = await inquirer.prompt([
      {
        name: 'bddScenario',
        message: 'Enter your BDD scenario (one step per line, starting with Given/When/Then):',
        type: 'editor',
        default: this.generateDefaultBDDScenario()
      }
    ]);

    // Parse BDD scenario and update steps
    this.parseBDDScenario(bddScenario);
    console.log(chalk.green('✅ BDD scenario applied to recorded steps!\n'));
  }

  private generateDefaultBDDScenario(): string {
    let scenario = 'Feature: ' + (this.testInfo.name || 'Recorded Test') + '\n';
    scenario += '  ' + (this.testInfo.description || 'Test recorded using interactive recorder') + '\n\n';
    scenario += '  Scenario: ' + (this.testInfo.name || 'Recorded Scenario') + '\n';
    
    this.testSteps.forEach((step, index) => {
      const bddStep = this.convertToBDD(step, index === 0);
      scenario += `    ${bddStep.keyword} ${step.description}\n`;
    });
    
    return scenario;
  }

  private parseBDDScenario(bddScenario: string): void {
    const lines = bddScenario.split('\n');
    const bddSteps: string[] = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('Given ') || trimmedLine.startsWith('When ') || 
          trimmedLine.startsWith('Then ') || trimmedLine.startsWith('And ') || 
          trimmedLine.startsWith('But ')) {
        bddSteps.push(trimmedLine);
      }
    }
    
    // Apply BDD keywords to recorded steps
    for (let i = 0; i < Math.min(bddSteps.length, this.testSteps.length); i++) {
      const bddStep = bddSteps[i];
      const keyword = bddStep.split(' ')[0] as 'Given' | 'When' | 'Then' | 'And' | 'But';
      (this.testSteps[i] as any).bddKeyword = keyword;
    }
  }
} 