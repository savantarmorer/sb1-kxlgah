import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/Button';
import { FeedbackType, MatchFeedback, TournamentFeedback } from '@/types/tournament';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: FeedbackType;
  id: string;
}

export function FeedbackModal({ isOpen, onClose, type, id }: FeedbackModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [latencyRating, setLatencyRating] = useState(5);
  const [balanceRating, setBalanceRating] = useState(5);
  const [comments, setComments] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      if (type === 'match') {
        const feedback: MatchFeedback = {
          match_id: id,
          player_id: user.id,
          rating,
          latency_rating: latencyRating,
          balance_rating: balanceRating,
          comments,
          issues
        };
        
        const { error } = await supabase
          .from('match_feedback')
          .insert(feedback);
          
        if (error) throw error;
      } else {
        const feedback: TournamentFeedback = {
          tournament_id: id,
          player_id: user.id,
          overall_experience: rating,
          would_play_again: rating > 3,
          format_rating: balanceRating,
          suggestions: comments
        };
        
        const { error } = await supabase
          .from('tournament_feedback')
          .insert(feedback);
          
        if (error) throw error;
      }

      toast.success('Thank you for your feedback!');
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {type === 'match' ? 'Match Feedback' : 'Tournament Feedback'}
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {type === 'match' ? 'Overall Rating' : 'Overall Experience'}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {type === 'match' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Connection Quality
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={latencyRating}
                    onChange={(e) => setLatencyRating(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Match Balance
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={balanceRating}
                    onChange={(e) => setBalanceRating(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Issues Encountered
                  </label>
                  <div className="space-y-2">
                    {['lag', 'disconnect', 'unfair_matching', 'bugs'].map((issue) => (
                      <label key={issue} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={issues.includes(issue)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setIssues([...issues, issue]);
                            } else {
                              setIssues(issues.filter(i => i !== issue));
                            }
                          }}
                          className="mr-2"
                        />
                        {issue.charAt(0).toUpperCase() + issue.slice(1).replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {type === 'match' ? 'Additional Comments' : 'Suggestions'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700"
                rows={3}
                placeholder="Share your thoughts..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                Submit Feedback
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
} 