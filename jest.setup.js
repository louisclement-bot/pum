// jest.setup.js
// Global test setup for Jest

// Mock fetch API
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.resetAllMocks();
});

// Suppress console errors/warnings during tests
// Comment these out if you want to see them during test debugging
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  if (
    /Warning.*not wrapped in act/i.test(args[0]) ||
    /Warning.*cannot update a component/i.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (/Warning.*not wrapped in act/i.test(args[0])) {
    return;
  }
  originalConsoleWarn(...args);
};

// Add any global test utilities or custom matchers here
