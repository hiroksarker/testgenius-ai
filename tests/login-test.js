// TestGenius AI - Login Test with Path Navigation
// This test demonstrates navigation to specific login path

module.exports = {
  id: "login-test",
  name: "Login Test with Path Navigation",
  description: "Test login functionality by navigating to specific login path",
  priority: "High",
  tags: ["login", "path-navigation"],
  site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
  testData: {
    targetUrl: "https://the-internet.herokuapp.com/login",
    username: "tomsmith",
    password: "SuperSecretPassword!",
    usernameSelector: "#username",
    passwordSelector: "#password",
    submitSelector: "button[type='submit']",
    expectedText: "Secure Area",
    expectedElement: ".flash.success"
  },
  task: "Test login functionality by navigating to login page and performing login"
}; 