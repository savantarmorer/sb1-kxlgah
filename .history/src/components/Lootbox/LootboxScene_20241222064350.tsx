import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, useGLTF, Environment, Float, useAnimations, Sparkles as DreiSparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Gift, Sparkles } from 'lucide-react';
import * as THREE from 'three';

// Constants
const MODEL_PATH = '/images/items/loot_box.glb';
const MODEL_SCALE = 12;
const ANIMATION_DURATION = 4000; // 4 seconds total animation
const SPIN_START_SPEED = 0.2;
const SPIN_END_SPEED = 4;

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

// Enhanced glowing orb component
const GlowingOrb: React.FC<{ color: string; intensity?: number }> = ({ color, intensity = 2 }) => {
  const orbRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  
  useFrame((state) => {
    if (orbRef.current) {
      time.current += state.clock.getDelta();
      orbRef.current.rotation.y += 0.02;
      
      // Pulse the intensity
      const pulseIntensity = intensity * (1 + Math.sin(time.current * 4) * 0.3);
      if (orbRef.current.children[0] instanceof THREE.PointLight) {
        orbRef.current.children[0].intensity = pulseIntensity * 2;
      }
    }
  });

  return (
    <group ref={orbRef} position={[0, 0, 0]}>
      {/* Central orb with pulsing light */}
      <pointLight color={color} intensity={intensity * 2} distance={15} />
      <Sphere args={[0.2, 32, 32]}>
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </Sphere>
      
      {/* Outer glow layers */}
      {[0.3, 0.4, 0.5].map((size, i) => (
        <Sphere key={i} args={[size, 32, 32]}>
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.15 - i * 0.04} 
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
      ))}
      
      {/* Enhanced sparkles */}
      <DreiSparkles
        count={100}
        scale={3}
        size={6}
        speed={0.4}
        color={color}
      />
      
      {/* Rotating light rays */}
      {[...Array(12)].map((_, i) => (
        <group key={i} rotation={[0, (Math.PI * 2 * i) / 12, 0]}>
          <mesh position={[0.5, 0, 0]}>
            <boxGeometry args={[0.6, 0.02, 0.02]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={0.3}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
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
  const spinSpeed = useRef(SPIN_START_SPEED);
  const startTime = useRef<number | null>(null);
  
  // Handle spinning animation
  useFrame((state) => {
    if (isOpening && group.current) {
      if (startTime.current === null) {
        startTime.current = state.clock.getElapsedTime();
      }
      
      const elapsed = state.clock.getElapsedTime() - startTime.current;
      const progress = Math.min(elapsed / (ANIMATION_DURATION / 1000), 1);
      
      // Accelerate spin based on progress with smoother curve
      spinSpeed.current = SPIN_START_SPEED + (SPIN_END_SPEED - SPIN_START_SPEED) * Math.pow(progress, 3);
      group.current.rotation.y += spinSpeed.current * state.clock.getDelta();
    }
  });
  
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
      }, 500);
      
      setGlowColor(LEGENDARY_SEQUENCE[0]);
      return () => clearInterval(interval);
    } else if (isOpening) {
      setGlowColor(RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || RARITY_COLORS.common);
    }
  }, [rarity, isOpening]);
  
  // Play the model's animation when opening
  useEffect(() => {
    if (isOpening) {
      const animationDelay = rarity === 'legendary' ? 2000 : 0;
      
      setTimeout(() => {
        console.log('Available animations:', names);
        names.forEach(name => {
          const action = actions[name];
          if (action) {
            action.reset().play();
            action.clampWhenFinished = true;
            action.loop = THREE.LoopOnce;
            // Slow down the animation
            action.timeScale = 0.5;
          }
        });
      }, animationDelay);
      
      const timeoutId = setTimeout(onOpenComplete, animationDelay + ANIMATION_DURATION);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpening, actions, names, onOpenComplete, rarity]);

  return (
    <group ref={group} scale={MODEL_SCALE}>
      <primitive object={scene} />
      {glowColor && <GlowingOrb color={glowColor} intensity={3} />}
    </group>
  );
};

// Scene wrapper
export const LootboxScene: React.FC<LootboxProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 2, 4], fov: 50 }}>
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
            intensity={2.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

// Preload the model
useGLTF.preload(MODEL_PATH);

export default LootboxScene;