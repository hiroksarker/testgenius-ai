// Authentication Tests for TestGenius AI (User-facing)

module.exports = [
  {
    id: "AUTH-001",
    name: "Successful Login Test",
    description: "Test login functionality with valid credentials",
    priority: "High",
    tags: ["authentication", "login", "smoke"],
    site: "https://example.com",
    testData: {
      email: "test@example.com",
      password: "password123"
    },
    task: "Navigate to the login page, enter valid email and password, click the login button, and verify that the user is successfully logged in by checking for a welcome message or dashboard element"
  },
  {
    id: "AUTH-002",
    name: "Failed Login Test",
    description: "Test login functionality with invalid credentials",
    priority: "Medium",
    tags: ["authentication", "login", "validation"],
    site: "https://example.com",
    testData: {
      email: "invalid@example.com",
      password: "wrongpassword"
    },
    task: "Navigate to the login page, enter invalid email and password, click the login button, and verify that an error message is displayed indicating invalid credentials"
  },
  {
    id: "AUTH-003",
    name: "User Registration Test",
    description: "Test new user registration functionality",
    priority: "Medium",
    tags: ["authentication", "registration", "signup"],
    site: "https://example.com",
    testData: {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "securePassword123",
      confirmPassword: "securePassword123"
    },
    task: "Navigate to the registration page, fill out the registration form with valid information including first name, last name, email, password, and confirm password, submit the form, and verify that the user is successfully registered and redirected to a confirmation page"
  },
  {
    id: "AUTH-004",
    name: "Password Reset Test",
    description: "Test password reset functionality",
    priority: "Low",
    tags: ["authentication", "password-reset", "recovery"],
    site: "https://example.com",
    testData: {
      email: "user@example.com"
    },
    task: "Navigate to the login page, click on the 'Forgot Password' link, enter a valid email address, submit the form, and verify that a confirmation message is displayed indicating that password reset instructions have been sent"
  },
  {
    id: "AUTH-005",
    name: "User Logout Test",
    description: "Test logout functionality",
    priority: "Medium",
    tags: ["authentication", "logout", "session"],
    site: "https://example.com",
    testData: {
      email: "test@example.com",
      password: "password123"
    },
    task: "First login with valid credentials, then locate and click the logout button or link, and verify that the user is successfully logged out and redirected to the login page"
  }
]; 