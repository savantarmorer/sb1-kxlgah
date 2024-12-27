declare namespace Cypress {
  interface Chainable {
    login(email: string, password: string): Chainable<void>;
    createTournament(options?: Partial<CreateTournamentDTO>): Chainable<string>;
    completeTournament(tournamentId: string): Chainable<void>;
  }
}

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.request('POST', '/api/auth/login', {
      email,
      password,
    }).then((response) => {
      window.localStorage.setItem('supabase.auth.token', response.body.token);
    });
  });
});

// Create tournament command
Cypress.Commands.add('createTournament', (options = {}) => {
  const defaultOptions: CreateTournamentDTO = {
    title: 'Test Tournament',
    description: 'Tournament for E2E testing',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 86400000).toISOString(),
    entry_fee: 0,
    max_participants: 8,
    rules: { /* default rules */ },
    rewards: { xp: 1000, coins: 500 }
  };

  return cy.request('POST', '/api/tournaments', {
    ...defaultOptions,
    ...options
  }).then((response) => response.body.id);
});

// Complete tournament command
Cypress.Commands.add('completeTournament', (tournamentId: string) => {
  return cy.request('POST', `/api/tournaments/${tournamentId}/complete`);
}); 