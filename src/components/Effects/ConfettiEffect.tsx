import React from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from '../../hooks/useWindowSize';

interface ConfettiEffectProps {
  run?: boolean;
  duration?: number;
  onComplete?: () => void;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  run = true,
  duration = 3000,
  onComplete
}) => {
  const { width, height } = useWindowSize();
  const [is_active, setis_active] = React.useState(run);

  React.useEffect(() => {
    if (run && duration) {
      setis_active(true);
      const timer = setTimeout(() => {
        setis_active(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [run, duration, onComplete]);

  if (!is_active) return null;

  return (
    <ReactConfetti
      width={width}
      height={height}
      numberOfPieces={200}
      recycle={false}
      colors={['#FFD700', '#FFA500', '#FF6347', '#98FB98', '#87CEEB']}
    />
  );
};
