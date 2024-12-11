import { NotificationPayload } from '../types/notifications';
import { Tournament, TournamentMatch } from '../types/tournament';
import { supabase } from '../lib/supabase';

interface TournamentMatchWithPlayers extends TournamentMatch {
  player1: {
    id: string;
  };
  player2: {
    id: string;
  };
  score: number;
}

export class TournamentNotificationService {
  static async notifyMatchResult(match: TournamentMatchWithPlayers): Promise<void> {
    try {
      const winner = match.winner_id === match.player1.id ? match.player1 : match.player2;
      const loser = match.winner_id === match.player1.id ? match.player2 : match.player1;

      // Notify winner
      await this.sendNotification({
        type: 'match',
        title: 'Match Victory!',
        message: 'Congratulations! You won the match!',
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
        message: 'Better luck next time!',
        data: {
          match_id: match.id,
          tournament_id: match.tournament_id,
          score: match.score
        }
      }, loser.id);
    } catch (error) {
      console.error('Error sending match result notifications:', error);
    }
  }

  static async notifyMatchCreated(match: TournamentMatchWithPlayers): Promise<void> {
    try {
      const notification: NotificationPayload = {
        type: 'match',
        title: 'New Match',
        message: 'Your next match is ready!',
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

  static async notifyTournamentWinner(tournament: Tournament, winner_id: string): Promise<void> {
    try {
      await this.sendNotification({
        type: 'tournament',
        title: 'Tournament Victory!',
        message: `Congratulations! You won the tournament ${tournament.name}!`,
        data: {
          tournament_id: tournament.id,
          rewards: tournament.rewards
        }
      }, winner_id);
    } catch (error) {
      console.error('Error sending tournament winner notification:', error);
    }
  }

  static async notifyTournamentEnded(tournament: Tournament, participant_ids: string[]): Promise<void> {
    try {
      await Promise.all(
        participant_ids.map(id =>
          this.sendNotification({
              type: 'tournament',
              title: 'Tournament Ended',
              message: `The tournament ${tournament.name} has ended.`,
              data: {
                tournament_id: tournament.id
              }
            }, id)
        )
      );
    } catch (error) {
      console.error('Error sending tournament end notifications:', error);
    }
  }

  private static async sendNotification(notification: NotificationPayload, user_id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }
} 