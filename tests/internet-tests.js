// TestGenius AI - The Internet Test Definitions
// This file exports test definitions for https://the-internet.herokuapp.com/

const FORM_AUTHENTICATION_TEST = {
  id: "INTERNET-001",
  name: "Form Authentication Test",
  description: "Test login functionality with valid credentials",
  priority: "High",
  tags: ["authentication", "forms", "smoke"],
  site: "https://the-internet.herokuapp.com/login",
  testData: {
    username: "tomsmith",
    password: "SuperSecretPassword!"
  },
  task: "Navigate to the login page, enter 'tomsmith' in the username field (id='username'), enter 'SuperSecretPassword!' in the password field (id='password'), click the login button, and verify successful login by checking for the secure area message"
};

const CHECKBOXES_TEST = {
  id: "INTERNET-002",
  name: "Checkboxes Test",
  description: "Test checkbox functionality and state changes",
  priority: "Medium",
  tags: ["forms", "interaction", "checkboxes"],
  site: "https://the-internet.herokuapp.com/checkboxes",
  testData: {},
  task: "Navigate to the checkboxes page, verify checkboxes are present, toggle the first checkbox to checked state, toggle the second checkbox to unchecked state, and verify the state changes"
};

const DROPDOWN_TEST = {
  id: "INTERNET-003",
  name: "Dropdown Test",
  description: "Test dropdown selection functionality",
  priority: "Medium",
  tags: ["forms", "dropdown", "selection"],
  site: "https://the-internet.herokuapp.com/dropdown",
  testData: {
    option: "Option 1"
  },
  task: "Navigate to the dropdown page, select 'Option 1' from the dropdown, and verify that the option is selected"
};

const DYNAMIC_CONTENT_TEST = {
  id: "INTERNET-004",
  name: "Dynamic Content Test",
  description: "Test page with dynamically changing content",
  priority: "Medium",
  tags: ["dynamic", "content", "verification"],
  site: "https://the-internet.herokuapp.com/dynamic_content",
  testData: {},
  task: "Navigate to the dynamic content page, verify that content is loaded, and check that multiple content blocks are present on the page"
};

const FILE_UPLOAD_TEST = {
  id: "INTERNET-005",
  name: "File Upload Test",
  description: "Test file upload functionality",
  priority: "Medium",
  tags: ["file", "upload", "forms"],
  site: "https://the-internet.herokuapp.com/upload",
  testData: {
    filePath: "./test-file.txt"
  },
  task: "Navigate to the file upload page, select a file to upload, click the upload button, and verify that the file was uploaded successfully"
};

const JAVASCRIPT_ALERTS_TEST = {
  id: "INTERNET-006",
  name: "JavaScript Alerts Test",
  description: "Test JavaScript alert handling",
  priority: "Medium",
  tags: ["javascript", "alerts", "popups"],
  site: "https://the-internet.herokuapp.com/javascript_alerts",
  testData: {},
  task: "Navigate to the JavaScript alerts page, click the 'Click for JS Alert' button, accept the alert, and verify that the result message shows 'You successfully clicked an alert'"
};

const ADD_REMOVE_ELEMENTS_TEST = {
  id: "INTERNET-007",
  name: "Add/Remove Elements Test",
  description: "Test dynamic element addition and removal",
  priority: "Medium",
  tags: ["dynamic", "elements", "interaction"],
  site: "https://the-internet.herokuapp.com/add_remove_elements/",
  testData: {},
  task: "Navigate to the add/remove elements page, click the 'Add Element' button to add a new element, verify the element appears, then click the 'Delete' button to remove it and verify it disappears"
};

const HOVERS_TEST = {
  id: "INTERNET-008",
  name: "Hover Test",
  description: "Test hover interactions and tooltips",
  priority: "Low",
  tags: ["hover", "interaction", "tooltips"],
  site: "https://the-internet.herokuapp.com/hovers",
  testData: {},
  task: "Navigate to the hovers page, hover over the first image, and verify that additional information appears for the user"
};

const KEY_PRESSES_TEST = {
  id: "INTERNET-009",
  name: "Key Presses Test",
  description: "Test keyboard input handling",
  priority: "Medium",
  tags: ["keyboard", "input", "interaction"],
  site: "https://the-internet.herokuapp.com/key_presses",
  testData: {
    key: "A"
  },
  task: "Navigate to the key presses page, press the 'A' key in the input field, and verify that the result shows 'You entered: A'"
};

const SLOW_RESOURCES_TEST = {
  id: "INTERNET-010",
  name: "Slow Resources Test",
  description: "Test page with slow loading resources",
  priority: "Low",
  tags: ["performance", "loading", "timeout"],
  site: "https://the-internet.herokuapp.com/slow",
  testData: {},
  task: "Navigate to the slow resources page, wait for the page to load completely, and verify that all content is displayed properly"
};

const BROKEN_IMAGES_TEST = {
  id: "INTERNET-011",
  name: "Broken Images Test",
  description: "Test page with broken image handling",
  priority: "Low",
  tags: ["images", "broken", "verification"],
  site: "https://the-internet.herokuapp.com/broken_images",
  testData: {},
  task: "Navigate to the broken images page, verify that the page loads, and check that multiple images are present (some may be broken)"
};

const CHALLENGING_DOM_TEST = {
  id: "INTERNET-012",
  name: "Challenging DOM Test",
  description: "Test complex DOM structure and interactions",
  priority: "Medium",
  tags: ["dom", "complex", "tables"],
  site: "https://the-internet.herokuapp.com/challenging_dom",
  testData: {},
  task: "Navigate to the challenging DOM page, verify the table is present with multiple rows and columns, and check that the page contains various interactive elements"
};

module.exports = {
  FORM_AUTHENTICATION_TEST,
  CHECKBOXES_TEST,
  DROPDOWN_TEST,
  DYNAMIC_CONTENT_TEST,
  FILE_UPLOAD_TEST,
  JAVASCRIPT_ALERTS_TEST,
  ADD_REMOVE_ELEMENTS_TEST,
  HOVERS_TEST,
  KEY_PRESSES_TEST,
  SLOW_RESOURCES_TEST,
  BROKEN_IMAGES_TEST,
  CHALLENGING_DOM_TEST
}; 