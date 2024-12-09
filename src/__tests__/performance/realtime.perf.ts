import ws from 'k6/ws';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const wsErrorRate = new Rate('websocket_errors');

export const options = {
  stages: [
    { duration: '1m', target: 100 },  // Ramp-up
    { duration: '3m', target: 100 },  // Teste de carga
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    websocket_errors: ['rate<0.1'],
  },
};

export default function() {
  const url = 'ws://localhost:3000/realtime';
  const params = { 
    headers: { 
      'Authorization': 'Bearer test-token' 
    } 
  };

  const response = ws.connect(url, params, function(socket) {
    socket.on('open', () => {
      // Inscrever em atualizações do torneio
      socket.send(JSON.stringify({
        type: 'subscribe',
        tournament: 'test-tournament'
      }));

      // Simular atualizações de pontuação
      setInterval(() => {
        socket.send(JSON.stringify({
          type: 'score_update',
          score: Math.random() * 100
        }));
      }, 1000);
    });

    socket.on('message', (data) => {
      check(data, {
        'message received': (d) => d !== undefined,
        'valid message format': (d) => {
          try {
            JSON.parse(d);
            return true;
          } catch {
            return false;
          }
        },
      });
    });

    socket.on('error', () => {
      wsErrorRate.add(1);
    });

    // Manter conexão por 30 segundos
    socket.setTimeout(function() {
      socket.close();
    }, 30000);
  });

  check(response, {
    'status is 101': (r) => r && r.status === 101,
  });
} 