// AI-Enhanced Test Example
// This test demonstrates the enhanced AI capabilities of TestGenius

module.exports = {
  id: 'ai-enhanced-example',
  name: 'AI Enhanced Login Test',
  description: 'Demonstrates AI-powered element detection and intelligent execution',
  priority: 'High',
  tags: ['ai-enhanced', 'login', 'example'],
  site: process.env.STAGING_BASE_URL || 'https://the-internet.herokuapp.com',
  task: 'Test login functionality with AI-enhanced element detection and error recovery',
  testData: {
    targetUrl: 'https://the-internet.herokuapp.com/login',
    username: 'tomsmith',
    password: 'SuperSecretPassword!',
    expectedSuccessText: 'Secure Area',
    // AI will use these hints for better element detection
    elementHints: {
      usernameField: 'username input field',
      passwordField: 'password input field', 
      loginButton: 'login button',
      successIndicator: 'secure area heading'
    }
  },
  
  // AI will generate these steps automatically, but you can provide hints
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
      description: 'Enter username in the username field',
      target: 'username field',
      value: 'tomsmith',
      expectedResult: 'Username field is filled with test data'
    },
    {
      action: 'fill', 
      description: 'Enter password in the password field',
      target: 'password field',
      value: 'SuperSecretPassword!',
      expectedResult: 'Password field is filled with test data'
    },
    {
      action: 'click',
      description: 'Click the login button',
      target: 'login button',
      expectedResult: 'Login form is submitted'
    },
    {
      action: 'verify',
      description: 'Verify successful login by checking for secure area text',
      target: 'Secure Area',
      value: 'Secure Area',
      expectedResult: 'User is successfully logged in and sees secure area'
    }
  ],

  // AI execution hints
  aiHints: {
    // Tell AI to use multiple strategies for element detection
    elementDetection: 'aggressive',
    
    // Enable intelligent error recovery
    errorRecovery: true,
    
    // Use visual verification
    visualVerification: true,
    
    // Take screenshots at key points
    screenshots: ['before-login', 'after-login', 'on-error'],
    
    // Custom selectors as fallbacks
    fallbackSelectors: {
      usernameField: ['#username', '[name="username"]', 'input[type="text"]'],
      passwordField: ['#password', '[name="password"]', 'input[type="password"]'],
      loginButton: ['button[type="submit"]', '.btn', '[role="button"]']
    }
  }
};

// Alternative: Natural Language Test (AI will generate everything)
module.exports.naturalLanguage = {
  id: 'natural-language-example',
  name: 'Natural Language Login Test',
  description: 'Test created entirely from natural language description',
  priority: 'Medium',
  tags: ['natural-language', 'ai-generated'],
  site: process.env.STAGING_BASE_URL || 'https://the-internet.herokuapp.com',
  task: 'Test that a user can successfully log in with valid credentials and access the secure area',
  
  // AI will automatically generate all steps and test data
  // No manual step definition required
  aiGenerated: true,
  
  // Optional: Provide context for better AI generation
  context: {
    application: 'Demo login application',
    userType: 'Standard user',
    testScenario: 'Happy path login flow',
    expectedOutcome: 'User should be redirected to secure area after successful login'
  }
};

// Example of how to run these tests:

/*
# Run the enhanced test
testgenius run ai-enhanced-example

# Run with AI enhancements
testgenius run ai-enhanced-example --ai-enhanced

# Run natural language test (AI generates everything)
testgenius auto "Test login functionality with valid credentials"

# Generate similar tests
testgenius generate "User authentication flow" --output tests/auth-flow.js

# Create test from screenshot
testgenius visual screenshots/login-page.png --output tests/visual-login.js
*/ 