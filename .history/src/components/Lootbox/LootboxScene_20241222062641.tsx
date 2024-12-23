import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, RoundedBox, MeshTransmissionMaterial, Environment, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Gift, Sparkles } from 'lucide-react';
import * as THREE from 'three';

// Constants for box dimensions
const BOX_WIDTH = 1.5;
const BOX_HEIGHT = 1;
const BOX_DEPTH = 1.2;
const BORDER_THICKNESS = 0.05;
const CORNER_SIZE = 0.1;

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
          scale={0.05}
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
  
  const rarityColors = {
    common: '#ffffff',
    rare: '#4287f5',
    epic: '#9b4dff',
    legendary: '#ffd700'
  };
  
  const boxColor = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  
  return (
    <group rotation={[rotation.x, rotation.y, rotation.z]}>
      {/* Main box body */}
      <RoundedBox args={[BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH]} radius={0.05}>
        <MeshTransmissionMaterial
          backside={false}
          samples={16}
          thickness={0.2}
          chromaticAberration={0.5}
          distortion={0.5}
          distortionScale={0.2}
          temporalDistortion={0.1}
          color={boxColor}
        />
      </RoundedBox>
      
      {/* Decorative borders */}
      {[...Array(4)].map((_, i) => (
        <Box
          key={`border-${i}`}
          position={[
            i < 2 ? (BOX_WIDTH / 2 - BORDER_THICKNESS / 2) * (i % 2 ? 1 : -1) : 0,
            0,
            i >= 2 ? (BOX_DEPTH / 2 - BORDER_THICKNESS / 2) * (i % 2 ? 1 : -1) : 0
          ]}
          args={[
            i < 2 ? BORDER_THICKNESS : BOX_WIDTH - BORDER_THICKNESS * 2,
            BOX_HEIGHT,
            i < 2 ? BOX_DEPTH - BORDER_THICKNESS * 2 : BORDER_THICKNESS
          ]}
        >
          <meshStandardMaterial color={boxColor} metalness={0.8} roughness={0.2} />
        </Box>
      ))}
      
      {/* Corner pieces */}
      {[...Array(8)].map((_, i) => (
        <Box
          key={`corner-${i}`}
          position={[
            (BOX_WIDTH / 2 - CORNER_SIZE / 2) * (i % 2 ? 1 : -1),
            (BOX_HEIGHT / 2 - CORNER_SIZE / 2) * (i < 4 ? 1 : -1),
            (BOX_DEPTH / 2 - CORNER_SIZE / 2) * (i % 4 < 2 ? 1 : -1)
          ]}
          args={[CORNER_SIZE, CORNER_SIZE, CORNER_SIZE]}
        >
          <meshStandardMaterial color={boxColor} metalness={0.9} roughness={0.1} />
        </Box>
      ))}
      
      {/* Lid */}
      <group position={[0, BOX_HEIGHT / 2, -BOX_DEPTH / 2]} rotation={[lidRotation, 0, 0]}>
        <RoundedBox
          args={[BOX_WIDTH, BOX_HEIGHT * 0.1, BOX_DEPTH]}
          position={[0, 0, BOX_DEPTH / 2]}
          radius={0.02}
        >
          <meshStandardMaterial color={boxColor} metalness={0.8} roughness={0.2} />
        </RoundedBox>
      </group>
      
      {/* Lock decoration */}
      <Box
        position={[0, 0, BOX_DEPTH / 2 - 0.01]}
        args={[0.2, 0.2, 0.02]}
      >
        <meshStandardMaterial color={boxColor} metalness={0.9} roughness={0.1} />
      </Box>
      
      {/* Explosion particles */}
      <ExplosionParticles particles={explosionParticles} />
    </group>
  );
};

// Scene wrapper
export const LootboxScene: React.FC<LootboxProps> = (props) => {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
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

export default LootboxScene;