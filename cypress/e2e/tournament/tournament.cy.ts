describe('Tournament E2E', () => {
  beforeEach(() => {
    cy.login('testuser@example.com', 'password123');
    cy.visit('/tournaments');
  });

  it('should complete full tournament flow', () => {
    // 1. Listar torneios disponíveis
    cy.get('[data-testid="tournament-list"]')
      .should('be.visible')
      .find('.tournament-card')
      .should('have.length.at.least', 1);

    // 2. Registrar em um torneio
    cy.get('[data-testid="tournament-card"]')
      .first()
      .find('[data-testid="register-button"]')
      .click();

    // 3. Verificar registro
    cy.get('[data-testid="tournament-bracket"]')
      .should('be.visible')
      .find('[data-testid="player-name"]')
      .should('contain', 'TestUser');

    // 4. Iniciar partida
    cy.get('[data-testid="start-match-button"]')
      .first()
      .click();

    // 5. Jogar partida
    cy.get('[data-testid="match-view"]').should('be.visible');

    // Responder questões
    for (let i = 0; i < 10; i++) {
      cy.get('[data-testid="question"]').should('be.visible');
      cy.get('[data-testid="answer-option"]').first().click();
      cy.wait(1000); // Esperar animação
    }

    // 6. Verificar resultado
    cy.get('[data-testid="match-result"]')
      .should('be.visible')
      .and('contain', 'completed');

    // 7. Verificar progresso no bracket
    cy.get('[data-testid="tournament-bracket"]')
      .should('contain', 'Round 2');
  });

  it('should handle tournament rewards', () => {
    cy.visit('/tournaments/completed');

    cy.get('[data-testid="tournament-rewards"]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-testid="xp-reward"]').should('exist');
        cy.get('[data-testid="coins-reward"]').should('exist');
        cy.get('[data-testid="special-items"]').should('exist');
      });
  });
}); 