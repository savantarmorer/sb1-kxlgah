import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, useGLTF, RoundedBox, MeshTransmissionMaterial, Environment, Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Gift, Sparkles, Stars } from 'lucide-react';
import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

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

// Add model path constant
const MODEL_PATH = '/images/items/loot_box.glb';

// Animation Hooks
function useIdleAnimation(ref: React.RefObject<THREE.Group>) {
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.5;
    ref.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
  });
}

function useBuildUpAnimation(ref: React.RefObject<THREE.Group>, intensity: number) {
  useFrame((state) => {
    if (!ref.current) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.05 * intensity;
    ref.current.scale.setScalar(scale);
  });
}

function useOpeningAnimation(boxRef: React.RefObject<THREE.Group>, lidRef: React.RefObject<THREE.Group>) {
  const rotationSpeed = useRef(4);
  const [exploded, setExploded] = useState(false);

  useFrame((_, delta) => {
    if (!boxRef.current || !lidRef.current) return;

    // Accelerate rotation
    rotationSpeed.current += delta * 15;
    boxRef.current.rotation.y += delta * rotationSpeed.current;

    // Lid animation
    if (!exploded) {
      lidRef.current.position.y += delta * 2;
      lidRef.current.rotation.x -= delta * 2;

      // Trigger explosion when lid is open enough
      if (lidRef.current.position.y > 1) {
        setExploded(true);
      }
    } else {
      // Explosive separation
      lidRef.current.position.y += delta * 8;
      lidRef.current.position.z -= delta * 4;
      lidRef.current.rotation.x -= delta * 8;
    }
  });

  return exploded;
}

function useBurstAnimation(ref: React.RefObject<THREE.Group>) {
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

// Add explosion particles component
function ExplosionParticles({ 
  color, 
  count = 50,
  intensity = 1
}: { 
  color: string; 
  count?: number;
  intensity?: number;
}) {
  const particles = useRef<THREE.Points>(null);
  const velocities = useRef<Float32Array>();
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = (1 + Math.random()) * intensity;
      
      // Initial positions near center
      pos[i * 3] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      
      // Velocities in all directions
      vel[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      vel[i * 3 + 2] = Math.cos(phi) * speed;
    }
    velocities.current = vel;
    return pos;
  }, [count, intensity]);

  useFrame((_, delta) => {
    if (!particles.current || !velocities.current) return;
    
    const positions = particles.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities.current[i] * delta;
      positions[i + 1] += velocities.current[i + 1] * delta;
      positions[i + 2] += velocities.current[i + 2] * delta;
      
      // Add gravity effect
      velocities.current[i + 1] -= delta * 2;
    }
    particles.current.geometry.attributes.position.needsUpdate = true;
    
    // Fade out
    const material = particles.current.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, material.opacity - delta);
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
        opacity={1}
        color={color}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Add type for GLTF result
type GLTFResult = GLTF & {
  nodes: {
    [key: string]: THREE.Mesh | THREE.Group;
  };
  materials: {
    [key: string]: THREE.MeshStandardMaterial;
  };
};

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
  const boxRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(MODEL_PATH) as GLTFResult;
  const [emissiveIntensity, setEmissiveIntensity] = useState(0.5);
  const [hasExploded, setHasExploded] = useState(false);

  // Log model structure on first load
  useEffect(() => {
    console.log('Model structure:', {
      nodes: Object.keys(gltf.nodes),
      materials: Object.keys(gltf.materials)
    });
  }, [gltf]);

  // Apply appropriate animation based on state
  if (state === 'IDLE') {
    useIdleAnimation(boxRef);
  } else if (state === 'BUILD_UP') {
    useBuildUpAnimation(boxRef, colors.intensity);
  } else if (state === 'OPENING') {
    const exploded = useOpeningAnimation(boxRef, boxRef);
    if (exploded && !hasExploded) {
      setHasExploded(true);
    }
  } else if (state === 'BURST') {
    useBurstAnimation(boxRef);
  }

  // Update all materials
  useEffect(() => {
    Object.values(gltf.materials).forEach(material => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.set(colors.primary);
        material.emissive.set(colors.emissive);
        material.emissiveIntensity = emissiveIntensity;
        material.metalness = 0.7;
        material.roughness = 0.2;
        material.envMapIntensity = 1.5;
        material.needsUpdate = true;
      }
    });
  }, [colors, gltf.materials, emissiveIntensity]);

  return (
    <group>
      <Float
        speed={1.5}
        rotationIntensity={state === 'IDLE' ? 0.3 : 0}
        floatIntensity={state === 'IDLE' ? 0.5 : 0}
      >
        <group 
          ref={boxRef} 
          scale={2}
          rotation={[0, 0, 0]} // Adjust initial rotation if needed
          position={[0, 0, 0]} // Adjust initial position if needed
        >
          <primitive object={gltf.scene} />
        </group>

        {/* Glow effects */}
        {state !== 'IDLE' && (
          <>
            <Sphere args={[1.2, 32, 32]} position={[0, 0, 0]}>
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
              distance={4}
            />
          </>
        )}

        {/* Explosion particles */}
        {hasExploded && (
          <>
            <ExplosionParticles 
              color={colors.primary} 
              count={50} 
              intensity={2 * colors.intensity}
            />
            <ExplosionParticles 
              color={colors.emissive} 
              count={30} 
              intensity={1.5 * colors.intensity}
            />
          </>
        )}
      </Float>

      {/* Environment map for reflections */}
      <Environment preset="sunset" />
    </group>
  );
}

// Preload the model
useGLTF.preload(MODEL_PATH);

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