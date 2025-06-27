import fs from 'fs-extra';
import path from 'path';
import { TestResult } from '../../types';

export class TestSessionManager {
  private resultsDir: string;

  constructor() {
    this.resultsDir = path.join(process.cwd(), 'test-results');
  }

  async saveSession(result: TestResult): Promise<void> {
    const sessionDir = path.join(this.resultsDir, result.sessionId);
    await fs.ensureDir(sessionDir);
    const sessionFile = path.join(sessionDir, 'session.json');
    await fs.writeJson(sessionFile, result, { spaces: 2 });
  }

  async loadSession(sessionId: string): Promise<TestResult | null> {
    const sessionFile = path.join(this.resultsDir, sessionId, 'session.json');
    if (!(await fs.pathExists(sessionFile))) return null;
    return fs.readJson(sessionFile);
  }

  async listSessions(): Promise<string[]> {
    if (!(await fs.pathExists(this.resultsDir))) return [];
    return (await fs.readdir(this.resultsDir)).filter(f => !f.startsWith('.'));
  }
}
