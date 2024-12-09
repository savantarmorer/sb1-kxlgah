import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import React, { useCallback, ForwardedRef } from 'react';

type SpringTransition = {
  type: 'spring';
  stiffness: number;
  damping: number;
};

type TweenTransition = {
  type: 'tween';
  duration: number;
  times?: number[];
};

type TransitionConfig = SpringTransition | TweenTransition;

interface AnimationVariant {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: TransitionConfig;
}

type AnimationDefinition = AnimationVariant | ((params: any) => AnimationVariant);

/**
 * Animações compartilhadas para componentes do torneio
 */
export const tournamentAnimations: Record<string, AnimationDefinition> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { type: 'tween', duration: 0.3 }
  },

  slideIn: (direction: 'left' | 'right' = 'right'): AnimationVariant => ({
    initial: { 
      x: direction === 'right' ? 100 : -100,
      opacity: 0 
    },
    animate: { 
      x: 0,
      opacity: 1 
    },
    exit: { 
      x: direction === 'right' ? -100 : 100,
      opacity: 0 
    },
    transition: { 
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }),

  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  },

  victory: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: [1, 1.1, 1],
      opacity: 1
    },
    transition: {
      type: 'tween',
      duration: 0.5,
      times: [0, 0.5, 1]
    }
  },

  roundTransition: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { type: 'tween', duration: 0.4 }
  },

  scoreUpdate: {
    initial: { scale: 1 },
    animate: { 
      scale: [1, 1.2, 1]
    },
    transition: {
      type: 'tween',
      duration: 0.3,
      times: [0, 0.5, 1]
    }
  }
};

/**
 * Hook para gerenciar animações de partículas
 */
export function useParticleEffect() {
  const showParticles = useCallback((duration: number = 1000) => {
    // Implementation for particle effects
    // This could be integrated with a particle library like tsparticles
    console.log('Showing particles for', duration, 'ms');
  }, []);

  return { showParticles };
}

interface MotionTransitionProps {
  children: React.ReactNode;
  animation?: keyof typeof tournamentAnimations;
  customAnimation?: AnimationVariant;
  className?: string;
}

type MotionDivProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> & {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: TransitionConfig;
};

/**
 * Componente de transição entre estados
 */
export const MotionTransition = React.forwardRef<HTMLDivElement, MotionTransitionProps>(
  (props: MotionTransitionProps, ref: ForwardedRef<HTMLDivElement>) => {
    const { children, animation = 'fadeIn', customAnimation, className } = props;
    
    const animationDef = tournamentAnimations[animation];
    const selectedAnimation = customAnimation || 
      (typeof animationDef === 'function' ? animationDef({}) : animationDef);

    const motionProps: HTMLMotionProps<'div'> = {
      initial: selectedAnimation.initial,
      animate: selectedAnimation.animate,
      exit: selectedAnimation.exit,
      transition: selectedAnimation.transition,
      className
    };

    return React.createElement(
      motion.div,
      { ...motionProps, ref },
      children
    );
  }
);

MotionTransition.displayName = 'MotionTransition';