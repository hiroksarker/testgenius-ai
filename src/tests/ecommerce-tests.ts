// E-commerce Tests for TestGenius AI
// These tests demonstrate complex user workflows and form interactions

export const PRODUCT_SEARCH_TEST = {
  id: "ECOMM-001",
  name: "Product Search and Browse Test",
  description: "Test product search and browsing functionality",
  priority: "High",
  tags: ["ecommerce", "search", "products", "smoke"],
  site: "https://example.com",
  testData: {
    searchTerm: "laptop",
    category: "Electronics"
  },
  task: "Navigate to the homepage, search for a specific product category, browse through the search results, and verify that relevant products are displayed with proper information like price, image, and description"
};

export const ADD_TO_CART_TEST = {
  id: "ECOMM-002",
  name: "Add to Cart Test",
  description: "Test adding products to shopping cart",
  priority: "High",
  tags: ["ecommerce", "cart", "purchase", "smoke"],
  site: "https://example.com",
  testData: {
    productName: "Wireless Headphones",
    quantity: 2
  },
  task: "Search for a specific product, view the product details page, select quantity, click 'Add to Cart', and verify that the product is successfully added to the cart with correct quantity and price"
};

export const CHECKOUT_PROCESS_TEST = {
  id: "ECOMM-003",
  name: "Checkout Process Test",
  description: "Test the complete checkout process",
  priority: "High",
  tags: ["ecommerce", "checkout", "payment", "smoke"],
  site: "https://example.com",
  testData: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    address: "123 Main Street",
    city: "New York",
    zipCode: "10001",
    cardNumber: "4111111111111111",
    expiryDate: "12/25",
    cvv: "123"
  },
  task: "Add a product to cart, proceed to checkout, fill out shipping information including name, address, and contact details, enter payment information, review the order, and complete the purchase"
};

export const USER_REVIEW_TEST = {
  id: "ECOMM-004",
  name: "Product Review Test",
  description: "Test product review submission functionality",
  priority: "Medium",
  tags: ["ecommerce", "reviews", "user-generated-content"],
  site: "https://example.com",
  testData: {
    rating: 5,
    reviewTitle: "Great Product!",
    reviewText: "This product exceeded my expectations. Highly recommended!",
    recommend: true
  },
  task: "Navigate to a product page, scroll to the reviews section, click on 'Write a Review', fill out the review form with rating, title, and detailed review text, submit the review, and verify that the review is successfully posted"
};

export const WISHLIST_TEST = {
  id: "ECOMM-005",
  name: "Wishlist Functionality Test",
  description: "Test adding and managing items in wishlist",
  priority: "Medium",
  tags: ["ecommerce", "wishlist", "favorites"],
  site: "https://example.com",
  testData: {
    productName: "Smart Watch"
  },
  task: "Search for a product, view the product details, click the 'Add to Wishlist' button, navigate to the wishlist page, verify the product is listed, and test removing an item from the wishlist"
}; 