# 💰 Cost Tracking & Optimization Guide

## Overview

TestGenius AI now includes comprehensive cost tracking and optimization features to help you monitor and reduce your AI testing costs. This guide covers how to enable, configure, and use these features effectively.

## 🚀 Quick Start

### 1. Enable Cost Tracking

```bash
# Enable cost tracking
testgenius cost --enable

# Set daily budget limit
testgenius cost --budget 10.0

# Set monthly budget limit
testgenius cost --monthly-budget 100.0
```

### 2. Run Tests with Cost Tracking

```bash
# Run tests with cost tracking enabled
testgenius run --allure

# View cost analysis
testgenius report --cost

# View optimization recommendations
testgenius report --optimization
```

## 📊 Cost Tracking Features

### Token Usage Monitoring

- **Real-time tracking** of OpenAI API token consumption
- **Cost calculation** based on current model pricing
- **Per-test breakdown** of prompt vs completion tokens
- **Historical cost data** for trend analysis

### Budget Management

- **Daily budget limits** with automatic alerts
- **Monthly budget tracking** for long-term planning
- **Budget alerts** when limits are exceeded
- **Cost forecasting** based on usage patterns

### Cost Optimization

- **Model comparison** to suggest cheaper alternatives
- **Failed test cost analysis** to identify waste
- **Token usage optimization** recommendations
- **Cost savings calculations** for different strategies

## ⚙️ Configuration

### Basic Configuration

```javascript
// testgenius.config.js
module.exports = {
  // ... other config
  costTracking: {
    enabled: true,
    currency: 'USD',
    modelPricing: {
      'gpt-4o': { inputCostPer1k: 0.005, outputCostPer1k: 0.015 },
      'gpt-4': { inputCostPer1k: 0.03, outputCostPer1k: 0.06 },
      'gpt-3.5-turbo': { inputCostPer1k: 0.0015, outputCostPer1k: 0.002 }
    },
    budgetAlerts: {
      enabled: true,
      dailyLimit: 10.0,
      monthlyLimit: 100.0
    },
    optimization: {
      enabled: true,
      suggestAlternativeModels: true,
      trackCostSavings: true
    }
  }
};
```

### Model Pricing

The framework includes current OpenAI pricing (as of 2024):

| Model | Input (per 1K tokens) | Output (per 1K tokens) |
|-------|----------------------|----------------------|
| GPT-4o | $0.005 | $0.015 |
| GPT-4 | $0.03 | $0.06 |
| GPT-3.5-turbo | $0.0015 | $0.002 |

## 📈 Allure Report Integration

### Cost Widgets

When cost tracking is enabled, Allure reports include custom widgets:

1. **Cost Summary Widget**
   - Total tests and costs
   - Average cost per test
   - Potential savings

2. **Cost Trend Widget**
   - Daily cost trends
   - Usage patterns over time

3. **Optimization Recommendations Widget**
   - Specific cost-saving suggestions
   - Model switching recommendations

4. **Expensive Tests Widget**
   - Top 10 most expensive tests
   - Cost breakdown by model

### Test-Level Cost Data

Each test in Allure reports includes:

- **Cost labels** showing test cost and model used
- **Token usage** breakdown in test description
- **Cost comparison** with other tests

## 📊 Advanced Graph Visualizations

TestGenius AI now includes comprehensive graph features in Allure reports for detailed cost analysis:

### 📈 Line Charts

1. **Cost Trend Analysis**
   - Daily cost progression over time
   - Visual identification of cost spikes
   - Trend analysis for budget planning

2. **Cost vs Tests Correlation**
   - Relationship between number of tests and total cost
   - Efficiency analysis for test batching
   - Optimal test count identification

3. **Monthly Cost Projection**
   - Future cost predictions based on current trends
   - 30-day cost forecasting
   - Budget planning assistance

### 📊 Bar Charts

1. **Cost Trend Distribution**
   - Daily cost bars for easy comparison
   - Peak usage day identification
   - Cost pattern analysis

2. **Cost by Category (Model)**
   - Model-wise cost comparison
   - Visual model efficiency analysis
   - Cost optimization opportunities

3. **Tests by Category**
   - Number of tests per AI model
   - Usage distribution analysis
   - Model preference insights

4. **Most Expensive Tests**
   - Top 10 costliest tests visualization
   - Cost ranking for optimization focus
   - Performance vs cost correlation

5. **Cost Savings Potential**
   - Current cost vs potential savings
   - Optimization impact visualization
   - ROI analysis for cost reduction

### 📋 Pie Charts

1. **Cost by Category Distribution**
   - Percentage breakdown by AI model
   - Visual cost allocation analysis
   - Model usage optimization insights

2. **Success vs Failure Cost**
   - Cost distribution by test status
   - Failed test cost waste analysis
   - Success rate impact on costs

3. **Token Usage Distribution**
   - Prompt vs completion token breakdown
   - Token efficiency analysis
   - Optimization opportunities

### ⚡ Area Charts

1. **Cost Efficiency Over Time**
   - Cost per test trends
   - Efficiency improvement tracking
   - Performance optimization monitoring

### 📋 Data Tables & Text Widgets

1. **Cost Analysis Dashboard**
   - Executive summary with key metrics
   - Real-time cost status
   - Optimization recommendations

2. **Most Expensive Tests Table**
   - Detailed test cost breakdown
   - Model, tokens, status, and duration
   - Actionable optimization data

3. **Cost Efficiency Analysis**
   - Performance metrics and scores
   - Success rate correlation
   - Optimization status indicators

### 🎨 Graph Features

#### Interactive Elements
- **Hover Details**: Detailed information on hover
- **Zoom Capabilities**: Zoom in/out for detailed analysis
- **Filter Options**: Filter by date range, model, or test status
- **Export Functionality**: Export graphs as images or data

#### Color Coding
- **Success/Failure**: Green for successful tests, red for failures
- **Cost Levels**: Color gradients for cost ranges
- **Model Types**: Distinct colors for different AI models
- **Trend Indicators**: Arrows and colors for trend direction

#### Responsive Design
- **Mobile Friendly**: Graphs adapt to different screen sizes
- **Print Optimized**: Clean printing of cost reports
- **Accessibility**: High contrast and screen reader support

### 📊 Graph Configuration

You can customize graph appearance in your configuration:

```javascript
// testgenius.config.js
module.exports = {
  costTracking: {
    graphs: {
      enabled: true,
      theme: 'light', // 'light' or 'dark'
      colors: {
        success: '#28a745',
        failure: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      },
      chartTypes: {
        lineCharts: true,
        barCharts: true,
        pieCharts: true,
        areaCharts: true
      },
      exportFormats: ['png', 'svg', 'csv']
    }
  }
};
```

### 🔍 Graph Analysis Tips

1. **Cost Trend Analysis**
   - Look for patterns in daily costs
   - Identify peak usage days
   - Plan testing schedules accordingly

2. **Model Efficiency**
   - Compare cost per test across models
   - Identify overpriced model usage
   - Optimize model selection

3. **Test Performance**
   - Correlate test success with cost
   - Identify expensive failed tests
   - Focus optimization efforts

4. **Budget Planning**
   - Use projections for budget planning
   - Set realistic cost expectations
   - Monitor against budget limits

## 🛠️ CLI Commands

### Cost Management Commands

```bash
# Enable/disable cost tracking
testgenius cost --enable
testgenius cost --disable

# Set budget limits
testgenius cost --budget 5.0
testgenius cost --monthly-budget 50.0

# Analyze costs
testgenius cost --analyze

# Get optimization recommendations
testgenius cost --optimize
```

### Report Commands

```bash
# Generate cost analysis report
testgenius report --cost

# Generate optimization recommendations
testgenius report --optimization

# Generate Allure report with cost widgets
testgenius run --allure
testgenius report --allure
```

## 💡 Cost Optimization Strategies

### 1. Model Selection

**Use GPT-3.5-turbo for simple tests:**
- 10x cheaper than GPT-4o
- Sufficient for basic element interactions
- Good for regression testing

**Use GPT-4o for complex scenarios:**
- Better understanding of complex UI
- More reliable for dynamic content
- Worth the cost for critical tests

### 2. Test Description Optimization

**Good (Low token usage):**
```
"Login with valid credentials and verify dashboard access"
```

**Avoid (High token usage):**
```
"Navigate to the login page, locate the username field which is typically positioned in the top-left area of the form, enter the provided username credentials, then find the password field which is usually located directly below the username field, enter the password, and finally click the submit button to authenticate the user and verify successful navigation to the dashboard"
```

### 3. Batch Testing

- Run related tests together to reduce setup costs
- Use test suites to minimize navigation overhead
- Group tests by functionality

### 4. Failed Test Analysis

- Monitor failed test costs
- Fix flaky tests to avoid re-runs
- Use retry limits to prevent infinite loops

## 📊 Cost Analysis Examples

### Sample Cost Report

```
💰 Cost Analysis Report
==================================================
Total Tests: 25
Total Cost: $0.1250
Average Cost per Test: $0.0050
Potential Savings: $0.0450

🏆 Top 5 Most Expensive Tests:
1. COMPLEX-UI-001: $0.0150 (gpt-4o)
2. LOGIN-002: $0.0120 (gpt-4o)
3. SEARCH-001: $0.0100 (gpt-4o)
4. FORM-003: $0.0080 (gpt-4o)
5. NAV-001: $0.0070 (gpt-4o)
```

### Sample Optimization Report

```
🚀 Cost Optimization Recommendations
==================================================
1. Consider using gpt-3.5-turbo for 15 expensive tests to save ~$0.0450
2. Failed tests cost $0.0250 - improve test stability to reduce costs
3. Consider optimizing test descriptions to reduce token usage
```

## 🔧 Advanced Configuration

### Custom Model Pricing

```javascript
costTracking: {
  modelPricing: {
    'gpt-4o': { inputCostPer1k: 0.005, outputCostPer1k: 0.015 },
    'gpt-4': { inputCostPer1k: 0.03, outputCostPer1k: 0.06 },
    'gpt-3.5-turbo': { inputCostPer1k: 0.0015, outputCostPer1k: 0.002 },
    'custom-model': { inputCostPer1k: 0.01, outputCostPer1k: 0.02 }
  }
}
```

### Budget Alerts

```javascript
budgetAlerts: {
  enabled: true,
  dailyLimit: 5.0,      // $5 per day
  monthlyLimit: 50.0,   // $50 per month
  alertEmail: 'team@company.com'  // Optional email alerts
}
```

### Optimization Settings

```javascript
optimization: {
  enabled: true,
  suggestAlternativeModels: true,
  trackCostSavings: true,
  autoSwitchToCheaperModel: false,  // Don't auto-switch
  minSavingsThreshold: 0.01         // Only suggest if savings > $0.01
}
```

## 📈 Monitoring & Alerts

### Budget Monitoring

The framework automatically monitors your spending:

```bash
# Check current day's spending
testgenius cost --analyze

# Set up alerts for budget limits
testgenius cost --budget 10.0
```

### Cost Trends

Track your spending over time:

```bash
# View cost history
cat cost-history.json

# Analyze trends
testgenius report --cost
```

## 🎯 Best Practices

### 1. Start Small

- Enable cost tracking first
- Monitor for a week to understand patterns
- Set conservative budget limits initially

### 2. Optimize Gradually

- Identify your most expensive tests
- Start with model switching for simple tests
- Optimize test descriptions over time

### 3. Monitor Regularly

- Check cost reports weekly
- Review failed test costs
- Adjust budget limits based on usage

### 4. Team Training

- Educate team on cost implications
- Share optimization recommendations
- Establish cost-aware testing practices

## 🚨 Troubleshooting

### Common Issues

**Cost tracking not working:**
```bash
# Check if enabled
testgenius cost --analyze

# Re-enable if needed
testgenius cost --enable
```

**Incorrect pricing:**
- Update model pricing in config
- Check OpenAI's current rates
- Verify currency settings

**Budget alerts not working:**
- Ensure budget alerts are enabled
- Check budget limit values
- Verify configuration is saved

### Data Files

Cost tracking creates these files:

- `cost-data.json` - Individual test cost data
- `cost-history.json` - Daily cost trends
- `allure-results/widgets/` - Allure cost widgets

## 📞 Support

For questions about cost tracking:

- 📧 Email: hirok.sarker@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/hiroksarker/testgenius-ai/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/hiroksarker/testgenius-ai/discussions)

---

**Happy Cost-Optimized Testing! 🚀💰** 