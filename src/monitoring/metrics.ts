import { MetricsClient } from '@datadog/datadog-api-client';

export class TournamentMetrics {
  private static client = new MetricsClient();

  static async recordMatchMetrics(matchData: any) {
    const metrics = [
      {
        metric: 'tournament.match.duration',
        points: [[Date.now(), matchData.duration]],
        tags: [`tournament:${matchData.tournament_id}`]
      },
      {
        metric: 'tournament.match.score',
        points: [[Date.now(), matchData.score]],
        tags: [`player:${matchData.player_id}`]
      },
      {
        metric: 'tournament.match.latency',
        points: [[Date.now(), matchData.latency]],
        tags: [`region:${matchData.region}`]
      }
    ];

    await this.client.submitMetrics({ series: metrics });
  }

  static async recordSystemMetrics() {
    const metrics = [
      {
        metric: 'tournament.system.memory',
        points: [[Date.now(), process.memoryUsage().heapUsed]],
        tags: ['env:production']
      },
      {
        metric: 'tournament.system.cpu',
        points: [[Date.now(), process.cpuUsage().user]],
        tags: ['env:production']
      }
    ];

    await this.client.submitMetrics({ series: metrics });
  }

  static startPeriodicCollection() {
    setInterval(() => {
      this.recordSystemMetrics();
    }, 60000); // A cada minuto
  }
} 