import { client } from '@datadog/datadog-api-client';

export const setupAlerts = async () => {
  const api = client.v1;
  
  const alerts = [
    // Alerta de Latência
    {
      name: 'Tournament High Latency',
      type: 'metric alert',
      query: 'avg(last_5m):avg:tournament.match.latency{env:production} > 500',
      message: 'Alta latência detectada nas partidas! @devops-team',
      options: {
        thresholds: { critical: 500 },
        notify_no_data: true,
        notify_audit: true
      }
    },
    // Alerta de Erros
    {
      name: 'Tournament Error Rate',
      type: 'metric alert',
      query: 'sum(last_15m):sum:tournament.errors{env:production} > 50',
      message: 'Taxa de erros acima do normal! @devops-team @dev-team',
      options: {
        thresholds: { critical: 50 },
        notify_no_data: false
      }
    },
    // Alerta de Concurrent Users
    {
      name: 'Tournament Concurrent Users',
      type: 'metric alert',
      query: 'avg(last_5m):sum:tournament.concurrent_users{env:production} > 1000',
      message: 'Alto número de usuários simultâneos! @devops-team',
      options: {
        thresholds: { critical: 1000, warning: 800 },
        notify_no_data: false
      }
    }
  ];

  for (const alert of alerts) {
    await api.createMonitor({ body: alert });
  }
}; 