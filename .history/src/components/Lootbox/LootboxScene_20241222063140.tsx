import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, useGLTF, Environment, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Gift, Sparkles } from 'lucide-react';
import * as THREE from 'three';

// Constants
const MODEL_PATH = '/images/items/loot_box.glb';
const MODEL_SCALE = 12; // Quadrupled size

// Types
interface LootboxProps {
  rarity: string;
  isOpening: boolean;
  onOpenComplete: () => void;
}

// Custom hook for box opening animation
const useOpeningAnimation = (isOpening: boolean, onOpenComplete: () => void) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [lidRotation, setLidRotation] = useState(0);
  const [explosionParticles, setExplosionParticles] = useState<Array<{ position: THREE.Vector3; velocity: THREE.Vector3 }>>([]);
  
  useFrame((state, delta) => {
    if (isOpening) {
      // Accelerating rotation
      const acceleration = Math.min(state.clock.elapsedTime * 2, 5);
      setRotation(prev => ({
        x: prev.x,
        y: prev.y + delta * acceleration,
        z: prev.z
      }));
      
      // Lid opening animation
      if (lidRotation < Math.PI * 0.75) {
        setLidRotation(prev => prev + delta * 2);
        
        // Trigger explosion when lid is halfway open
        if (lidRotation > Math.PI * 0.3 && explosionParticles.length === 0) {
          const particles = Array.from({ length: 30 }, () => ({
            position: new THREE.Vector3(0, 0, 0),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              Math.random() * 2,
              (Math.random() - 0.5) * 2
            )
          }));
          setExplosionParticles(particles);
        }
      } else {
        onOpenComplete();
      }
    }
    
    // Update explosion particles
    if (explosionParticles.length > 0) {
      setExplosionParticles(prev => 
        prev.map(particle => ({
          position: particle.position.add(particle.velocity.multiplyScalar(delta)),
          velocity: particle.velocity.multiplyScalar(0.98) // Add slight drag
        }))
      );
    }
  });
  
  return { rotation, lidRotation, explosionParticles };
};

// Explosion particles component
const ExplosionParticles = ({ particles }: { particles: Array<{ position: THREE.Vector3 }> }) => {
  return (
    <>
      {particles.map((particle, i) => (
        <Sphere
          key={i}
          position={[particle.position.x, particle.position.y, particle.position.z]}
          scale={0.2} // Increased particle size to match larger model
        >
          <meshStandardMaterial emissive="#ffff00" emissiveIntensity={2} />
        </Sphere>
      ))}
    </>
  );
};

// Main lootbox component
const LootboxModel: React.FC<LootboxProps> = ({ rarity, isOpening, onOpenComplete }) => {
  const { rotation, lidRotation, explosionParticles } = useOpeningAnimation(isOpening, onOpenComplete);
  const { scene } = useGLTF(MODEL_PATH);

  return (
    <group rotation={[rotation.x, rotation.y, rotation.z]} scale={MODEL_SCALE}>
      <primitive object={scene} />
      
      {/* Explosion particles */}
      <ExplosionParticles particles={explosionParticles} />
    </group>
  );
};

// Scene wrapper
export const LootboxScene: React.FC<LootboxProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 16], fov: 50 }}> {/* Adjusted camera position for larger model */}
        <ambientLight intensity={0.8} /> {/* Increased ambient light for better visibility */}
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