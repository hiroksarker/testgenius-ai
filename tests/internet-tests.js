// TestGenius AI - The Internet Test Definitions with Smart AI Detection
// This file exports test definitions for https://the-internet.herokuapp.com/

module.exports = [
  {
    id: "INTERNET-001",
    name: "Form Authentication Test",
    description: "Test login functionality with valid credentials",
    priority: "High",
    tags: ["authentication", "forms", "smoke"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/login",
      username: "tomsmith",
      password: "SuperSecretPassword!",
      usernameSelector: "#username",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      expectedText: "Secure Area",
      expectedElement: ".flash.success"
    },
    task: "Navigate to the login page, enter valid username and password, click the login button, and verify successful login"
  },
  {
    id: "INTERNET-002",
    name: "Checkboxes Test",
    description: "Test checkbox functionality and state changes",
    priority: "Medium",
    tags: ["forms", "interaction", "checkboxes"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/checkboxes",
      checkbox1Selector: "input[type='checkbox']:nth-child(1)",
      checkbox2Selector: "input[type='checkbox']:nth-child(2)",
      expectedText: "checkboxes"
    },
    task: "Navigate to the checkboxes page, verify checkboxes are present, toggle the first checkbox to checked state, toggle the second checkbox to unchecked state, and verify the state changes"
  },
  {
    id: "INTERNET-003",
    name: "Dropdown Test",
    description: "Test dropdown selection functionality",
    priority: "Medium",
    tags: ["forms", "dropdown", "selection"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/dropdown",
      dropdownSelector: "#dropdown",
      optionValue: "1",
      optionText: "Option 1",
      expectedText: "Dropdown List"
    },
    task: "Navigate to the dropdown page, select 'Option 1' from the dropdown, and verify that the option is selected"
  },
  {
    id: "INTERNET-004",
    name: "Dynamic Content Test",
    description: "Test page with dynamically changing content",
    priority: "Medium",
    tags: ["dynamic", "content", "verification"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/dynamic_content",
      contentSelector: ".large-10",
      expectedText: "Dynamic Content"
    },
    task: "Navigate to the dynamic content page, verify that content is loaded, and check that multiple content blocks are present on the page"
  },
  {
    id: "INTERNET-005",
    name: "File Upload Test",
    description: "Test file upload functionality",
    priority: "Medium",
    tags: ["file", "upload", "forms"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/upload",
      fileInputSelector: "#file-upload",
      filePath: "./test-file.txt",
      uploadButtonSelector: "#file-submit",
      expectedText: "File Uploaded!"
    },
    task: "Navigate to the file upload page, select a file to upload, click the upload button, and verify that the file was uploaded successfully"
  },
  {
    id: "INTERNET-006",
    name: "JavaScript Alerts Test",
    description: "Test JavaScript alert handling",
    priority: "Medium",
    tags: ["javascript", "alerts", "popups"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/javascript_alerts",
      alertButtonSelector: "button[onclick='jsAlert()']",
      resultSelector: "#result",
      expectedText: "You successfully clicked an alert"
    },
    task: "Navigate to the JavaScript alerts page, click the 'Click for JS Alert' button, accept the alert, and verify that the result message shows 'You successfully clicked an alert'"
  },
  {
    id: "INTERNET-007",
    name: "Add/Remove Elements Test",
    description: "Test dynamic element addition and removal",
    priority: "Medium",
    tags: ["dynamic", "elements", "interaction"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/add_remove_elements/",
      addButtonSelector: "button[onclick='addElement()']",
      deleteButtonSelector: ".added-manually",
      expectedText: "Add/Remove Elements"
    },
    task: "Navigate to the add/remove elements page, click the 'Add Element' button to add a new element, verify the element appears, then click the 'Delete' button to remove it and verify it disappears"
  },
  {
    id: "INTERNET-008",
    name: "Hover Test",
    description: "Test hover interactions and tooltips",
    priority: "Low",
    tags: ["hover", "interaction", "tooltips"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/hovers",
      hoverElementSelector: ".figure:nth-child(3)",
      tooltipSelector: ".figcaption",
      expectedText: "Hovers"
    },
    task: "Navigate to the hovers page, hover over the first image, and verify that additional information appears for the user"
  },
  {
    id: "INTERNET-009",
    name: "Key Presses Test",
    description: "Test keyboard input handling",
    priority: "Medium",
    tags: ["keyboard", "input", "interaction"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/key_presses",
      inputSelector: "#target",
      key: "A",
      resultSelector: "#result",
      expectedText: "You entered: A"
    },
    task: "Navigate to the key presses page, press the 'A' key in the input field, and verify that the result shows 'You entered: A'"
  },
  {
    id: "INTERNET-010",
    name: "Slow Resources Test",
    description: "Test page with slow loading resources",
    priority: "Low",
    tags: ["performance", "loading", "timeout"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/slow",
      expectedText: "Slow Resources"
    },
    task: "Navigate to the slow resources page, wait for the page to load completely, and verify that all content is displayed properly"
  },
  {
    id: "INTERNET-011",
    name: "Broken Images Test",
    description: "Test page with broken image handling",
    priority: "Low",
    tags: ["images", "broken", "verification"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/broken_images",
      imageSelector: "img",
      expectedText: "Broken Images"
    },
    task: "Navigate to the broken images page, verify that the page loads, and check that multiple images are present (some may be broken)"
  },
  {
    id: "INTERNET-012",
    name: "Challenging DOM Test",
    description: "Test complex DOM structure and interactions",
    priority: "Medium",
    tags: ["dom", "complex", "tables"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/challenging_dom",
      tableSelector: "table",
      buttonSelector: ".button",
      expectedText: "Challenging DOM"
    },
    task: "Navigate to the challenging DOM page, verify the table is present with multiple rows and columns, and check that the page contains various interactive elements"
  },
  {
    id: "INTERNET-013",
    name: "Form Validation Test",
    description: "Test form validation with invalid credentials",
    priority: "Medium",
    tags: ["authentication", "validation", "forms"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/login",
      username: "invalid@example.com",
      password: "wrongpassword",
      usernameSelector: "#username",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      expectedText: "Your username is invalid",
      expectedElement: ".flash.error"
    },
    task: "Navigate to the login page, enter invalid username and password, click the login button, and verify that an error message is displayed"
  },
  {
    id: "INTERNET-014",
    name: "Multiple Windows Test",
    description: "Test opening and handling multiple windows",
    priority: "Medium",
    tags: ["windows", "navigation", "interaction"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/windows",
      linkSelector: "a[href='/windows/new']",
      expectedText: "Opening a new window"
    },
    task: "Navigate to the multiple windows page, click the link to open a new window, and verify that a new window opens"
  },
  {
    id: "INTERNET-015",
    name: "Frames Test",
    description: "Test iframe content and interactions",
    priority: "Medium",
    tags: ["frames", "iframes", "content"],
    site: process.env.STAGING_BASE_URL || "https://the-internet.herokuapp.com",
    testData: {
      targetUrl: "/iframe",
      frameSelector: "#mce_0_ifr",
      contentSelector: "#tinymce",
      expectedText: "Your content goes here."
    },
    task: "Navigate to the frames page, switch to the iframe, and verify that the content is editable"
  }
]; 