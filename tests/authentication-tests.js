// Authentication Tests for TestGenius AI (Full WebDriverIO Support)

module.exports = [
  {
    id: "AUTH-001",
    name: "Successful Login Test",
    description: "Test login functionality with valid credentials",
    priority: "High",
    tags: ["authentication", "login", "smoke"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      // Dynamic data - AI will use this to understand what to do
      targetUrl: "https://the-internet.herokuapp.com/login", // AI will navigate to this URL
      username: "tomsmith",
      password: "SuperSecretPassword!",
      usernameSelector: "#username",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      expectedText: "Secure Area", // AI will verify this text appears
      expectedElement: ".flash.success", // AI will verify this element exists
      // Smart AI Detection will handle all interactions automatically
      // No need for redundant actions - AI will use the selectors above
    },
    task: "Navigate to the login page, enter valid username and password in the login form, click the login button, and verify successful login"
  },
  {
    id: "AUTH-002",
    name: "Failed Login Test",
    description: "Test login functionality with invalid credentials",
    priority: "Medium",
    tags: ["authentication", "login", "validation"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "https://the-internet.herokuapp.com/login",
      username: "invalid@example.com",
      password: "wrongpassword",
      usernameSelector: "#username",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      expectedText: "Your username is invalid", // AI will verify error message
      expectedElement: ".flash.error", // AI will verify error element
      // Smart AI Detection will handle all interactions automatically
    },
    task: "Navigate to the login page, enter invalid username and password, click the login button, and verify that an error message is displayed"
  }
]; 