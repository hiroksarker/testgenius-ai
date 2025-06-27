import fs from 'fs-extra';
import path from 'path';
import { TestResult } from '../../types';

export class ReportGenerator {
  private reportsDir: string;

  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
  }

  async generate({ summary }: { summary?: boolean } = {}): Promise<void> {
    await fs.ensureDir(this.reportsDir);
    const resultsDir = path.join(process.cwd(), 'test-results');
    const sessionDirs = (await fs.pathExists(resultsDir)) ? await fs.readdir(resultsDir) : [];
    const results: TestResult[] = [];
    for (const dir of sessionDirs) {
      const sessionFile = path.join(resultsDir, dir, 'session.json');
      if (await fs.pathExists(sessionFile)) {
        results.push(await fs.readJson(sessionFile));
      }
    }
    const html = this.renderHtml(results, summary);
    const fileName = `report-${Date.now()}.html`;
    const filePath = path.join(this.reportsDir, fileName);
    await fs.writeFile(filePath, html, 'utf8');
    console.log(`\n✅ Report generated: ${filePath}`);
  }

  private renderHtml(results: TestResult[], summary?: boolean): string {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const successRate = total > 0 ? (passed / total) * 100 : 0;
    return `<!DOCTYPE html><html><head><title>TestGenius Report</title></head><body>
      <h1>TestGenius Report</h1>
      <p>Total: ${total} | Passed: ${passed} | Failed: ${failed} | Success Rate: ${successRate.toFixed(1)}%</p>
      ${summary ? '' : `<ul>${results.map(r => `<li>${r.testId}: ${r.status}</li>`).join('')}</ul>`}
    </body></html>`;
  }

  async open(filename?: string): Promise<void> {
    const file = filename
      ? path.join(this.reportsDir, filename)
      : (await this.getLatestReport());
    if (!file || !(await fs.pathExists(file))) {
      console.log('No report found.');
      return;
    }
    console.log(`Report available at: ${file}`);
    console.log('Please open this file in your browser manually.');
  }

  private async getLatestReport(): Promise<string | null> {
    const files = (await fs.pathExists(this.reportsDir)) ? await fs.readdir(this.reportsDir) : [];
    const htmls = files.filter(f => f.endsWith('.html')).sort();
    return htmls.length ? path.join(this.reportsDir, htmls[htmls.length - 1]) : null;
  }
}
