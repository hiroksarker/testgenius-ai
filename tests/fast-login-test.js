/**
 * 🚀 FAST LOGIN TEST - Demonstrates Smart Element Detection
 * 
 * This test shows how the new SmartElementDetector works:
 * - No AI dependency for element detection
 * - Multiple detection strategies (accessibility, text, data attributes)
 * - Intelligent caching for faster subsequent runs
 * - WebdriverIO best practices for selectors
 */

module.exports = {
  id: 'fast-login-test',
  name: 'Fast Login Test',
  description: 'Test login functionality using smart element detection',
  priority: 'High',
  tags: ['login', 'fast', 'smart-detection'],
  site: process.env.STAGING_BASE_URL || 'https://the-internet.herokuapp.com',
  task: 'Login to the secure area using smart element detection',
  testData: {
    targetUrl: 'https://the-internet.herokuapp.com/login',
    username: 'tomsmith',
    password: 'SuperSecretPassword!',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: 'button[type="submit"]',
    expectedText: 'Secure Area',
    expectedElement: '.flash.success',
    steps: [
      {
        action: 'navigate',
        description: 'Navigate to login page',
        target: 'https://the-internet.herokuapp.com/login',
        value: 'https://the-internet.herokuapp.com/login',
        expectedResult: 'Login page loads successfully'
      },
      {
        action: 'fill',
        description: 'Enter username',
        target: 'username field',
        value: 'tomsmith',
        expectedResult: 'Username is entered'
      },
      {
        action: 'fill',
        description: 'Enter password',
        target: 'password field',
        value: 'SuperSecretPassword!',
        expectedResult: 'Password is entered'
      },
      {
        action: 'click',
        description: 'Click login button',
        target: 'login button',
        expectedResult: 'Login form is submitted'
      },
      {
        action: 'verify',
        description: 'Verify success message',
        target: 'Secure Area',
        value: 'Secure Area',
        expectedResult: 'Login is successful'
      }
    ]
  }
}; 