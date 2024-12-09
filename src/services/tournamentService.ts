/**
 * Service for managing tournament operations
 */
import { supabase } from '../lib/supabase';
import { Tournament, TournamentStatus, TournamentMatch } from '../types/tournament';

interface TournamentParticipant {
  id: string;
  user_id: string;
  score: number;
  matches_played: number;
}

interface Profile {
  id: string;
  username: string;
}

interface ParticipantWithProfile extends TournamentParticipant {
  profiles?: Profile;
}

export class TournamentService {
  /**
   * Create a new tournament
   */
  static async createTournament(data: Partial<Tournament>) {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .insert([{
          title: data.name,
          description: data.description,
          start_date: data.startDate,
          end_date: data.endDate,
          entry_fee: data.entryFee || 0,
          max_participants: data.maxPlayers,
          min_level: data.minLevel || 1,
          status: 'registration',
          rules: {
            format: data.rules?.format || 'single_elimination',
            matchFormat: data.rules?.matchFormat || 'best_of_3',
            minPlayers: data.rules?.minPlayers || 2
          },
          rewards: data.rewards || {
            positions: {
              1: { amount: 1000, currency: 'coins' },
              2: { amount: 500, currency: 'coins' },
              3: { amount: 250, currency: 'coins' }
            },
            participation: { amount: 50, currency: 'coins' }
          }
        }])
        .select()
        .single();

      if (error) throw error;
      return tournament;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      throw error;
    }
  }

  /**
   * Update tournament status
   */
  static async updateStatus(tournament_id: string, status: TournamentStatus) {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tournament_id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update tournament status:', error);
      throw error;
    }
  }

  /**
   * Delete a tournament
   */
  static async deleteTournament(id: string) {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      throw error;
    }
  }

  /**
   * Get all tournaments
   */
  static async getTournaments() {
    try {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants (
            id,
            user_id,
            score,
            matches_played
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs from participants
      const userIds = new Set(
        tournaments?.flatMap(t => 
          t.tournament_participants?.map((p: TournamentParticipant) => p.user_id) || []
        )
      );

      // Fetch usernames for all participants
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', Array.from(userIds));

      // Map usernames to participants
      const tournamentsWithUsernames = tournaments?.map(tournament => ({
        ...tournament,
        tournament_participants: tournament.tournament_participants?.map((participant: TournamentParticipant): ParticipantWithProfile => ({
          ...participant,
          profiles: profiles?.find(p => p.id === participant.user_id)
        }))
      }));

      return tournamentsWithUsernames;
    } catch (error) {
      console.error('Failed to get tournaments:', error);
      throw error;
    }
  }

  /**
   * Get tournament by ID
   */
  static async getTournamentById(id: string) {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants (
            id,
            user_id,
            score,
            matches_played
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (tournament?.tournament_participants?.length) {
        // Get usernames for participants
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', tournament.tournament_participants.map((p: TournamentParticipant) => p.user_id));

        // Add usernames to participants
        tournament.tournament_participants = tournament.tournament_participants.map((participant: TournamentParticipant): ParticipantWithProfile => ({
          ...participant,
          profiles: profiles?.find(p => p.id === participant.user_id)
        }));
      }

      return tournament;
    } catch (error) {
      console.error('Failed to get tournament:', error);
      throw error;
    }
  }

  /**
   * Register a player for a tournament
   */
  static async registerPlayer(tournament_id: string, user_id: string) {
    try {
      // Check if tournament is in registration phase
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournament_id)
        .single();

      if (!tournament) throw new Error('Tournament not found');
      if (tournament.status !== 'registration') throw new Error('Tournament is not in registration phase');

      // Check if player is already registered
      const { data: existingRegistrations } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament_id)
        .eq('user_id', user_id);

      if (existingRegistrations && existingRegistrations.length > 0) {
        throw new Error('Already registered for this tournament');
      }

      // Check if tournament is full
      const { data: allParticipants } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournament_id);

      if (allParticipants && allParticipants.length >= tournament.max_participants) {
        throw new Error('Tournament is full');
      }

      // Register player
      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id,
          user_id,
          score: 0,
          matches_played: 0
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to register player:', error);
      throw error;
    }
  }

  /**
   * Get match lobby status
   */
  static async getMatchLobbyStatus(match_id: string) {
    try {
      const { data: match, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:player1_id(username:profiles!inner(username)),
          player2:player2_id(username:profiles!inner(username))
        `)
        .eq('id', match_id)
        .single();

      if (error) throw error;

      return {
        match_id: match.id,
        status: match.status,
        player1_ready: match.player1_ready,
        player2_ready: match.player2_ready,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        player1_username: match.player1?.username?.username,
        player2_username: match.player2?.username?.username
      };
    } catch (error) {
      console.error('Failed to get match lobby status:', error);
      throw error;
    }
  }

  static async generateBrackets(tournament_id: string) {
    try {
      // Get tournament and participants
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', tournament_id)
        .single();

      if (!tournament) throw new Error('Tournament not found');

      const { data: participants } = await supabase
        .from('tournament_participants')
        .select('user_id')
        .eq('tournament_id', tournament_id);

      if (!participants || participants.length < 2) {
        throw new Error('Not enough participants to generate brackets');
      }

      // Shuffle participants for random seeding
      const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

      // Create matches for the first round
      const matches: {
        tournament_id: string;
        round: number;
        player1_id: string;
        player2_id: string;
        status: string;
        player1_score: number;
        player2_score: number;
      }[] = [];

      for (let i = 0; i < shuffledParticipants.length - 1; i += 2) {
        matches.push({
          tournament_id,
          round: 1,
          player1_id: shuffledParticipants[i].user_id,
          player2_id: shuffledParticipants[i + 1].user_id,
          status: 'waiting',
          player1_score: 0,
          player2_score: 0
        });
      }

      // If there's an odd number of players, add the last player to the next round
      if (shuffledParticipants.length % 2 !== 0) {
        const lastPlayer = shuffledParticipants[shuffledParticipants.length - 1];
        // Find another player without a match or create a match with the next available player
        const availablePlayer = participants.find(p => 
          !matches.some(m => m.player1_id === p.user_id || m.player2_id === p.user_id)
        );

        if (availablePlayer) {
          matches.push({
            tournament_id,
            round: 1,
            player1_id: lastPlayer.user_id,
            player2_id: availablePlayer.user_id,
            status: 'waiting',
            player1_score: 0,
            player2_score: 0
          });
        } else {
          // If no available player, this player automatically advances to next round
          console.log(`Player ${lastPlayer.user_id} gets a bye to next round`);
        }
      }

      // Insert matches into database
      if (matches.length > 0) {
        const { error: matchError } = await supabase
          .from('tournament_matches')
          .insert(matches);

        if (matchError) throw matchError;
      }

      // Update tournament status to in_progress
      await this.updateStatus(tournament_id, 'in_progress');
      return true;
    } catch (error) {
      console.error('Failed to generate brackets:', error);
      throw error;
    }
  }

  static async getTournamentMatches(tournament_id: string) {
    try {
      const { data: matches, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:player1_id(username:profiles(username)),
          player2:player2_id(username:profiles(username))
        `)
        .eq('tournament_id', tournament_id)
        .order('round', { ascending: true });

      if (error) throw error;
      return matches || [];
    } catch (error) {
      console.error('Failed to get tournament matches:', error);
      throw error;
    }
  }

  static async submitMatchResult(match_id: string, player1_score: number, player2_score: number) {
    try {
      const { data: match } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (!match) throw new Error('Match not found');

      const winner_id = player1_score > player2_score ? match.player1_id : match.player2_id;

      const { error } = await supabase
        .from('tournament_matches')
        .update({
          player1_score,
          player2_score,
          winner_id,
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', match_id);

      if (error) throw error;

      // Check if tournament is complete
      await this.checkTournamentCompletion(match_id);
      return true;
    } catch (error) {
      console.error('Failed to submit match result:', error);
      throw error;
    }
  }

  private static async checkTournamentCompletion(match_id: string) {
    try {
      const { data: match } = await supabase
        .from('tournament_matches')
        .select('tournament_id')
        .eq('id', match_id)
        .single();

      if (!match) return;

      const { data: matches } = await supabase
        .from('tournament_matches')
        .select('status')
        .eq('tournament_id', match.tournament_id);

      const allCompleted = matches?.every(m => m.status === 'completed');
      if (allCompleted) {
        await this.updateStatus(match.tournament_id, 'completed');
      }
    } catch (error) {
      console.error('Failed to check tournament completion:', error);
    }
  }

  static async startMatch(match_id: string) {
    try {
      const { data: match } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (!match) throw new Error('Match not found');
      if (match.status !== 'waiting') throw new Error('Match cannot be started');

      const { error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString()
        })
        .eq('id', match_id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to start match:', error);
      throw error;
    }
  }

  static async joinMatchLobby(match_id: string, user_id: string) {
    try {
      const { data: match } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (!match) throw new Error('Match not found');
      if (match.status !== 'waiting') throw new Error('Match is not in waiting state');
      if (match.player1_id !== user_id && match.player2_id !== user_id) {
        throw new Error('User is not a participant in this match');
      }

      // Update player ready status
      const readyField = match.player1_id === user_id ? 'player1_ready' : 'player2_ready';
      const { error } = await supabase
        .from('tournament_matches')
        .update({ [readyField]: true })
        .eq('id', match_id);

      if (error) throw error;

      // Check if both players are ready
      const { data: updatedMatch } = await supabase
        .from('tournament_matches')
        .select('player1_ready, player2_ready')
        .eq('id', match_id)
        .single();

      if (updatedMatch?.player1_ready && updatedMatch?.player2_ready) {
        await this.startMatch(match_id);
      }

      return true;
    } catch (error) {
      console.error('Failed to join match lobby:', error);
      throw error;
    }
  }

  static async leaveMatchLobby(match_id: string, user_id: string) {
    try {
      const { data: match } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (!match) throw new Error('Match not found');
      if (match.status !== 'waiting') throw new Error('Match is not in waiting state');

      // Update player ready status
      const readyField = match.player1_id === user_id ? 'player1_ready' : 'player2_ready';
      const { error } = await supabase
        .from('tournament_matches')
        .update({ [readyField]: false })
        .eq('id', match_id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to leave match lobby:', error);
      throw error;
    }
  }
}
