import fs from 'fs-extra';
import path from 'path';
import { TestDefinition } from '../../types';

export class TestLister {
  constructor() {}

  async list(options: { tag?: string; priority?: string } = {}): Promise<void> {
    const testsDir = path.join(process.cwd(), 'src', 'tests');
    if (!(await fs.pathExists(testsDir))) {
      console.log('No tests directory found.');
      return;
    }
    const files = await fs.readdir(testsDir);
    let allTests: TestDefinition[] = [];
    for (const file of files) {
      if (file.endsWith('.ts')) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const testModule = require(path.join(testsDir, file));
        allTests.push(...(Object.values(testModule) as TestDefinition[]));
      }
    }
    if (options.tag) {
      allTests = allTests.filter(t => t.tags && t.tags.includes(options.tag!));
    }
    if (options.priority) {
      allTests = allTests.filter(t => t.priority === options.priority);
    }
    if (allTests.length === 0) {
      console.log('No tests found.');
      return;
    }
    for (const test of allTests) {
      console.log(`- ${test.id}: ${test.name} [${test.priority}] (${test.tags.join(', ')})`);
    }
  }
}
