import { client } from '@datadog/datadog-api-client';

export const setupDashboard = async () => {
  const api = client.v1;
  
  const dashboard = {
    title: 'Tournament Mode - Production Metrics',
    description: 'Métricas em tempo real do modo torneio',
    widgets: [
      // Métricas de Performance
      {
        definition: {
          type: 'timeseries',
          requests: [{
            q: 'avg:tournament.match.duration{env:production}',
            display_type: 'line'
          }],
          title: 'Duração Média das Partidas'
        }
      },
      // Métricas de Usuários
      {
        definition: {
          type: 'toplist',
          requests: [{
            q: 'sum:tournament.active_players{env:production} by {tournament}'
          }],
          title: 'Jogadores Ativos por Torneio'
        }
      },
      // Métricas de Sistema
      {
        definition: {
          type: 'query_value',
          requests: [{
            q: 'avg:system.cpu.user{env:production}'
          }],
          title: 'CPU Usage'
        }
      }
    ],
    layout_type: 'ordered'
  };

  await api.createDashboard({ body: dashboard });
}; 