import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, useGLTF, Environment, Float, useAnimations } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Gift, Sparkles } from 'lucide-react';
import * as THREE from 'three';

// Constants
const MODEL_PATH = '/images/items/loot_box.glb';
const MODEL_SCALE = 12;

// Rarity colors
const RARITY_COLORS = {
  common: '#ffffff',
  rare: '#4287f5',
  epic: '#9b4dff',
  legendary: '#ffd700'
};

// Legendary sequence colors
const LEGENDARY_SEQUENCE = [
  '#00ff00', // green
  '#4287f5', // blue
  '#9b4dff', // purple
  '#ffd700'  // golden
];

// Types
interface LootboxProps {
  rarity: string;
  isOpening: boolean;
  onOpenComplete: () => void;
}

// Glowing orb component
const GlowingOrb: React.FC<{ color: string; intensity?: number }> = ({ color, intensity = 2 }) => {
  return (
    <group position={[0, 0, 0]}>
      <pointLight color={color} intensity={intensity} distance={10} />
      <Sphere args={[0.2, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </Sphere>
    </group>
  );
};

// Main lootbox component
const LootboxModel: React.FC<LootboxProps> = ({ rarity, isOpening, onOpenComplete }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names } = useAnimations(animations, group);
  const [glowColor, setGlowColor] = useState<string | null>(null);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  
  // Handle legendary sequence
  useEffect(() => {
    if (rarity === 'legendary' && isOpening && sequenceIndex < LEGENDARY_SEQUENCE.length) {
      const interval = setInterval(() => {
        setSequenceIndex(prev => {
          if (prev < LEGENDARY_SEQUENCE.length - 1) {
            setGlowColor(LEGENDARY_SEQUENCE[prev + 1]);
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 500); // Change color every 500ms
      
      setGlowColor(LEGENDARY_SEQUENCE[0]);
      return () => clearInterval(interval);
    } else if (isOpening) {
      setGlowColor(RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common);
    }
  }, [rarity, isOpening]);
  
  // Play the model's animation when opening
  useEffect(() => {
    if (isOpening) {
      // For legendary items, wait for the color sequence
      const animationDelay = rarity === 'legendary' ? 2000 : 0;
      
      setTimeout(() => {
        console.log('Available animations:', names);
        names.forEach(name => {
          const action = actions[name];
          if (action) {
            action.reset().play();
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
          }
        });
      }, animationDelay);
      
      // Call onOpenComplete when the animation ends
      const timeoutId = setTimeout(onOpenComplete, animationDelay + 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpening, actions, names, onOpenComplete, rarity]);

  return (
    <group ref={group} scale={MODEL_SCALE}>
      <primitive object={scene} />
      {glowColor && <GlowingOrb color={glowColor} />}
    </group>
  );
};

// Scene wrapper
export const LootboxScene: React.FC<LootboxProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 2, 5], fov: 50 }}> {/* Adjusted camera to be 3 times closer */}
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Float
          speed={2}
          rotationIntensity={0.5}
          floatIntensity={0.5}
          floatingRange={[-0.1, 0.1]}
        >
          <LootboxModel {...props} />
        </Float>
        
        <Environment preset="city" />
        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

// Preload the model
useGLTF.preload(MODEL_PATH);

export default LootboxScene;