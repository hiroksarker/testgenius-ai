// TestGenius AI - Simple Navigation Test
// Basic test to verify navigation works

module.exports = {
  id: "simple-test",
  name: "Simple Navigation Test",
  description: "Basic test to verify navigation works",
  priority: "Low",
  tags: ["simple", "navigation"],
  site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
  testData: {
    targetUrl: "https://the-internet.herokuapp.com",
    expectedText: "The Internet",
    steps: [
      {
        action: 'navigate',
        description: 'Navigate to the main page',
        target: 'https://the-internet.herokuapp.com',
        value: 'https://the-internet.herokuapp.com',
        expectedResult: 'Main page loads successfully'
      },
      {
        action: 'verify',
        description: 'Verify page title is present',
        target: 'The Internet',
        value: 'The Internet',
        expectedResult: 'Page title is displayed'
      },
      {
        action: 'verify',
        description: 'Verify page has content',
        target: 'div',
        expectedResult: 'Page content is loaded'
      }
    ]
  },
  task: "Navigate to the website and verify page loads"
}; 