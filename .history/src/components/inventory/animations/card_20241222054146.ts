import { Variants } from 'framer-motion';

export const CardAnimation: Variants = {
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98
  },
  floating: {
    y: [0, -8, 0],
    rotateZ: [-2, 2, -2],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const ShineAnimation = {
  animate: {
    background: [
      "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.1) 55%, transparent 100%)",
      "linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.1) 55%, transparent 100%)"
    ],
    backgroundSize: ["200% 200%", "200% 200%"],
    backgroundPosition: ["-200% -200%", "200% 200%"]
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "linear"
  }
}; 