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

// Types
interface LootboxProps {
  rarity: string;
  isOpening: boolean;
  onOpenComplete: () => void;
}

// Main lootbox component
const LootboxModel: React.FC<LootboxProps> = ({ rarity, isOpening, onOpenComplete }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names } = useAnimations(animations, group);
  
  // Play the model's animation when opening
  useEffect(() => {
    if (isOpening) {
      // Log available animations
      console.log('Available animations:', names);
      
      // Play all animations (you might want to adjust this based on the actual animation names)
      names.forEach(name => {
        const action = actions[name];
        if (action) {
          action.reset().play();
          action.clampWhenFinished = true;
          action.loop = THREE.LoopOnce;
        }
      });
      
      // Call onOpenComplete when the animation ends
      const timeoutId = setTimeout(onOpenComplete, 2000); // Adjust timing based on your animation length
      return () => clearTimeout(timeoutId);
    }
  }, [isOpening, actions, names, onOpenComplete]);

  return (
    <group ref={group} scale={MODEL_SCALE}>
      <primitive object={scene} />
    </group>
  );
};

// Scene wrapper
export const LootboxScene: React.FC<LootboxProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 6, 15], fov: 50 }}> {/* Adjusted camera position for top-down angle */}
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