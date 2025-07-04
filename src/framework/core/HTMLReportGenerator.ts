import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { TestResult, TestSuiteResult, ReportData } from '../../types';

export interface HTMLReportOptions {
  outputDir?: string;
  title?: string;
  includeScreenshots?: boolean;
  includeConsoleLogs?: boolean;
  interactive?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export class HTMLReportGenerator {
  private outputDir: string;
  private options: HTMLReportOptions;

  constructor(options: HTMLReportOptions = {}) {
    this.options = {
      outputDir: 'reports/html',
      title: 'TestGenius AI Test Report',
      includeScreenshots: true,
      includeConsoleLogs: true,
      interactive: true,
      theme: 'auto',
      ...options
    };
    this.outputDir = this.options.outputDir!;
  }

  /**
   * Generate interactive HTML report
   */
  async generateReport(results: TestResult[] | TestSuiteResult): Promise<string> {
    await fs.ensureDir(this.outputDir);

    const reportData = this.prepareReportData(results);
    const htmlContent = this.generateHTML(reportData);
    const cssContent = this.generateCSS();
    const jsContent = this.generateJavaScript();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `test-report-${timestamp}.html`;
    const reportPath = path.join(this.outputDir, reportFileName);

    // Create complete HTML with embedded CSS and JS
    const fullHTML = this.createFullHTML(htmlContent, cssContent, jsContent);

    await fs.writeFile(reportPath, fullHTML);

    console.log(chalk.green(`✅ HTML report generated: ${reportPath}`));
    return reportPath;
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(results: TestResult[] | TestSuiteResult): Promise<string> {
    await fs.ensureDir(this.outputDir);

    const reportData = this.prepareReportData(results);
    const htmlContent = this.generateSummaryHTML(reportData);
    const cssContent = this.generateSummaryCSS();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFileName = `summary-report-${timestamp}.html`;
    const reportPath = path.join(this.outputDir, reportFileName);

    const fullHTML = this.createFullHTML(htmlContent, cssContent, '');

    await fs.writeFile(reportPath, fullHTML);

    console.log(chalk.green(`✅ Summary report generated: ${reportPath}`));
    return reportPath;
  }

  /**
   * Open report in browser
   */
  async openReport(reportPath?: string): Promise<void> {
    const open = require('open');
    
    if (!reportPath) {
      // Find the latest report
      const files = await fs.readdir(this.outputDir);
      const htmlFiles = files.filter(f => f.endsWith('.html')).sort().reverse();
      
      if (htmlFiles.length === 0) {
        throw new Error('No HTML reports found. Generate a report first.');
      }
      
      reportPath = path.join(this.outputDir, htmlFiles[0]);
    }

    await open(reportPath);
    console.log(chalk.blue(`🌐 Opened report: ${reportPath}`));
  }

  /**
   * Clean old reports
   */
  async cleanupReports(daysToKeep: number = 30): Promise<void> {
    const files = await fs.readdir(this.outputDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.html')) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.remove(filePath);
          deletedCount++;
        }
      }
    }

    console.log(chalk.green(`✅ Cleaned up ${deletedCount} old reports`));
  }

  /**
   * Prepare report data
   */
  private prepareReportData(results: TestResult[] | TestSuiteResult): ReportData {
    let testResults: TestResult[];
    let summary: any;

    if (Array.isArray(results)) {
      testResults = results;
      summary = this.calculateSummary(testResults);
    } else {
      testResults = results.results;
      summary = {
        total: results.totalTests,
        passed: results.passed,
        failed: results.failed,
        duration: results.totalDuration,
        successRate: results.successRate
      };
    }

    return {
      summary,
      tests: testResults,
      environment: 'Test Environment',
      timestamp: new Date(),
      version: '1.2.2'
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(results: TestResult[]): any {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;
    const duration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      total,
      passed,
      failed,
      duration,
      successRate
    };
  }

  /**
   * Generate main HTML content
   */
  private generateHTML(data: ReportData): string {
    return `
      <div class="report-container">
        <header class="report-header">
          <h1>${this.options.title}</h1>
          <div class="report-meta">
            <span class="timestamp">Generated: ${data.timestamp.toLocaleString()}</span>
            <span class="version">Version: ${data.version}</span>
            <span class="environment">Environment: ${data.environment}</span>
          </div>
        </header>

        <div class="summary-section">
          <div class="summary-grid">
            <div class="summary-card total">
              <div class="summary-number">${data.summary.total}</div>
              <div class="summary-label">Total Tests</div>
            </div>
            <div class="summary-card passed">
              <div class="summary-number">${data.summary.passed}</div>
              <div class="summary-label">Passed</div>
            </div>
            <div class="summary-card failed">
              <div class="summary-number">${data.summary.failed}</div>
              <div class="summary-label">Failed</div>
            </div>
            <div class="summary-card success-rate">
              <div class="summary-number">${data.summary.successRate.toFixed(1)}%</div>
              <div class="summary-label">Success Rate</div>
            </div>
            <div class="summary-card duration">
              <div class="summary-number">${this.formatDuration(data.summary.duration)}</div>
              <div class="summary-label">Total Duration</div>
            </div>
          </div>
        </div>

        <div class="controls-section">
          <div class="search-box">
            <input type="text" id="testSearch" placeholder="Search tests..." />
          </div>
          <div class="filter-controls">
            <select id="statusFilter">
              <option value="">All Status</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
            <select id="priorityFilter">
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div class="tests-section">
          <h2>Test Results</h2>
          <div class="tests-table-container">
            <table class="tests-table">
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Duration</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${data.tests.map(test => this.generateTestRow(test)).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="details-section" id="testDetails" style="display: none;">
          <h3>Test Details</h3>
          <div id="testDetailsContent"></div>
        </div>
      </div>
    `;
  }

  /**
   * Generate summary HTML content
   */
  private generateSummaryHTML(data: ReportData): string {
    return `
      <div class="summary-report">
        <header class="report-header">
          <h1>${this.options.title} - Summary</h1>
          <div class="report-meta">
            <span class="timestamp">Generated: ${data.timestamp.toLocaleString()}</span>
            <span class="version">Version: ${data.version}</span>
          </div>
        </header>

        <div class="summary-section">
          <div class="summary-grid">
            <div class="summary-card total">
              <div class="summary-number">${data.summary.total}</div>
              <div class="summary-label">Total Tests</div>
            </div>
            <div class="summary-card passed">
              <div class="summary-number">${data.summary.passed}</div>
              <div class="summary-label">Passed</div>
            </div>
            <div class="summary-card failed">
              <div class="summary-number">${data.summary.failed}</div>
              <div class="summary-label">Failed</div>
            </div>
            <div class="summary-card success-rate">
              <div class="summary-number">${data.summary.successRate.toFixed(1)}%</div>
              <div class="summary-label">Success Rate</div>
            </div>
            <div class="summary-card duration">
              <div class="summary-number">${this.formatDuration(data.summary.duration)}</div>
              <div class="summary-label">Total Duration</div>
            </div>
          </div>
        </div>

        <div class="quick-stats">
          <h3>Quick Statistics</h3>
          <ul>
            <li>Average test duration: ${this.formatDuration(data.summary.duration / data.summary.total)}</li>
            <li>Failed test percentage: ${((data.summary.failed / data.summary.total) * 100).toFixed(1)}%</li>
            <li>Tests per minute: ${this.calculateTestsPerMinute(data.summary.duration, data.summary.total)}</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Generate test row HTML
   */
  private generateTestRow(test: TestResult): string {
    const statusClass = test.success ? 'status-passed' : 'status-failed';
    const statusText = test.success ? 'Passed' : 'Failed';
    const duration = this.formatDuration(test.duration || 0);
    
    // Handle missing properties gracefully
    const testName = (test as any).name || test.testId || test.id;
    const testTags = (test as any).tags ? (test as any).tags.join(', ') : '';
    const testPriority = (test as any).priority || 'Medium';

    return `
      <tr class="test-row" data-test-id="${test.id}" data-status="${test.success ? 'passed' : 'failed'}">
        <td class="test-name">${testName}</td>
        <td class="test-status">
          <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td class="test-priority">${testPriority}</td>
        <td class="test-duration">${duration}</td>
        <td class="test-tags">${testTags}</td>
        <td class="test-actions">
          <button class="btn-details" onclick="showTestDetails('${test.id}')">Details</button>
          ${test.screenshots && test.screenshots.length > 0 ? 
            `<button class="btn-screenshots" onclick="showScreenshots('${test.id}')">Screenshots</button>` : 
            ''
          }
        </td>
      </tr>
    `;
  }

  /**
   * Generate CSS styles
   */
  private generateCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      }

      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background: white;
        min-height: 100vh;
      }

      .report-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #eee;
      }

      .report-header h1 {
        color: #2c3e50;
        margin-bottom: 10px;
        font-size: 2.5em;
      }

      .report-meta {
        display: flex;
        justify-content: center;
        gap: 20px;
        color: #666;
        font-size: 0.9em;
      }

      .summary-section {
        margin-bottom: 30px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .summary-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
        border-left: 4px solid #3498db;
      }

      .summary-card.passed {
        border-left-color: #27ae60;
      }

      .summary-card.failed {
        border-left-color: #e74c3c;
      }

      .summary-card.success-rate {
        border-left-color: #f39c12;
      }

      .summary-number {
        font-size: 2.5em;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 5px;
      }

      .summary-label {
        color: #666;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .controls-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        gap: 20px;
      }

      .search-box input {
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
        width: 300px;
        font-size: 14px;
      }

      .filter-controls select {
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
        margin-left: 10px;
        font-size: 14px;
      }

      .tests-section h2 {
        margin-bottom: 20px;
        color: #2c3e50;
      }

      .tests-table-container {
        overflow-x: auto;
      }

      .tests-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        border-radius: 10px;
        overflow: hidden;
      }

      .tests-table th {
        background: #34495e;
        color: white;
        padding: 15px;
        text-align: left;
        font-weight: 600;
      }

      .tests-table td {
        padding: 15px;
        border-bottom: 1px solid #eee;
      }

      .tests-table tr:hover {
        background-color: #f8f9fa;
      }

      .status-badge {
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-passed {
        background: #d4edda;
        color: #155724;
      }

      .status-failed {
        background: #f8d7da;
        color: #721c24;
      }

      .btn-details, .btn-screenshots {
        padding: 5px 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.8em;
        margin-right: 5px;
      }

      .btn-details {
        background: #3498db;
        color: white;
      }

      .btn-screenshots {
        background: #f39c12;
        color: white;
      }

      .btn-details:hover, .btn-screenshots:hover {
        opacity: 0.8;
      }

      .details-section {
        margin-top: 30px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
        border: 1px solid #dee2e6;
      }

      .test-details {
        background: white;
        padding: 20px;
        border-radius: 10px;
        margin-top: 15px;
      }

      .screenshots-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }

      .screenshot-item {
        text-align: center;
      }

      .screenshot-item img {
        max-width: 100%;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        cursor: pointer;
      }

      .screenshot-item img:hover {
        transform: scale(1.05);
        transition: transform 0.2s;
      }

      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.8);
      }

      .modal-content {
        margin: auto;
        display: block;
        max-width: 90%;
        max-height: 90%;
        margin-top: 5%;
      }

      .close {
        position: absolute;
        top: 15px;
        right: 35px;
        color: #f1f1f1;
        font-size: 40px;
        font-weight: bold;
        cursor: pointer;
      }

      @media (max-width: 768px) {
        .controls-section {
          flex-direction: column;
          align-items: stretch;
        }

        .search-box input {
          width: 100%;
        }

        .filter-controls select {
          margin-left: 0;
          margin-top: 10px;
        }

        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  /**
   * Generate summary CSS styles
   */
  private generateSummaryCSS(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
      }

      .summary-report {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background: white;
        min-height: 100vh;
      }

      .report-header {
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #eee;
      }

      .report-header h1 {
        color: #2c3e50;
        margin-bottom: 10px;
        font-size: 2.5em;
      }

      .report-meta {
        display: flex;
        justify-content: center;
        gap: 20px;
        color: #666;
        font-size: 0.9em;
      }

      .summary-section {
        margin-bottom: 30px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .summary-card {
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        text-align: center;
        border-left: 4px solid #3498db;
      }

      .summary-card.passed {
        border-left-color: #27ae60;
      }

      .summary-card.failed {
        border-left-color: #e74c3c;
      }

      .summary-card.success-rate {
        border-left-color: #f39c12;
      }

      .summary-number {
        font-size: 2.5em;
        font-weight: bold;
        color: #2c3e50;
        margin-bottom: 5px;
      }

      .summary-label {
        color: #666;
        font-size: 0.9em;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .quick-stats {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #dee2e6;
      }

      .quick-stats h3 {
        margin-bottom: 15px;
        color: #2c3e50;
      }

      .quick-stats ul {
        list-style: none;
      }

      .quick-stats li {
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }

      .quick-stats li:last-child {
        border-bottom: none;
      }
    `;
  }

  /**
   * Generate JavaScript for interactivity
   */
  private generateJavaScript(): string {
    return `
      // Search functionality
      document.getElementById('testSearch').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.test-row');
        
        rows.forEach(row => {
          const testName = row.querySelector('.test-name').textContent.toLowerCase();
          const tags = row.querySelector('.test-tags').textContent.toLowerCase();
          
          if (testName.includes(searchTerm) || tags.includes(searchTerm)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });

      // Status filter
      document.getElementById('statusFilter').addEventListener('change', function(e) {
        const status = e.target.value;
        const rows = document.querySelectorAll('.test-row');
        
        rows.forEach(row => {
          const rowStatus = row.getAttribute('data-status');
          if (!status || rowStatus === status) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });

      // Priority filter
      document.getElementById('priorityFilter').addEventListener('change', function(e) {
        const priority = e.target.value;
        const rows = document.querySelectorAll('.test-row');
        
        rows.forEach(row => {
          const rowPriority = row.querySelector('.test-priority').textContent;
          if (!priority || rowPriority === priority) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        });
      });

      // Show test details
      function showTestDetails(testId) {
        const detailsSection = document.getElementById('testDetails');
        const contentDiv = document.getElementById('testDetailsContent');
        
        // Find test data (in a real implementation, this would come from the server)
        const testRow = document.querySelector(\`[data-test-id="\${testId}"]\`);
        const testName = testRow.querySelector('.test-name').textContent;
        const testStatus = testRow.querySelector('.status-badge').textContent;
        const testDuration = testRow.querySelector('.test-duration').textContent;
        const testTags = testRow.querySelector('.test-tags').textContent;
        
        contentDiv.innerHTML = \`
          <div class="test-details">
            <h4>\${testName}</h4>
            <p><strong>Status:</strong> \${testStatus}</p>
            <p><strong>Duration:</strong> \${testDuration}</p>
            <p><strong>Tags:</strong> \${testTags}</p>
            <p><strong>Test ID:</strong> \${testId}</p>
          </div>
        \`;
        
        detailsSection.style.display = 'block';
        detailsSection.scrollIntoView({ behavior: 'smooth' });
      }

      // Show screenshots
      function showScreenshots(testId) {
        // In a real implementation, this would load screenshots from the server
        alert('Screenshots feature would show images for test: ' + testId);
      }

      // Modal functionality for screenshots
      function createModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = \`
          <span class="close">&times;</span>
          <img class="modal-content" id="modalImg">
        \`;
        document.body.appendChild(modal);
        
        modal.querySelector('.close').onclick = function() {
          modal.style.display = 'none';
        };
        
        return modal;
      }

      // Initialize modal
      const modal = createModal();
    `;
  }

  /**
   * Create full HTML document
   */
  private createFullHTML(htmlContent: string, cssContent: string, jsContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    <style>${cssContent}</style>
</head>
<body>
    ${htmlContent}
    <script>${jsContent}</script>
</body>
</html>`;
  }

  /**
   * Format duration in milliseconds to human readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Calculate tests per minute
   */
  private calculateTestsPerMinute(durationMs: number, testCount: number): string {
    if (durationMs === 0) return '0';
    const minutes = durationMs / 60000;
    return (testCount / minutes).toFixed(1);
  }
} 