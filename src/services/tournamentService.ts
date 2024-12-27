import { supabase } from '@/lib/supabase';
import { Tournament, TournamentMatch, TournamentParticipant } from '@/types/tournament';

class TournamentService {
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
            matches_played,
            status,
            joined_at,
            users (
              id,
              username,
              profiles (
                id,
                name,
                avatar
              )
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return tournaments || [];
    } catch (error) {
      console.error('Failed to get tournaments:', error);
      throw error;
    }
  }

  static async getTournamentById(tournament_id: string): Promise<Tournament | null> {
    try {
      const { data: tournament, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants (
            id,
            user_id,
            score,
            matches_played,
            status,
            joined_at,
            users (
              id,
              username,
              profiles (
                id,
                name,
                avatar
              )
            )
          )
        `)
        .eq('id', tournament_id)
        .single();

      if (error) throw error;
      return tournament;
    } catch (error) {
      console.error('Failed to get tournament:', error);
      throw error;
    }
  }

  static async getMatchesByTournament(tournament_id: string): Promise<TournamentMatch[]> {
    try {
      const { data: matches, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:users!player1_id (
            id,
            username,
            profiles (
              id,
              name,
              avatar
            )
          ),
          player2:users!player2_id (
            id,
            username,
            profiles (
              id,
              name,
              avatar
            )
          )
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

  static async registerPlayer(tournament_id: string, user_id: string) {
    try {
      // Get tournament info with participants
      const { data: tournament } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants (
            id,
            user_id,
            score,
            matches_played,
            status,
            users!tournament_participants_user_id_fkey (
              id,
              username,
              profiles (
                id,
                name,
                avatar
              )
            )
          )
        `)
        .eq('id', tournament_id)
        .single();

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Check if tournament is in registration phase
      if (tournament.status !== 'registration') {
        throw new Error('Tournament is not accepting registrations');
      }

      // Check if player is already registered
      const isRegistered = tournament.tournament_participants?.some(
        (p: TournamentParticipant) => p.user_id === user_id
      );

      if (isRegistered) {
        throw new Error('Already registered for this tournament');
      }

      // Register player
      const { error: registrationError } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id,
          user_id,
          score: 0,
          matches_played: 0,
          status: 'registered',
          joined_at: new Date().toISOString()
        });

      if (registrationError) throw registrationError;

      // Check if tournament should start
      const currentParticipants = (tournament.tournament_participants?.length || 0) + 1;
      const shouldStart = currentParticipants >= tournament.maxPlayers || 
        (new Date(tournament.start_date) <= new Date() && currentParticipants >= 2);

      if (shouldStart) {
        await this.generateBrackets(tournament_id);
      }

      return true;
    } catch (error) {
      console.error('Failed to register player:', error);
      throw error;
    }
  }

  static async generateBrackets(tournament_id: string) {
    try {
      // Get tournament and participants
      const { data: tournament } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_participants (
            id,
            user_id,
            score,
            matches_played,
            status,
            users!tournament_participants_user_id_fkey (
              id,
              username,
              profiles (
                id,
                name,
                avatar
              )
            )
          )
        `)
        .eq('id', tournament_id)
        .single();

      if (!tournament) throw new Error('Tournament not found');

      const participants = tournament.tournament_participants;
      if (!participants || participants.length < 2) {
        throw new Error('Not enough participants to generate brackets');
      }

      // Shuffle participants for random seeding
      const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5);

      // Create matches for the first round
      const matches = [];
      for (let i = 0; i < shuffledParticipants.length - 1; i += 2) {
        matches.push({
          tournament_id,
          round: 1,
          player1_id: shuffledParticipants[i].user_id,
          player2_id: shuffledParticipants[i + 1].user_id,
          status: 'ready',
          player1_score: 0,
          player2_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // If there's an odd number of players, add the last player to the next round
      if (shuffledParticipants.length % 2 !== 0) {
        const lastPlayer = shuffledParticipants[shuffledParticipants.length - 1];
        matches.push({
          tournament_id,
          round: 1,
          player1_id: lastPlayer.user_id,
          player2_id: null,
          status: 'ready',
          player1_score: 0,
          player2_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
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

  static async updateStatus(tournament_id: string, status: string) {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', tournament_id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to update tournament status:', error);
      throw error;
    }
  }

  static async startMatch(match_id: string, user_id: string) {
    try {
      const { error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'in_progress',
          start_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', match_id)
        .eq('status', 'ready')
        .or(`player1_id.eq.${user_id},player2_id.eq.${user_id}`);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to start match:', error);
      throw error;
    }
  }
}

export default TournamentService; 