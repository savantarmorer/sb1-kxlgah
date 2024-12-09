import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MessageSquare } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

interface FeedbackButtonProps {
  type: 'match' | 'tournament';
  id: string;
  variant?: 'positive' | 'negative';
  className?: string;
}

export function FeedbackButton({ type, id, variant = 'positive', className }: FeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant === 'positive' ? 'primary' : 'danger'}
        onClick={() => setIsModalOpen(true)}
        className={className}
        leftIcon={<MessageSquare className="w-4 h-4" />}
      >
        Give Feedback
      </Button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={type}
        id={id}
      />
    </>
  );
} 