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
      targetUrl: "https://the-internet.herokuapp.com/login",
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
      targetUrl: "https://the-internet.herokuapp.com/checkboxes",
      checkbox1Selector: "input[type='checkbox']",
      checkbox2Selector: "input[type='checkbox']",
      expectedText: "checkboxes",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to checkboxes page',
          target: 'https://the-internet.herokuapp.com/checkboxes',
          value: 'https://the-internet.herokuapp.com/checkboxes',
          expectedResult: 'Checkboxes page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify checkboxes page title',
          target: 'checkboxes',
          value: 'checkboxes',
          expectedResult: 'Page title contains checkboxes'
        },
        {
          action: 'click',
          description: 'Toggle first checkbox',
          target: 'input[type="checkbox"]',
          expectedResult: 'First checkbox is toggled'
        },
        {
          action: 'click',
          description: 'Toggle second checkbox',
          target: 'input[type="checkbox"]',
          expectedResult: 'Second checkbox is toggled'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/dropdown",
      dropdownSelector: "#dropdown",
      optionValue: "1",
      optionText: "Option 1",
      expectedText: "Dropdown List",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to dropdown page',
          target: 'https://the-internet.herokuapp.com/dropdown',
          value: 'https://the-internet.herokuapp.com/dropdown',
          expectedResult: 'Dropdown page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify dropdown page title',
          target: 'Dropdown List',
          value: 'Dropdown List',
          expectedResult: 'Page title contains Dropdown List'
        },
        {
          action: 'click',
          description: 'Open dropdown',
          target: 'select',
          expectedResult: 'Dropdown opens'
        },
        {
          action: 'click',
          description: 'Select Option 1',
          target: 'option[value="1"]',
          expectedResult: 'Option 1 is selected'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/dynamic_content",
      contentSelector: ".large-10",
      expectedText: "Dynamic Content",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to dynamic content page',
          target: 'https://the-internet.herokuapp.com/dynamic_content',
          value: 'https://the-internet.herokuapp.com/dynamic_content',
          expectedResult: 'Dynamic content page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify dynamic content page title',
          target: 'Dynamic Content',
          value: 'Dynamic Content',
          expectedResult: 'Page title contains Dynamic Content'
        },
        {
          action: 'verify',
          description: 'Verify content blocks are present',
          target: 'div',
          expectedResult: 'Content blocks are loaded'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/upload",
      fileInputSelector: "#file-upload",
      filePath: "./test-file.txt",
      uploadButtonSelector: "#file-submit",
      expectedText: "File Uploaded!",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to file upload page',
          target: 'https://the-internet.herokuapp.com/upload',
          value: 'https://the-internet.herokuapp.com/upload',
          expectedResult: 'File upload page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify file upload page title',
          target: 'File Uploader',
          value: 'File Uploader',
          expectedResult: 'Page title contains File Uploader'
        },
        {
          action: 'fill',
          description: 'Select file to upload',
          target: '#file-upload',
          value: './test-file.txt',
          expectedResult: 'File is selected'
        },
        {
          action: 'click',
          description: 'Click upload button',
          target: '#file-submit',
          expectedResult: 'File upload is initiated'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/javascript_alerts",
      alertButtonSelector: "button[onclick='jsAlert()']",
      resultSelector: "#result",
      expectedText: "You successfully clicked an alert",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to JavaScript alerts page',
          target: 'https://the-internet.herokuapp.com/javascript_alerts',
          value: 'https://the-internet.herokuapp.com/javascript_alerts',
          expectedResult: 'JavaScript alerts page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify JavaScript alerts page title',
          target: 'JavaScript Alerts',
          value: 'JavaScript Alerts',
          expectedResult: 'Page title contains JavaScript Alerts'
        },
        {
          action: 'click',
          description: 'Click for JS Alert button',
          target: 'button[onclick="jsAlert()"]',
          expectedResult: 'JavaScript alert is triggered'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/add_remove_elements/",
      addButtonSelector: "button[onclick='addElement()']",
      deleteButtonSelector: ".added-manually",
      expectedText: "Add/Remove Elements",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to add/remove elements page',
          target: 'https://the-internet.herokuapp.com/add_remove_elements/',
          value: 'https://the-internet.herokuapp.com/add_remove_elements/',
          expectedResult: 'Add/remove elements page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify add/remove elements page title',
          target: 'Add/Remove Elements',
          value: 'Add/Remove Elements',
          expectedResult: 'Page title contains Add/Remove Elements'
        },
        {
          action: 'click',
          description: 'Click Add Element button',
          target: 'button[onclick="addElement()"]',
          expectedResult: 'New element is added'
        },
        {
          action: 'verify',
          description: 'Verify delete button appears',
          target: '.added-manually',
          expectedResult: 'Delete button is present'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/hovers",
      hoverElementSelector: ".figure:nth-child(3)",
      tooltipSelector: ".figcaption",
      expectedText: "Hovers",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to hovers page',
          target: 'https://the-internet.herokuapp.com/hovers',
          value: 'https://the-internet.herokuapp.com/hovers',
          expectedResult: 'Hovers page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify hovers page title',
          target: 'Hovers',
          value: 'Hovers',
          expectedResult: 'Page title contains Hovers'
        },
        {
          action: 'verify',
          description: 'Verify hover elements are present',
          target: '.figure',
          expectedResult: 'Hover elements are loaded'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/key_presses",
      inputSelector: "#target",
      key: "A",
      resultSelector: "#result",
      expectedText: "You entered: A",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to key presses page',
          target: 'https://the-internet.herokuapp.com/key_presses',
          value: 'https://the-internet.herokuapp.com/key_presses',
          expectedResult: 'Key presses page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify key presses page title',
          target: 'Key Presses',
          value: 'Key Presses',
          expectedResult: 'Page title contains Key Presses'
        },
        {
          action: 'click',
          description: 'Click on input field',
          target: '#target',
          expectedResult: 'Input field is focused'
        },
        {
          action: 'fill',
          description: 'Press A key',
          target: '#target',
          value: 'A',
          expectedResult: 'A key is pressed'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/slow",
      expectedText: "Slow Resources",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to slow resources page',
          target: 'https://the-internet.herokuapp.com/slow',
          value: 'https://the-internet.herokuapp.com/slow',
          expectedResult: 'Slow resources page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify slow resources page title',
          target: 'Slow Resources',
          value: 'Slow Resources',
          expectedResult: 'Page title contains Slow Resources'
        },
        {
          action: 'wait',
          description: 'Wait for page to load completely',
          target: 'body',
          expectedResult: 'Page is fully loaded'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/broken_images",
      imageSelector: "img",
      expectedText: "Broken Images",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to broken images page',
          target: 'https://the-internet.herokuapp.com/broken_images',
          value: 'https://the-internet.herokuapp.com/broken_images',
          expectedResult: 'Broken images page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify broken images page title',
          target: 'Broken Images',
          value: 'Broken Images',
          expectedResult: 'Page title contains Broken Images'
        },
        {
          action: 'verify',
          description: 'Verify images are present',
          target: 'img',
          expectedResult: 'Images are loaded on page'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/challenging_dom",
      tableSelector: "table",
      buttonSelector: "button",
      expectedText: "Challenging DOM",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to challenging DOM page',
          target: 'https://the-internet.herokuapp.com/challenging_dom',
          value: 'https://the-internet.herokuapp.com/challenging_dom',
          expectedResult: 'Challenging DOM page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify challenging DOM page title',
          target: 'Challenging DOM',
          value: 'Challenging DOM',
          expectedResult: 'Page title contains Challenging DOM'
        },
        {
          action: 'verify',
          description: 'Verify table is present',
          target: 'table',
          expectedResult: 'Table is loaded on page'
        },
        {
          action: 'verify',
          description: 'Verify buttons are present',
          target: 'button',
          expectedResult: 'Buttons are loaded on page'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/login",
      username: "invalid@example.com",
      password: "wrongpassword",
      usernameSelector: "#username",
      passwordSelector: "#password",
      submitSelector: "button[type='submit']",
      expectedText: "Your username is invalid!",
      expectedElement: ".flash.error",
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
          description: 'Enter invalid username',
          target: '#username',
          value: 'invalid@example.com',
          expectedResult: 'Invalid username is entered'
        },
        {
          action: 'fill',
          description: 'Enter invalid password',
          target: '#password',
          value: 'wrongpassword',
          expectedResult: 'Invalid password is entered'
        },
        {
          action: 'click',
          description: 'Click login button',
          target: 'button[type="submit"]',
          expectedResult: 'Login form is submitted'
        },
        {
          action: 'verify',
          description: 'Verify error message',
          target: 'error messages',
          value: 'error messages',
          expectedResult: 'Error message is displayed'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/windows",
      linkSelector: "a[href='/windows/new']",
      expectedText: "Opening a new window",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to multiple windows page',
          target: 'https://the-internet.herokuapp.com/windows',
          value: 'https://the-internet.herokuapp.com/windows',
          expectedResult: 'Multiple windows page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify multiple windows page title',
          target: 'Opening a new window',
          value: 'Opening a new window',
          expectedResult: 'Page title contains Opening a new window'
        },
        {
          action: 'verify',
          description: 'Verify link is present',
          target: 'a',
          expectedResult: 'Link to open new window is present'
        }
      ]
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
      targetUrl: "https://the-internet.herokuapp.com/iframe",
      frameSelector: "#mce_0_ifr",
      contentSelector: "#tinymce",
      expectedText: "Your content goes here.",
      steps: [
        {
          action: 'navigate',
          description: 'Navigate to frames page',
          target: 'https://the-internet.herokuapp.com/iframe',
          value: 'https://the-internet.herokuapp.com/iframe',
          expectedResult: 'Frames page loads successfully'
        },
        {
          action: 'verify',
          description: 'Verify frames page title',
          target: 'An iFrame containing the TinyMCE WYSIWYG Editor',
          value: 'An iFrame containing the TinyMCE WYSIWYG Editor',
          expectedResult: 'Page title contains iframe information'
        },
        {
          action: 'verify',
          description: 'Verify iframe is present',
          target: 'iframe',
          expectedResult: 'Iframe is loaded on page'
        }
      ]
    },
    task: "Navigate to the frames page, switch to the iframe, and verify that the content is editable"
  }
]; 