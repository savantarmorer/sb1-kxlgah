import { supabase } from '@/lib/supabase';
import { Tournament, TournamentMatch, TournamentParticipant, RoundStatus } from '@/types/tournament';

interface MatchPairing {
  player1_id: string;
  player2_id: string;
  round: number;
}

interface RoundStatusResult {
  status: RoundStatus;
  totalMatches: number;
  completedMatches: number;
  progress: number;
}

/**
 * Gerencia a progressão e estado dos rounds do torneio
 */
export class TournamentRoundManager {
    static readonly ROUNDS = {
      QUARTER_FINALS: 1,
      SEMI_FINALS: 2,
      FINALS: 3
    };
  
    /**
     * Calcula o número total de rounds necessários
     */
    static calculateTotalRounds(participantCount: number): number {
      return Math.ceil(Math.log2(participantCount));
    }
  
    /**
     * Gera os pares iniciais de participantes
     */
    static generateInitialPairings(participants: TournamentParticipant[]): MatchPairing[] {
      // Embaralha participantes para pareamento aleatório
      const shuffled = [...participants].sort(() => Math.random() - 0.5);
      const pairings: MatchPairing[] = [];
  
      for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i + 1]) {
          pairings.push({
            player1_id: shuffled[i].user_id,
            player2_id: shuffled[i + 1].user_id,
            round: this.ROUNDS.QUARTER_FINALS
          });
        }
      }
  
      return pairings;
    }
  
    /**
     * Gera os pares para o próximo round
     */
    static generateNextRoundPairings(
      winners: string[],
      currentRound: number
    ): MatchPairing[] {
      const pairings: MatchPairing[] = [];
  
      for (let i = 0; i < winners.length; i += 2) {
        if (winners[i + 1]) {
          pairings.push({
            player1_id: winners[i],
            player2_id: winners[i + 1],
            round: currentRound + 1
          });
        }
      }
  
      return pairings;
    }
  
    /**
     * Verifica se o round atual está completo
     */
    static async isRoundComplete(tournament_id: string, round: number): Promise<boolean> {
      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('status')
        .eq('tournament_id', tournament_id)
        .eq('round', round);
  
      return matches?.every(match => match.status === 'completed') ?? false;
    }
  
    /**
     * Retorna o status atual do round
     */
    static getRoundStatus(matches: TournamentMatch[]): RoundStatus {
      const completedCount = matches.filter(match => match.status === 'completed').length;
      const totalMatches = matches.length;
  
      if (completedCount === totalMatches) {
        return 'completed';
      } else if (completedCount > 0) {
        return 'in_progress';
      }
      return 'waiting';
    }
  
    /**
     * Valida se um round pode ser iniciado
     */
    static validateRoundStart(tournament: Tournament, round: number): boolean {
      const currentTime = new Date();
      const tournamentStart = new Date(tournament.start_date);
      const roundStartTime = this.calculateRoundStartTime(tournamentStart, round);
  
      return currentTime >= roundStartTime;
    }
  
    /**
     * Calcula o tempo de início de cada round
     */
    private static calculateRoundStartTime(tournamentStart: Date, round: number): Date {
      const HOURS_PER_ROUND = 24;
      const startTime = new Date(tournamentStart);
      startTime.setHours(startTime.getHours() + (round - 1) * HOURS_PER_ROUND);
      return startTime;
    }
  
    static getRoundStatusDetails(matches: TournamentMatch[]): RoundStatusResult {
      const completedCount = matches.filter(match => match.status === 'completed').length;
      const totalMatches = matches.length;
      const progress = (completedCount / totalMatches) * 100;
  
      return {
        status: this.getRoundStatus(matches),
        totalMatches,
        completedMatches: completedCount,
        progress
      };
    }
  }