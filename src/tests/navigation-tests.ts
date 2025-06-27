// Navigation Tests for TestGenius AI
// These tests demonstrate navigation and UI interaction capabilities

export const HOMEPAGE_LOAD_TEST = {
  id: "NAV-001",
  name: "Homepage Load Test",
  description: "Test that the homepage loads correctly with all essential elements",
  priority: "High",
  tags: ["navigation", "homepage", "smoke"],
  site: "https://example.com",
  testData: {},
  task: "Navigate to the homepage and verify that the page loads successfully, the main navigation menu is visible, and key elements like the logo, main content area, and footer are present"
};

export const MENU_NAVIGATION_TEST = {
  id: "NAV-002",
  name: "Main Menu Navigation Test",
  description: "Test navigation through the main menu items",
  priority: "Medium",
  tags: ["navigation", "menu", "links"],
  site: "https://example.com",
  testData: {},
  task: "Navigate to the homepage, click on each main menu item (About, Services, Contact, etc.), and verify that each page loads correctly and displays the expected content"
};

export const SEARCH_FUNCTIONALITY_TEST = {
  id: "NAV-003",
  name: "Search Functionality Test",
  description: "Test the search feature on the website",
  priority: "Medium",
  tags: ["navigation", "search", "functionality"],
  site: "https://example.com",
  testData: {
    searchTerm: "test search"
  },
  task: "Navigate to the homepage, locate the search box, enter a search term, submit the search, and verify that search results are displayed with relevant content"
};

export const RESPONSIVE_DESIGN_TEST = {
  id: "NAV-004",
  name: "Responsive Design Test",
  description: "Test that the website is responsive on different screen sizes",
  priority: "Medium",
  tags: ["navigation", "responsive", "mobile"],
  site: "https://example.com",
  testData: {},
  task: "Navigate to the homepage, resize the browser window to mobile dimensions, and verify that the layout adapts properly with a mobile-friendly navigation menu and properly sized elements"
};

export const BREADCRUMB_NAVIGATION_TEST = {
  id: "NAV-005",
  name: "Breadcrumb Navigation Test",
  description: "Test breadcrumb navigation functionality",
  priority: "Low",
  tags: ["navigation", "breadcrumbs", "usability"],
  site: "https://example.com",
  testData: {},
  task: "Navigate to a subpage through the main menu, verify that breadcrumbs are displayed showing the current page location, click on a breadcrumb link, and verify that it navigates to the correct parent page"
}; 