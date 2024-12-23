import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, useGLTF } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Gift, Sparkles, Stars } from 'lucide-react';
import * as THREE from 'three';

// Types
type LootboxState = 'IDLE' | 'BUILD_UP' | 'OPENING' | 'BURST' | 'DONE';

interface LootboxSceneProps {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isOpening: boolean;
  onOpenComplete: () => void;
}

interface AnimationTimeline {
  state: LootboxState;
  duration: number;
}

// Constants
const TIMELINE: AnimationTimeline[] = [
  { state: 'BUILD_UP', duration: 300 },
  { state: 'OPENING', duration: 500 },
  { state: 'BURST', duration: 400 },
  { state: 'DONE', duration: 600 }
];

const rarityColors = {
  common: {
    primary: '#9CA3AF',
    secondary: '#4B5563',
    emissive: '#1F2937',
    particles: '#D1D5DB',
    intensity: 1
  },
  rare: {
    primary: '#3B82F6',
    secondary: '#1D4ED8',
    emissive: '#1E40AF',
    particles: '#93C5FD',
    intensity: 1.2
  },
  epic: {
    primary: '#8B5CF6',
    secondary: '#6D28D9',
    emissive: '#5B21B6',
    particles: '#C4B5FD',
    intensity: 1.5
  },
  legendary: {
    primary: '#F59E0B',
    secondary: '#D97706',
    emissive: '#B45309',
    particles: '#FCD34D',
    intensity: 2
  }
};

// Animation Hooks
function useIdleAnimation(ref: React.RefObject<THREE.Mesh>) {
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.5;
    ref.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
  });
}

function useBuildUpAnimation(ref: React.RefObject<THREE.Mesh>, intensity: number) {
  useFrame((state) => {
    if (!ref.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.05 * intensity;
    ref.current.scale.setScalar(scale);
  });
}

function useOpeningAnimation(boxRef: React.RefObject<THREE.Mesh>, lidRef: React.RefObject<THREE.Mesh>) {
  useFrame((_, delta) => {
    if (!boxRef.current || !lidRef.current) return;
    boxRef.current.rotation.y += delta * 4;
    lidRef.current.position.y += delta * 2;
    lidRef.current.rotation.x -= delta * 2;
  });
}

function useBurstAnimation(ref: React.RefObject<THREE.Mesh>) {
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.scale.multiplyScalar(0.95);
    ref.current.position.y += delta;
  });
}

function useCameraShake(isShaking: boolean) {
  const { camera } = useThree();
  const originalPosition = useRef(camera.position.clone());

  useFrame(() => {
    if (isShaking) {
      camera.position.x = originalPosition.current.x + (Math.random() - 0.5) * 0.1;
      camera.position.y = originalPosition.current.y + (Math.random() - 0.5) * 0.1;
    } else {
      camera.position.lerp(originalPosition.current, 0.1);
    }
  });
}

// Particle System
function ParticleSystem({ 
  color, 
  count = 20, 
  isOpening, 
  intensity = 1 
}: { 
  color: string; 
  count?: number; 
  isOpening: boolean;
  intensity?: number;
}) {
  const particles = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 1 + Math.random() * 0.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    if (!particles.current) return;
    if (isOpening) {
      particles.current.scale.addScalar(delta * 2 * intensity);
      particles.current.rotation.y += delta;
      particles.current.rotation.z += delta * 0.5;
      (particles.current.material as THREE.PointsMaterial).opacity -= delta;
    } else {
      particles.current.rotation.y += delta * 0.2;
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
        depthWrite={false}
      />
    </points>
  );
}

// Main Lootbox Model
function LootboxModel({ 
  rarity, 
  state, 
  colors 
}: { 
  rarity: keyof typeof rarityColors; 
  state: LootboxState;
  colors: typeof rarityColors[keyof typeof rarityColors];
}) {
  const boxRef = useRef<THREE.Mesh>(null);
  const lidRef = useRef<THREE.Mesh>(null);
  const [emissiveIntensity, setEmissiveIntensity] = useState(0.5);

  // Apply appropriate animation based on state
  switch (state) {
    case 'IDLE':
      useIdleAnimation(boxRef);
      break;
    case 'BUILD_UP':
      useBuildUpAnimation(boxRef, colors.intensity);
      break;
    case 'OPENING':
      useOpeningAnimation(boxRef, lidRef);
      break;
    case 'BURST':
      useBurstAnimation(boxRef);
      break;
  }

  // Smoothly animate emissive intensity
  useFrame((_, delta) => {
    if (state !== 'IDLE') {
      setEmissiveIntensity(current => 
        Math.min(current + delta * colors.intensity, 2 * colors.intensity)
      );
    } else {
      setEmissiveIntensity(current => Math.max(current - delta, 0.5));
    }
  });

  const materialProps = {
    metalness: 0.8,
    roughness: 0.2,
    emissive: colors.emissive,
    emissiveIntensity
  };

  return (
    <group>
      {/* Base box */}
      <mesh ref={boxRef} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={colors.primary}
          {...materialProps}
        />
      </mesh>

      {/* Lid */}
      {state !== 'BURST' && state !== 'DONE' && (
        <mesh
          ref={lidRef}
          position={[0, 0.5, 0]}
          castShadow
        >
          <boxGeometry args={[1.1, 0.1, 1.1]} />
          <meshStandardMaterial
            color={colors.secondary}
            {...materialProps}
          />
        </mesh>
      )}

      {/* Glow sphere */}
      {state !== 'IDLE' && (
        <Sphere args={[0.6, 16, 16]} position={[0, 0, 0]}>
          <meshBasicMaterial
            color={colors.emissive}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </Sphere>
      )}
    </group>
  );
}

// Main Component
export default function LootboxScene({ rarity, isOpening, onOpenComplete }: LootboxSceneProps) {
  const [state, setState] = useState<LootboxState>('IDLE');
  const colors = rarityColors[rarity];
  const timeoutRef = useRef<NodeJS.Timeout>();

  // State machine effect
  useEffect(() => {
    if (isOpening && state === 'IDLE') {
      let elapsed = 0;
      
      // Clear any existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Step through timeline
      TIMELINE.forEach(({ state: nextState, duration }) => {
        const timeout = setTimeout(() => {
          setState(nextState);
          if (nextState === 'DONE') {
            onOpenComplete();
          }
        }, elapsed);
        timeoutRef.current = timeout;
        elapsed += duration;
      });

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    } else if (!isOpening && state !== 'IDLE') {
      setState('IDLE');
    }
  }, [isOpening, onOpenComplete, state]);

  return (
    <div className="w-full h-64 relative">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        className="w-full h-full"
      >
        {/* Lighting */}
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
          state={state}
          colors={colors}
        />

        {/* Particle systems */}
        <AnimatePresence>
          {state !== 'IDLE' && (
            <>
              <ParticleSystem 
                color={colors.particles} 
                isOpening={state !== 'IDLE'} 
                intensity={colors.intensity}
              />
              {(state === 'OPENING' || state === 'BURST') && (
                <ParticleSystem
                  color={colors.primary}
                  count={30}
                  isOpening={true}
                  intensity={colors.intensity * 1.5}
                />
              )}
            </>
          )}
        </AnimatePresence>

        {/* Post processing */}
        <EffectComposer>
          <Bloom
            intensity={state === 'BURST' ? 2 : 0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>

        {/* Camera effects */}
        {useCameraShake(state === 'BURST')}

        {/* Environment */}
        <fog attach="fog" args={['#000000', 5, 15]} />
      </Canvas>

      {/* 2D Overlay effects */}
      <AnimatePresence>
        {state === 'BURST' && (
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