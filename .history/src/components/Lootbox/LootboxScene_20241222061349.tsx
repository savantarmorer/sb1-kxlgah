import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, useGLTF, RoundedBox, MeshTransmissionMaterial, Environment, Float } from '@react-three/drei';
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

// Add new constant for box dimensions
const BOX_DIMENSIONS = {
  width: 1.2,
  height: 0.8,
  depth: 0.9,
  lidHeight: 0.2,
  borderThickness: 0.05,
  cornerSize: 0.08
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

function CameraShake() {
  const { camera } = useThree();
  const originalPosition = useRef(camera.position.clone());

  useFrame(() => {
    camera.position.x = originalPosition.current.x + (Math.random() - 0.5) * 0.1;
    camera.position.y = originalPosition.current.y + (Math.random() - 0.5) * 0.1;
    return null;
  });

  return null;
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
  const [hovered, setHovered] = useState(false);

  // Apply appropriate animation based on state
  if (state === 'IDLE') {
    useIdleAnimation(boxRef);
  } else if (state === 'BUILD_UP') {
    useBuildUpAnimation(boxRef, colors.intensity);
  } else if (state === 'OPENING') {
    useOpeningAnimation(boxRef, lidRef);
  } else if (state === 'BURST') {
    useBurstAnimation(boxRef);
  }

  // Smoothly animate emissive intensity
  useFrame((_, delta) => {
    if (state !== 'IDLE') {
      setEmissiveIntensity(prev => 
        Math.min(prev + delta * colors.intensity, 2 * colors.intensity)
      );
    } else {
      setEmissiveIntensity(prev => Math.max(prev - delta, 0.5));
    }
  });

  const baseMaterialProps = {
    metalness: 0.7,
    roughness: 0.2,
    envMapIntensity: 1.5,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    emissive: colors.emissive,
    emissiveIntensity
  };

  const metalMaterialProps = {
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    emissive: colors.emissive,
    emissiveIntensity: emissiveIntensity * 1.2
  };

  return (
    <group>
      <Float
        speed={1.5}
        rotationIntensity={state === 'IDLE' ? 0.3 : 0}
        floatIntensity={state === 'IDLE' ? 0.5 : 0}
      >
        {/* Base box */}
        <group ref={boxRef}>
          {/* Main box body */}
          <RoundedBox
            args={[BOX_DIMENSIONS.width, BOX_DIMENSIONS.height, BOX_DIMENSIONS.depth]}
            radius={0.02}
            smoothness={4}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial
              {...baseMaterialProps}
              color={colors.primary}
            />
          </RoundedBox>

          {/* Decorative borders */}
          {[...Array(4)].map((_, i) => (
            <group key={`border-${i}`}>
              {/* Vertical borders */}
              <mesh
                position={[
                  (i % 2 ? BOX_DIMENSIONS.width/2 : -BOX_DIMENSIONS.width/2),
                  0,
                  (i < 2 ? BOX_DIMENSIONS.depth/2 : -BOX_DIMENSIONS.depth/2)
                ]}
                scale={[BOX_DIMENSIONS.borderThickness, BOX_DIMENSIONS.height, BOX_DIMENSIONS.borderThickness]}
              >
                <boxGeometry />
                <meshStandardMaterial
                  {...metalMaterialProps}
                  color={colors.secondary}
                />
              </mesh>

              {/* Corner pieces */}
              <mesh
                position={[
                  (i % 2 ? BOX_DIMENSIONS.width/2 : -BOX_DIMENSIONS.width/2),
                  BOX_DIMENSIONS.height/2 - BOX_DIMENSIONS.cornerSize/2,
                  (i < 2 ? BOX_DIMENSIONS.depth/2 : -BOX_DIMENSIONS.depth/2)
                ]}
              >
                <boxGeometry args={[
                  BOX_DIMENSIONS.cornerSize,
                  BOX_DIMENSIONS.cornerSize,
                  BOX_DIMENSIONS.cornerSize
                ]} />
                <meshStandardMaterial
                  {...metalMaterialProps}
                  color={colors.secondary}
                />
              </mesh>
            </group>
          ))}

          {/* Front lock decoration */}
          <group position={[0, 0, BOX_DIMENSIONS.depth/2 + 0.01]}>
            <mesh scale={[0.2, 0.3, 0.05]}>
              <roundedBoxGeometry args={[1, 1, 1, 0.1]} />
              <meshStandardMaterial
                {...metalMaterialProps}
                color={colors.secondary}
              />
            </mesh>
            {/* Lock keyhole */}
            <mesh position={[0, 0, 0.03]} scale={[0.06, 0.1, 0.01]}>
              <cylinderGeometry />
              <meshStandardMaterial
                color={colors.emissive}
                {...metalMaterialProps}
              />
            </mesh>
          </group>

          {/* Bottom decorative bands */}
          {[...Array(2)].map((_, i) => (
            <mesh
              key={`band-${i}`}
              position={[0, -BOX_DIMENSIONS.height/2 + 0.1 + i * 0.2, 0]}
              scale={[BOX_DIMENSIONS.width + 0.02, 0.05, BOX_DIMENSIONS.depth + 0.02]}
            >
              <boxGeometry />
              <meshStandardMaterial
                {...metalMaterialProps}
                color={colors.secondary}
              />
            </mesh>
          ))}
        </group>

        {/* Lid */}
        {state !== 'BURST' && state !== 'DONE' && (
          <group
            ref={lidRef}
            position={[0, BOX_DIMENSIONS.height/2 + BOX_DIMENSIONS.lidHeight/2, 0]}
          >
            {/* Main lid */}
            <RoundedBox
              args={[
                BOX_DIMENSIONS.width + BOX_DIMENSIONS.borderThickness*2,
                BOX_DIMENSIONS.lidHeight,
                BOX_DIMENSIONS.depth + BOX_DIMENSIONS.borderThickness*2
              ]}
              radius={0.02}
              smoothness={4}
              castShadow
            >
              <meshStandardMaterial
                {...baseMaterialProps}
                color={colors.primary}
              />
            </RoundedBox>

            {/* Lid top decoration */}
            <mesh
              position={[0, BOX_DIMENSIONS.lidHeight/2, 0]}
              scale={[
                BOX_DIMENSIONS.width - 0.1,
                0.02,
                BOX_DIMENSIONS.depth - 0.1
              ]}
            >
              <boxGeometry />
              <meshStandardMaterial
                {...metalMaterialProps}
                color={colors.secondary}
              />
            </mesh>

            {/* Lid edge decorations */}
            {[...Array(4)].map((_, i) => (
              <mesh
                key={`lid-edge-${i}`}
                position={[
                  i < 2 ? (i === 0 ? -BOX_DIMENSIONS.width/2 : BOX_DIMENSIONS.width/2) : 0,
                  0,
                  i >= 2 ? (i === 2 ? -BOX_DIMENSIONS.depth/2 : BOX_DIMENSIONS.depth/2) : 0
                ]}
                scale={[
                  i < 2 ? BOX_DIMENSIONS.borderThickness : BOX_DIMENSIONS.width,
                  BOX_DIMENSIONS.lidHeight,
                  i < 2 ? BOX_DIMENSIONS.depth : BOX_DIMENSIONS.borderThickness
                ]}
              >
                <boxGeometry />
                <meshStandardMaterial
                  {...metalMaterialProps}
                  color={colors.secondary}
                />
              </mesh>
            ))}

            {/* Center emblem */}
            <group position={[0, BOX_DIMENSIONS.lidHeight/2 + 0.01, 0]}>
              <mesh scale={[0.3, 0.02, 0.3]}>
                <cylinderGeometry args={[1, 1, 1, 8]} />
                <meshStandardMaterial
                  {...metalMaterialProps}
                  color={colors.secondary}
                />
              </mesh>
              <mesh position={[0, 0.02, 0]} scale={[0.2, 0.02, 0.2]}>
                <cylinderGeometry args={[1, 1, 1, 8]} />
                <meshStandardMaterial
                  color={colors.emissive}
                  emissiveIntensity={emissiveIntensity * 1.5}
                  {...metalMaterialProps}
                />
              </mesh>
            </group>
          </group>
        )}

        {/* Glow effects */}
        {state !== 'IDLE' && (
          <>
            <Sphere args={[0.6, 32, 32]} position={[0, 0, 0]}>
              <meshBasicMaterial
                color={colors.emissive}
                transparent
                opacity={0.15}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </Sphere>
            <pointLight
              position={[0, 0, 0]}
              intensity={emissiveIntensity * colors.intensity}
              color={colors.emissive}
              distance={2}
            />
          </>
        )}
      </Float>

      {/* Environment map for reflections */}
      <Environment preset="sunset" />
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
      const timeouts: NodeJS.Timeout[] = [];
      
      // Step through timeline
      TIMELINE.forEach(({ state: nextState, duration }) => {
        const timeout = setTimeout(() => {
          setState(nextState);
          if (nextState === 'DONE') {
            onOpenComplete();
          }
        }, elapsed);
        timeouts.push(timeout);
        elapsed += duration;
      });

      return () => {
        timeouts.forEach(clearTimeout);
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
        gl={{ 
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color={colors.primary}
        />
        <spotLight
          position={[5, 5, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />

        {/* Main lootbox */}
        <LootboxModel
          rarity={rarity}
          state={state}
          colors={colors}
        />

        {/* Particle systems */}
        {state !== 'IDLE' && (
          <>
            <ParticleSystem 
              color={colors.particles} 
              isOpening={true} 
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

        {/* Post processing */}
        <EffectComposer>
          <Bloom
            intensity={state === 'BURST' ? 2 : 0.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
        </EffectComposer>

        {/* Camera effects */}
        {state === 'BURST' && <CameraShake />}

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