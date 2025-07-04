// TestGenius AI - Fast Mode Demo Test
// This test demonstrates fast mode capabilities with various UI interactions

module.exports = {
  id: "fast-demo-test",
  name: "Fast Mode Demo Test",
  description: "Comprehensive demo of fast mode capabilities",
  priority: "High",
  tags: ["demo", "fast-mode", "smart-detection"],
  site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
  testData: {
    targetUrl: "https://the-internet.herokuapp.com/login",
    username: "tomsmith",
    password: "SuperSecretPassword!",
    usernameSelector: "#username",
    passwordSelector: "#password",
    submitSelector: "button[type='submit']",
    expectedText: "Secure Area",
    expectedElement: ".flash.success",
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
        expectedResult: 'Success message is displayed'
      },
      {
        action: 'click',
        description: 'Click logout link',
        target: 'Logout',
        expectedResult: 'Logout link is clicked'
      },
      {
        action: 'verify',
        description: 'Verify logout success',
        target: 'You logged into a secure area!',
        value: 'You logged into a secure area!',
        expectedResult: 'User is logged out successfully'
      }
    ]
  },
  task: "Demonstrate fast mode element detection with various UI interactions"
}; 