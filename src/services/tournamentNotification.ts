import { supabase } from '@/lib/supabase';
import { Tournament, TournamentMatch } from '@/types/tournament';
import { TournamentError } from '@/errors/TournamentError';

interface NotificationPayload {
  type: 'tournament' | 'match';
  title: string;
  message: string;
  data: any;
}

export class TournamentNotification {
  static async notifyMatchResult(match: TournamentMatch): Promise<void> {
    try {
      const winner = match.winner_id === match.player1.id ? match.player1 : match.player2;
      const loser = match.winner_id === match.player1.id ? match.player2 : match.player1;

      // Notify winner
      await this.sendNotification({
        type: 'match',
        title: 'Match Victory!',
        message: `You won the match against ${loser.name}!`,
        data: {
          match_id: match.id,
          tournament_id: match.tournament_id,
          score: match.score
        }
      }, winner.id);

      // Notify loser
      await this.sendNotification({
        type: 'match',
        title: 'Match Result',
        message: `You lost the match against ${winner.name}.`,
        data: {
          match_id: match.id,
          tournament_id: match.tournament_id,
          score: match.score
        }
      }, loser.id);
    } catch (error) {
      console.error('Error sending match notifications:', error);
    }
  }

  static async notifyMatchCreated(match: TournamentMatch): Promise<void> {
    try {
      const notification = {
        type: 'match',
        title: 'New Match',
        message: 'Your next tournament match is ready!',
        data: {
          match_id: match.id,
          tournament_id: match.tournament_id
        }
      };

      await Promise.all([
        this.sendNotification(notification, match.player1.id),
        match.player2 && this.sendNotification(notification, match.player2.id)
      ]);
    } catch (error) {
      console.error('Error sending match creation notifications:', error);
    }
  }

  static async notifyTournamentEnd(tournament: Tournament, winner_id: string): Promise<void> {
    try {
      // Notify winner
      await this.sendNotification({
        type: 'tournament',
        title: 'Tournament Victory!',
        message: `Congratulations! You won the tournament ${tournament.title}!`,
        data: {
          tournament_id: tournament.id,
          rewards: tournament.rewards
        }
      }, winner_id);

      // Notify other participants
      const { data: participants } = await supabase
        .from('tournament_participants')
        .select('user_id')
        .eq('tournament_id', tournament.id)
        .neq('user_id', winner_id);

      if (participants) {
        await Promise.all(
          participants.map(p =>
            this.sendNotification({
              type: 'tournament',
              title: 'Tournament Ended',
              message: `The tournament ${tournament.title} has ended.`,
              data: {
                tournament_id: tournament.id
              }
            }, p.user_id)
          )
        );
      }
    } catch (error) {
      console.error('Error sending tournament end notifications:', error);
    }
  }

  static async notifyTournamentStart(tournament_id: string): Promise<void> {
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('user_id')
      .eq('tournament_id', tournament_id);

    if (!participants) return;

    const notifications = participants.map(p => ({
      user_id: p.user_id,
      type: 'tournament_start',
      title: 'Tournament Starting',
      message: 'Your tournament is about to begin!',
      data: { tournament_id }
    }));

    await supabase.from('notifications').insert(notifications);
  }

  static async notifyNextRound(tournament_id: string, round: number): Promise<void> {
    const { data: matches } = await supabase
      .from('tournament_matches')
      .select('player1_id, player2_id')
      .eq('tournament_id', tournament_id)
      .eq('round', round);

    if (!matches) return;

    const players = matches.flatMap(m => [m.player1_id, m.player2_id]);

    const notifications = players.map(player_id => ({
      user_id: player_id,
      type: 'next_round',
      title: 'Next Round Starting',
      message: `Round ${round} is beginning!`,
      data: { tournament_id, round }
    }));

    await supabase.from('notifications').insert(notifications);
  }

  private static async sendNotification(
    notification: NotificationPayload,
    user_id: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: false
        });

      if (error) throw error;

      // Send real-time notification
      await supabase
        .channel('notifications')
        .send({
          type: 'broadcast',
          event: 'notification',
          payload: {
            user_id,
            ...notification
          }
        });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new TournamentError('Failed to send notification');
    }
  }
} 