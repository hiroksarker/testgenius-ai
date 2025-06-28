import fs from 'fs-extra';
import path from 'path';
import { TestDefinition } from '../../types';

export class TestLister {
  constructor() {}

  async list(options: { tag?: string; priority?: string } = {}): Promise<void> {
    // Use tests/ and src/tests/ directories instead of dist/tests/
    const testDirs = ['tests', 'src/tests'];
    let allTests: TestDefinition[] = [];
    
    for (const testDir of testDirs) {
      const fullPath = path.join(process.cwd(), testDir);
      
      if (await fs.pathExists(fullPath)) {
        try {
          const files = await fs.readdir(fullPath);
          
          for (const file of files) {
            if (file.endsWith('.js') || file.endsWith('.ts')) {
              try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const testModule = require(path.join(fullPath, file));
                const testDefinitions = testModule.default || testModule;
                
                if (Array.isArray(testDefinitions)) {
                  allTests = allTests.concat(testDefinitions);
                } else if (testDefinitions && typeof testDefinitions === 'object') {
                  // Handle both single test objects and modules with multiple exports
                  if (testDefinitions.id) {
                    allTests.push(testDefinitions);
                  } else {
                    allTests.push(...(Object.values(testDefinitions) as TestDefinition[]));
                  }
                }
              } catch (error) {
                console.warn(`Could not load test file ${file}:`, (error as Error).message);
              }
            }
          }
        } catch (error) {
          console.warn(`Could not read ${testDir}/ directory:`, (error as Error).message);
        }
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
      console.log(`- ${test.id}: ${test.name} [${test.priority}] (${test.tags?.join(', ') || ''})`);
    }
  }
}
