/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    // Add custom commands here
    login(email: string, password: string): Chainable<void>;
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
  }
} 