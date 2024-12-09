import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');

// Configuração dos testes
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Ramp-up para 50 usuários
    { duration: '3m', target: 50 },  // Manter 50 usuários
    { duration: '1m', target: 100 }, // Ramp-up para 100
    { duration: '3m', target: 100 }, // Teste de carga
    { duration: '1m', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições devem ser < 500ms
    errors: ['rate<0.1'],             // Taxa de erro < 10%
  },
};

// Dados de teste
const TEST_TOURNAMENTS = [
  'tournament-1',
  'tournament-2',
  'tournament-3'
];

export default function() {
  // 1. Listar torneios
  const listResponse = http.get('http://localhost:3000/api/tournaments');
  check(listResponse, {
    'tournaments list status 200': (r) => r.status === 200,
    'tournaments list load time < 200ms': (r) => r.timings.duration < 200,
  });

  // 2. Registrar em torneio
  const tournamentId = TEST_TOURNAMENTS[Math.floor(Math.random() * TEST_TOURNAMENTS.length)];
  const registerResponse = http.post(`http://localhost:3000/api/tournaments/${tournamentId}/register`);
  check(registerResponse, {
    'tournament registration successful': (r) => r.status === 200,
    'registration time < 300ms': (r) => r.timings.duration < 300,
  });

  // 3. Carregar bracket
  const bracketResponse = http.get(`http://localhost:3000/api/tournaments/${tournamentId}/bracket`);
  check(bracketResponse, {
    'bracket load successful': (r) => r.status === 200,
    'bracket load time < 150ms': (r) => r.timings.duration < 150,
  });

  // 4. Simular partida
  const matchResponse = http.post(`http://localhost:3000/api/matches`, {
    tournament_id: tournamentId,
    score: Math.floor(Math.random() * 1000),
  });
  check(matchResponse, {
    'match submission successful': (r) => r.status === 200,
    'match submission time < 400ms': (r) => r.timings.duration < 400,
  });

  sleep(1);
}