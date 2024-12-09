describe('Tournament Metrics System', () => {
  beforeEach(() => {
    cy.login({ role: 'admin' }); // Custom command to handle admin authentication
    cy.intercept('GET', '/rest/v1/system_metrics*').as('getSystemMetrics');
    cy.intercept('GET', '/rest/v1/tournament_matches*').as('getMatchMetrics');
  });

  describe('System Health Dashboard', () => {
    beforeEach(() => {
      cy.visit('/admin/metrics/system');
    });

    it('displays real-time system metrics', () => {
      cy.get('[data-testid="system-health-dashboard"]').within(() => {
        // Check core metrics
        cy.get('[data-testid="cpu-usage"]').should('be.visible');
        cy.get('[data-testid="memory-usage"]').should('be.visible');
        cy.get('[data-testid="error-rate"]').should('be.visible');
        cy.get('[data-testid="response-time"]').should('be.visible');

        // Verify metrics are updating
        cy.wait('@getSystemMetrics');
        cy.get('[data-testid="cpu-usage"]').invoke('text')
          .then(text1 => {
            cy.wait(5000); // Wait for next update
            cy.get('[data-testid="cpu-usage"]').invoke('text')
              .should('not.eq', text1);
          });
      });
    });

    it('shows system health status indicators', () => {
      cy.get('[data-testid="health-status"]').should('have.class', /healthy|degraded|critical/);
      cy.get('[data-testid="health-issues"]').should('exist');
    });

    it('displays system load analysis', () => {
      cy.get('[data-testid="load-analysis"]').within(() => {
        cy.get('[data-testid="peak-times"]').should('be.visible');
        cy.get('[data-testid="bottlenecks"]').should('be.visible');
        cy.get('[data-testid="recommendations"]').should('be.visible');
      });
    });
  });

  describe('Tournament Performance Metrics', () => {
    beforeEach(() => {
      cy.visit('/admin/metrics/tournaments');
    });

    it('analyzes match duration metrics', () => {
      cy.get('[data-testid="tournament-selector"]').click();
      cy.get('[data-testid="tournament-option"]').first().click();

      cy.wait('@getMatchMetrics');
      cy.get('[data-testid="match-metrics"]').within(() => {
        cy.get('[data-testid="average-duration"]').should('be.visible');
        cy.get('[data-testid="completion-rate"]').should('be.visible');
        cy.get('[data-testid="error-frequency"]').should('be.visible');
      });
    });

    it('displays player retention metrics', () => {
      cy.get('[data-testid="retention-metrics"]').within(() => {
        cy.get('[data-testid="daily-active"]').should('be.visible');
        cy.get('[data-testid="weekly-active"]').should('be.visible');
        cy.get('[data-testid="monthly-active"]').should('be.visible');
        cy.get('[data-testid="churn-rate"]').should('be.visible');
      });
    });

    it('generates performance reports', () => {
      // Generate daily report
      cy.get('[data-testid="generate-report"]').click();
      cy.get('[data-testid="daily-report"]').click();
      cy.get('[data-testid="report-content"]').should('be.visible');

      // Generate weekly report
      cy.get('[data-testid="generate-report"]').click();
      cy.get('[data-testid="weekly-report"]').click();
      cy.get('[data-testid="report-content"]').should('include.text', 'Weekly Trends');
    });
  });

  describe('Metrics Export and Analysis', () => {
    beforeEach(() => {
      cy.visit('/admin/metrics/analysis');
    });

    it('exports metrics data in different formats', () => {
      // Export as CSV
      cy.get('[data-testid="export-metrics"]').click();
      cy.get('[data-testid="export-csv"]').click();
      cy.readFile('cypress/downloads/metrics_export.csv').should('exist');

      // Export as JSON
      cy.get('[data-testid="export-metrics"]').click();
      cy.get('[data-testid="export-json"]').click();
      cy.readFile('cypress/downloads/metrics_export.json').should('exist');
    });

    it('applies date range filters to metrics', () => {
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';

      cy.get('[data-testid="date-filter"]').click();
      cy.get('[data-testid="start-date"]').type(startDate);
      cy.get('[data-testid="end-date"]').type(endDate);
      cy.get('[data-testid="apply-filter"]').click();

      cy.wait('@getSystemMetrics')
        .its('request.url')
        .should('include', `start_date=${startDate}`)
        .and('include', `end_date=${endDate}`);
    });

    it('generates custom metric reports', () => {
      // Select metrics
      cy.get('[data-testid="metric-selector"]').click();
      cy.get('[data-testid="metric-cpu"]').click();
      cy.get('[data-testid="metric-memory"]').click();

      // Select visualization
      cy.get('[data-testid="visualization-type"]').select('line-chart');

      // Generate report
      cy.get('[data-testid="generate-custom-report"]').click();

      // Verify report
      cy.get('[data-testid="custom-report"]').within(() => {
        cy.get('[data-testid="chart"]').should('be.visible');
        cy.get('[data-testid="metrics-summary"]').should('be.visible');
      });
    });
  });

  describe('Alerts and Notifications', () => {
    beforeEach(() => {
      cy.visit('/admin/metrics/alerts');
    });

    it('configures metric alerts', () => {
      // Create new alert
      cy.get('[data-testid="create-alert"]').click();
      cy.get('[data-testid="alert-metric"]').select('cpu_usage');
      cy.get('[data-testid="alert-threshold"]').type('90');
      cy.get('[data-testid="alert-condition"]').select('greater_than');
      cy.get('[data-testid="save-alert"]').click();

      // Verify alert creation
      cy.get('[data-testid="alerts-list"]')
        .should('contain', 'CPU Usage')
        .and('contain', '90%');
    });

    it('manages notification settings', () => {
      cy.get('[data-testid="notification-settings"]').click();
      
      // Configure email notifications
      cy.get('[data-testid="email-notifications"]').click();
      cy.get('[data-testid="email-recipient"]').type('admin@example.com');
      cy.get('[data-testid="save-notifications"]').click();

      // Verify settings
      cy.get('[data-testid="notification-status"]')
        .should('contain', 'Email notifications enabled');
    });

    it('displays alert history', () => {
      cy.get('[data-testid="alert-history"]').click();
      cy.get('[data-testid="history-table"]').should('be.visible');
      cy.get('[data-testid="alert-record"]').should('have.length.gt', 0);
    });
  });
}); 