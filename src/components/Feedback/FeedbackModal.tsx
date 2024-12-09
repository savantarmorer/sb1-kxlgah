import React from 'react';
import { Rating } from '../ui/Rating';
import { useTranslation } from '../hooks/useTranslation';
import { useFeedback } from '@/hooks/useFeedback';
import type { MatchFeedback, TournamentFeedback } from '@/types/tournament.TODO';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'match' | 'tournament';
  id: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  type,
  id
}) => {
  const { t } = useTranslation('feedback');
  const { submitFeedback, isSubmitting } = useFeedback();
  const [feedback, setFeedback] = React.useState({
    rating: 0,
    latency_rating: 0,
    balance_rating: 0,
    comments: '',
    issues: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'match') {
      await submitFeedback<MatchFeedback>({
        match_id: id,
        player_id: 'current_player_id', // TODO: Get from context
        ...feedback
      });
    } else {
      await submitFeedback<TournamentFeedback>({
        tournament_id: id,
        player_id: 'current_player_id', // TODO: Get from context
        overall_experience: feedback.rating,
        would_play_again: feedback.rating > 3,
        format_rating: feedback.balance_rating,
        suggestions: feedback.comments
      });
    }

    onClose();
  };

  return (
    <div className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-content">
        <h2>{t(`${type}.title`)}</h2>
        
        <form onSubmit={handleSubmit}>
          <Rating
            label={t(`${type}.overall_rating`)}
            value={feedback.rating}
            onChange={(value) => setFeedback(prev => ({ ...prev, rating: value }))}
          />

          {type === 'match' && (
            <>
              <Rating
                label={t('match.latency_rating')}
                value={feedback.latency_rating}
                onChange={(value) => setFeedback(prev => ({ ...prev, latency_rating: value }))}
              />
              
              <Rating
                label={t('match.balance_rating')}
                value={feedback.balance_rating}
                onChange={(value) => setFeedback(prev => ({ ...prev, balance_rating: value }))}
              />

              <div className="issues-checklist">
                {['lag', 'bugs', 'balance', 'other'].map(issue => (
                  <label key={issue}>
                    <input
                      type="checkbox"
                      checked={feedback.issues.includes(issue)}
                      onChange={(e) => {
                        setFeedback(prev => ({
                          ...prev,
                          issues: e.target.checked 
                            ? [...prev.issues, issue]
                            : prev.issues.filter(i => i !== issue)
                        }));
                      }}
                    />
                    {t(`issues.${issue}`)}
                  </label>
                ))}
              </div>
            </>
          )}

          <textarea
            value={feedback.comments}
            onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
            placeholder={t(`${type}.comments_placeholder`)}
            rows={4}
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.submitting') : t('common.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 