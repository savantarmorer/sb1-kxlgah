export const keyframes = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  slideInRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideOutRight: {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(100%)' },
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideOutLeft: {
    from: { transform: 'translateX(0)' },
    to: { transform: 'translateX(-100%)' },
  },
  slideInUp: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideOutUp: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(-100%)' },
  },
  slideInDown: {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideOutDown: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(100%)' },
  },
  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0.95)', opacity: 0 },
  },
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  pulse: {
    '0%, 100%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
  },
  gradientBg1: {
    '0%, 100%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
  },
  gradientBg2: {
    '0%, 100%': { backgroundPosition: '100% 0%' },
    '50%': { backgroundPosition: '0% 100%' },
  },
} as const;

export const animations = {
  // Timing functions
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Duration presets
  duration: {
    fastest: '100ms',
    faster: '150ms',
    fast: '200ms',
    normal: '300ms',
    slow: '400ms',
    slower: '500ms',
    slowest: '700ms',
  },

  // Animation presets
  fade: {
    in: {
      animation: `${keyframes.fadeIn} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    out: {
      animation: `${keyframes.fadeOut} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
  },

  slide: {
    inRight: {
      animation: `${keyframes.slideInRight} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    outRight: {
      animation: `${keyframes.slideOutRight} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    inLeft: {
      animation: `${keyframes.slideInLeft} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    outLeft: {
      animation: `${keyframes.slideOutLeft} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    inUp: {
      animation: `${keyframes.slideInUp} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    outUp: {
      animation: `${keyframes.slideOutUp} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    inDown: {
      animation: `${keyframes.slideInDown} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    outDown: {
      animation: `${keyframes.slideOutDown} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
  },

  scale: {
    in: {
      animation: `${keyframes.scaleIn} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    out: {
      animation: `${keyframes.scaleOut} 300ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
  },

  // Utility animations
  spin: {
    animation: `${keyframes.spin} 1s linear infinite`,
  },
  pulse: {
    animation: `${keyframes.pulse} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
  },
  gradient: {
    animation: `${keyframes.gradientBg1} 15s ease infinite`,
  },
} as const;

export type AnimationTokens = typeof animations; 