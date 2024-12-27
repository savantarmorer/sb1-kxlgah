import { supabase } from '../lib/supabase';
import { BATTLE_CONFIG } from '../config/battleConfig';
import type { Player } from '../types/battle';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MatchmakingQueue {
  userId: string;
  rating: number;
  level: number;
  joinedAt: number;
  preferences?: {
    mode?: 'casual' | 'ranked';
    category?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  }
}

interface MatchmakingState {
  status: 'searching' | 'matched' | 'ready' | 'error';
  matchId?: string;
  opponent?: Player;
  error?: string;
}

export class LiveMatchmakingService {
  private static channel: RealtimeChannel;
  private static queueTimeout = 60000; // 60 seconds timeout
  private static matchStateListeners: Map<string, (state: MatchmakingState) => void> = new Map();
  private static activeMatches: Map<string, { player1: string; player2: string }> = new Map();
  
  /**
   * Join the matchmaking queue
   */
  static async joinQueue(
    player: Player, 
    preferences?: MatchmakingQueue['preferences'],
    onStateChange?: (state: MatchmakingState) => void
  ): Promise<void> {
    try {
      console.log('[Matchmaking] Player joining queue:', player.id, preferences);
      
      // Store the state change listener
      if (onStateChange) {
        this.matchStateListeners.set(player.id, onStateChange);
      }

      const queueEntry: MatchmakingQueue = {
        userId: player.id,
        rating: player.rating,
        level: player.level,
        joinedAt: Date.now(),
        preferences
      };

      // Create and join the matchmaking channel
      this.channel = supabase.channel('matchmaking', {
        config: {
          presence: {
            key: player.id,
          },
        },
      });

      // Set up channel listeners
      await this.channel
        .on('presence', { event: 'sync' }, () => {
          const presences = this.channel.presenceState();
          console.log('[Matchmaking] Queue sync event received:', {
            totalPresences: Object.keys(presences).length,
            presenceState: presences
          });
          
          // Convert presence data to queue entries
          const players = Object.values(presences)
            .flat()
            .map(p => p as unknown as MatchmakingQueue)
            .filter(p => p && p.userId); // Filter out invalid entries
            
          this.handleQueueSync(players);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('[Matchmaking] Join event received:', {
            newPresences,
            currentState: this.channel.presenceState()
          });
          
          // Convert new presences to queue entries
          const players = newPresences
            .map(p => p as unknown as MatchmakingQueue)
            .filter(p => p && p.userId); // Filter out invalid entries
            
          this.handlePlayerJoin(players);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('[Matchmaking] Leave event received:', {
            leftPresences,
            currentState: this.channel.presenceState()
          });
          
          // Get remaining players after leave
          const players = Object.values(this.channel.presenceState())
            .flat()
            .map(p => p as unknown as MatchmakingQueue)
            .filter(p => p && p.userId); // Filter out invalid entries
            
          this.handleQueueSync(players);
        })
        .on('broadcast', { event: 'match_found' }, ({ payload }) => {
          console.log('[Matchmaking] Match found broadcast received:', payload);
          this.handleMatchFound(payload);
        })
        .subscribe(async (status) => {
          console.log('[Matchmaking] Channel subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            const trackResult = await this.channel.track(queueEntry);
            console.log('[Matchmaking] Player tracked in queue:', {
              player: player.id,
              result: trackResult,
              currentState: this.channel.presenceState()
            });
            
            this.notifyStateChange(player.id, { status: 'searching' });
          }
        });

      // Set up queue timeout
      setTimeout(() => this.handleQueueTimeout(player.id), this.queueTimeout);

    } catch (error) {
      console.error('[Matchmaking] Error joining queue:', error);
      this.notifyStateChange(player.id, { 
        status: 'error', 
        error: 'Failed to join matchmaking queue' 
      });
      throw error;
    }
  }

  /**
   * Leave the matchmaking queue
   */
  static async leaveQueue(userId: string): Promise<void> {
    try {
      console.log('[Matchmaking] Player leaving queue:', userId);
      if (this.channel) {
        await this.channel.untrack();
        await this.channel.unsubscribe();
        console.log('[Matchmaking] Successfully left queue');
      }
      this.matchStateListeners.delete(userId);
    } catch (error) {
      console.error('[Matchmaking] Error leaving queue:', error);
    }
  }

  /**
   * Handle queue synchronization
   */
  private static async handleQueueSync(players: MatchmakingQueue[]): Promise<void> {
    console.log('[Matchmaking] Queue sync - Processing players:', {
      totalPlayers: players.length,
      players: players.map(p => ({
        id: p.userId,
        rating: p.rating,
        joinedAt: new Date(p.joinedAt).toISOString(),
        preferences: p.preferences
      }))
    });

    if (players.length >= 2) {
      console.log('[Matchmaking] Multiple players in queue, attempting to match');
      await this.matchPlayers(players);
    } else {
      console.log('[Matchmaking] Not enough players in queue:', players.length);
    }
  }

  /**
   * Handle new player joining the queue
   */
  private static async handlePlayerJoin(players: MatchmakingQueue[]): Promise<void> {
    console.log('[Matchmaking] New players joined:', {
      totalPlayers: players.length,
      newPlayers: players.map(p => ({
        id: p.userId,
        rating: p.rating,
        joinedAt: new Date(p.joinedAt).toISOString(),
        preferences: p.preferences
      }))
    });

    // Get all current players in queue
    const presences = this.channel.presenceState();
    const allPlayers = Object.values(presences)
      .flat()
      .map(p => p as unknown as MatchmakingQueue);

    console.log('[Matchmaking] Total players in queue after join:', {
      count: allPlayers.length,
      players: allPlayers.map(p => ({
        id: p.userId,
        joinedAt: new Date(p.joinedAt).toISOString()
      }))
    });

    if (allPlayers.length >= 2) {
      console.log('[Matchmaking] Sufficient players for matching, attempting to match');
      await this.matchPlayers(allPlayers);
    }
  }

  /**
   * Match players based on criteria
   */
  private static async matchPlayers(players: MatchmakingQueue[]): Promise<void> {
    console.log('[Matchmaking] Starting match process with players:', {
      totalPlayers: players.length,
      players: players.map(p => ({
        id: p.userId,
        rating: p.rating,
        joinedAt: new Date(p.joinedAt).toISOString()
      }))
    });

    const sortedPlayers = players.sort((a, b) => a.joinedAt - b.joinedAt);
    
    for (let i = 0; i < sortedPlayers.length - 1; i++) {
      const player1 = sortedPlayers[i];
      const player2 = sortedPlayers[i + 1];

      const compatibility = this.arePlayersCompatible(player1, player2);
      console.log('[Matchmaking] Checking pair compatibility:', {
        player1: {
          id: player1.userId,
          rating: player1.rating,
          preferences: player1.preferences
        },
        player2: {
          id: player2.userId,
          rating: player2.rating,
          preferences: player2.preferences
        },
        compatible: compatibility
      });

      if (compatibility) {
        const matchId = await this.createMatch(player1, player2);
        
        if (matchId) {
          console.log('[Matchmaking] Match created successfully:', {
            matchId,
            player1: player1.userId,
            player2: player2.userId
          });

          // Broadcast match found event to both players
          await this.channel.send({
            type: 'broadcast',
            event: 'match_found',
            payload: {
              matchId,
              players: [player1.userId, player2.userId]
            }
          });

          // Break after creating a match to avoid matching the same players again
          break;
        }
      }
    }
  }

  /**
   * Check if players are compatible for matching
   */
  private static arePlayersCompatible(player1: MatchmakingQueue, player2: MatchmakingQueue): boolean {
    // Don't match the same player
    if (player1.userId === player2.userId) return false;

    // Don't match players already in a match
    if (this.isPlayerInMatch(player1.userId) || this.isPlayerInMatch(player2.userId)) {
      return false;
    }

    const ratingDiff = Math.abs(player1.rating - player2.rating);
    const timeInQueue = Date.now() - Math.min(player1.joinedAt, player2.joinedAt);
    
    // Expand matching criteria based on time in queue
    const maxRatingDiff = 200 + Math.floor(timeInQueue / 10000) * 50; // Increase by 50 every 10 seconds

    // Check preferences match
    const preferencesMatch = 
      (!player1.preferences?.mode || !player2.preferences?.mode || player1.preferences.mode === player2.preferences.mode) &&
      (!player1.preferences?.category || !player2.preferences?.category || player1.preferences.category === player2.preferences.category) &&
      (!player1.preferences?.difficulty || !player2.preferences?.difficulty || player1.preferences.difficulty === player2.preferences.difficulty);

    const isCompatible = 
      ratingDiff <= maxRatingDiff &&
      preferencesMatch;

    console.log('[Matchmaking] Compatibility check:', {
      player1: player1.userId,
      player2: player2.userId,
      ratingDiff,
      timeInQueue,
      maxRatingDiff,
      preferencesMatch,
      isCompatible
    });

    return isCompatible;
  }

  /**
   * Create a match between two players
   */
  private static async createMatch(player1: MatchmakingQueue, player2: MatchmakingQueue): Promise<string | null> {
    try {
      const matchId = `match_${Date.now()}`;
      
      // Create battle match records
      const { error } = await supabase
        .from('battle_matches')
        .insert([
          {
            match_id: matchId,
            user_id: player1.userId,
            opponent_id: player2.userId,
            status: 'matched',
            created_at: new Date().toISOString()
          },
          {
            match_id: matchId,
            user_id: player2.userId,
            opponent_id: player1.userId,
            status: 'matched',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      // Store active match
      this.activeMatches.set(matchId, {
        player1: player1.userId,
        player2: player2.userId
      });

      // Update state for both players
      this.notifyStateChange(player1.userId, {
        status: 'matched',
        matchId,
        opponent: await this.fetchPlayerDetails(player2.userId)
      });

      this.notifyStateChange(player2.userId, {
        status: 'matched',
        matchId,
        opponent: await this.fetchPlayerDetails(player1.userId)
      });

      return matchId;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  }

  /**
   * Handle match found event
   */
  private static async handleMatchFound(payload: { matchId: string; players: string[] }): Promise<void> {
    const { matchId, players } = payload;
    
    try {
      // Remove players from queue
      await Promise.all(players.map(playerId => this.leaveQueue(playerId)));
      
      // Generate shared battle questions
      const { data: questions, error: questionsError } = await supabase
        .rpc('get_random_battle_questions', { 
          num_questions: BATTLE_CONFIG.questions_per_battle,
          question_category: 'general'  // TODO: Use matched preferences
        });

      if (questionsError) throw questionsError;

      // Create battle room channel with shared state
      const battleChannel = supabase.channel(`battle:${matchId}`, {
        config: {
          presence: {
            key: matchId,
          },
        },
      });

      // Initialize battle state in the database
      const { error: battleError } = await supabase
        .from('battle_matches')
        .update({
          status: 'in_progress',
          metadata: {
            questions,
            current_question: 0,
            player_states: {
              [players[0]]: { answered: false, answer: null, score: 0 },
              [players[1]]: { answered: false, answer: null, score: 0 }
            },
            started_at: new Date().toISOString(),
            time_per_question: BATTLE_CONFIG.time_per_question
          }
        })
        .eq('match_id', matchId);

      if (battleError) throw battleError;

      // Set up battle channel listeners
      await battleChannel
        .on('presence', { event: 'sync' }, () => {
          const state = battleChannel.presenceState();
          console.log('[Battle] State sync:', state);
        })
        .on('broadcast', { event: 'player_answer' }, ({ payload: { playerId, answer, timeLeft } }) => {
          this.handlePlayerAnswer(matchId, playerId, answer, timeLeft);
        })
        .on('broadcast', { event: 'next_question' }, () => {
          this.handleNextQuestion(matchId);
        })
        .subscribe();

    } catch (error) {
      console.error('[Battle] Error setting up battle:', error);
      // Notify players of error
      players.forEach(playerId => {
        this.notifyStateChange(playerId, {
          status: 'error',
          error: 'Failed to start battle. Please try again.'
        });
      });
    }
  }

  /**
   * Handle player answering a question
   */
  private static async handlePlayerAnswer(
    matchId: string,
    playerId: string,
    answer: string,
    timeLeft: number
  ): Promise<void> {
    try {
      // Get current battle state
      const { data: battle, error: battleError } = await supabase
        .from('battle_matches')
        .select('metadata')
        .eq('match_id', matchId)
        .single();

      if (battleError) throw battleError;

      const metadata = battle.metadata;
      const currentQuestion = metadata.questions[metadata.current_question];
      const isCorrect = answer === currentQuestion.correct_answer;
      
      // Calculate score based on time left and correctness
      const score = isCorrect ? Math.ceil(timeLeft * 100 / BATTLE_CONFIG.time_per_question) : 0;

      // Update player state
      metadata.player_states[playerId] = {
        answered: true,
        answer,
        score: metadata.player_states[playerId].score + score
      };

      // Check if both players have answered
      const allAnswered = Object.values(metadata.player_states).every((state: any) => state.answered);

      // Update battle state
      const { error: updateError } = await supabase
        .from('battle_matches')
        .update({ metadata })
        .eq('match_id', matchId);

      if (updateError) throw updateError;

      // If both players have answered, broadcast results and prepare for next question
      if (allAnswered) {
        await this.channel.send({
          type: 'broadcast',
          event: 'question_results',
          payload: {
            matchId,
            currentQuestion,
            playerStates: metadata.player_states
          }
        });

        // Wait for results display before moving to next question
        setTimeout(() => {
          this.handleNextQuestion(matchId);
        }, 3000); // Show results for 3 seconds
      }

    } catch (error) {
      console.error('[Battle] Error handling player answer:', error);
    }
  }

  /**
   * Handle transitioning to the next question
   */
  private static async handleNextQuestion(matchId: string): Promise<void> {
    try {
      // Get current battle state
      const { data: battle, error: battleError } = await supabase
        .from('battle_matches')
        .select('metadata')
        .eq('match_id', matchId)
        .single();

      if (battleError) throw battleError;

      const metadata = battle.metadata;
      const nextQuestionIndex = metadata.current_question + 1;

      // Check if battle is complete
      if (nextQuestionIndex >= metadata.questions.length) {
        await this.handleBattleComplete(matchId, metadata);
        return;
      }

      // Reset player states for next question
      Object.keys(metadata.player_states).forEach(playerId => {
        metadata.player_states[playerId].answered = false;
        metadata.player_states[playerId].answer = null;
      });

      metadata.current_question = nextQuestionIndex;

      // Update battle state
      const { error: updateError } = await supabase
        .from('battle_matches')
        .update({ metadata })
        .eq('match_id', matchId);

      if (updateError) throw updateError;

      // Broadcast next question event
      await this.channel.send({
        type: 'broadcast',
        event: 'next_question',
        payload: {
          matchId,
          questionIndex: nextQuestionIndex
        }
      });

    } catch (error) {
      console.error('[Battle] Error transitioning to next question:', error);
    }
  }

  /**
   * Handle battle completion
   */
  private static async handleBattleComplete(matchId: string, metadata: any): Promise<void> {
    try {
      // Calculate final scores and determine winner
      const playerStates = metadata.player_states;
      const [player1, player2] = Object.entries(playerStates) as [string, { score: number }][];
      const winner = player1[1].score > player2[1].score ? player1[0] : 
                    player2[1].score > player1[1].score ? player2[0] : null;

      // Update battle status
      const { error: updateError } = await supabase
        .from('battle_matches')
        .update({ 
          status: 'completed',
          metadata: {
            ...metadata,
            completed_at: new Date().toISOString(),
            winner
          }
        })
        .eq('match_id', matchId);

      if (updateError) throw updateError;

      // Broadcast battle complete event
      await this.channel.send({
        type: 'broadcast',
        event: 'battle_complete',
        payload: {
          matchId,
          winner,
          finalScores: playerStates
        }
      });

    } catch (error) {
      console.error('[Battle] Error completing battle:', error);
    }
  }

  /**
   * Handle queue timeout
   */
  private static async handleQueueTimeout(userId: string): Promise<void> {
    const presence = this.channel.presenceState();
    const isStillInQueue = Object.values(presence)
      .flat()
      .some((p: any) => p.userId === userId);

    if (isStillInQueue) {
      this.notifyStateChange(userId, {
        status: 'error',
        error: 'Matchmaking timeout. Please try again.'
      });
      await this.leaveQueue(userId);
    }
  }

  /**
   * Notify state change to listener
   */
  private static notifyStateChange(userId: string, state: MatchmakingState): void {
    const listener = this.matchStateListeners.get(userId);
    if (listener) {
      listener(state);
    }
  }

  /**
   * Check if player is in an active match
   */
  private static isPlayerInMatch(userId: string): boolean {
    return Array.from(this.activeMatches.values()).some(
      match => match.player1 === userId || match.player2 === userId
    );
  }

  /**
   * Fetch player details
   */
  private static async fetchPlayerDetails(userId: string): Promise<Player | undefined> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, level, avatar_url, streak')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        level: data.level || 1,
        rating: 1000, // Default rating for now
        avatar_url: data.avatar_url,
        streak: data.streak || 0
      };
    } catch (error) {
      console.error('Error fetching player details:', error);
      return undefined;
    }
  }
}
