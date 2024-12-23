import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, useGLTF } from '@react-three/drei';
import { Gift, Sparkles, Stars } from 'lucide-react';
import * as THREE from 'three';

interface LootboxSceneProps {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isOpening: boolean;
  onOpenComplete: () => void;
}

const rarityColors = {
  common: {
    primary: '#9CA3AF',
    secondary: '#4B5563',
    emissive: '#1F2937',
    particles: '#D1D5DB'
  },
  rare: {
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    emissive: '#1E40AF',
    particles: '#93C5FD'
  },
  epic: {
    primary: '#8B5CF6',
    secondary: '#6D28D9',
    emissive: '#5B21B6',
    particles: '#C4B5FD'
  },
  legendary: {
    primary: '#F59E0B',
    secondary: '#D97706',
    emissive: '#B45309',
    particles: '#FCD34D'
  }
};

function Particles({ color, count = 20, isOpening }: { color: string; count?: number; isOpening: boolean }) {
  const particles = useRef<THREE.Points>(null);
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 1;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = Math.sin(angle) * radius;
    positions[i * 3 + 2] = 0;
  }

  useFrame((state, delta) => {
    if (particles.current) {
      if (isOpening) {
        particles.current.scale.addScalar(delta * 2);
        particles.current.material.opacity -= delta;
      } else {
        particles.current.rotation.z += delta * 0.2;
      }
    }
  });

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        transparent
        opacity={0.8}
        color={color}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function LootboxModel({ 
  rarity, 
  animationStage, 
  colors 
}: { 
  rarity: keyof typeof rarityColors; 
  animationStage: number;
  colors: typeof rarityColors[keyof typeof rarityColors];
}) {
  const boxRef = useRef<THREE.Mesh>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (!boxRef.current || !lidRef.current) return;

    if (animationStage === 0) {
      // Idle animation
      boxRef.current.rotation.y += delta * 0.5;
      boxRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    } else if (animationStage === 1) {
      // Build up
      boxRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.05);
    } else if (animationStage === 2) {
      // Opening
      boxRef.current.rotation.y += delta * 4;
      if (lidRef.current) {
        lidRef.current.position.y += delta * 2;
        lidRef.current.rotation.x -= delta * 2;
      }
    } else if (animationStage === 3) {
      // Burst
      boxRef.current.scale.multiplyScalar(0.95);
      boxRef.current.position.y += delta;
    }
  });

  return (
    <group>
      {/* Base box */}
      <mesh ref={boxRef} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={colors.primary}
          metalness={0.8}
          roughness={0.2}
          emissive={colors.emissive}
          emissiveIntensity={animationStage > 0 ? 2 : 0.5}
        />
      </mesh>

      {/* Lid */}
      {animationStage < 3 && (
        <mesh
          ref={lidRef}
          position={[0, 0.5, 0]}
          castShadow
        >
          <boxGeometry args={[1.1, 0.1, 1.1]} />
          <meshStandardMaterial
            color={colors.secondary}
            metalness={0.8}
            roughness={0.2}
            emissive={colors.emissive}
            emissiveIntensity={animationStage > 0 ? 2 : 0.5}
          />
        </mesh>
      )}

      {/* Glow spheres */}
      {animationStage > 0 && (
        <>
          <Sphere args={[0.6, 16, 16]} position={[0, 0, 0]}>
            <meshBasicMaterial
              color={colors.emissive}
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>
        </>
      )}
    </group>
  );
}

export default function LootboxScene({ rarity, isOpening, onOpenComplete }: LootboxSceneProps) {
  const [animationStage, setAnimationStage] = useState(0);
  const colors = rarityColors[rarity];

  useEffect(() => {
    if (isOpening) {
      setAnimationStage(0);
      const timings = [
        { stage: 1, delay: 300 },
        { stage: 2, delay: 800 },
        { stage: 3, delay: 1200 },
        { stage: 4, delay: 1800 }
      ];
      timings.forEach(({ stage, delay }) => {
        setTimeout(() => setAnimationStage(stage), delay);
      });
    } else {
      setAnimationStage(0);
    }
  }, [isOpening]);

  useEffect(() => {
    if (animationStage === 4) {
      onOpenComplete();
    }
  }, [animationStage, onOpenComplete]);

  return (
    <div className="w-full h-64 relative">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color={colors.primary}
        />

        {/* Main lootbox */}
        <LootboxModel
          rarity={rarity}
          animationStage={animationStage}
          colors={colors}
        />

        {/* Particle effects */}
        <AnimatePresence>
          {isOpening && (
            <>
              <Particles color={colors.particles} isOpening={isOpening} />
              {animationStage >= 2 && (
                <Particles
                  color={colors.primary}
                  count={30}
                  isOpening={isOpening}
                />
              )}
            </>
          )}
        </AnimatePresence>

        {/* Environment and post-processing */}
        <fog attach="fog" args={['#000000', 5, 15]} />
      </Canvas>

      {/* Overlay effects (2D) */}
      <AnimatePresence>
        {animationStage === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${colors.primary}33 0%, transparent 70%)`
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}