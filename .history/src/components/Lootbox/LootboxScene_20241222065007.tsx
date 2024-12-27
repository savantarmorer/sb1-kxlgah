import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Box, Sphere, useGLTF, Environment, Float, useAnimations, Sparkles as DreiSparkles } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Gift, Sparkles, Settings } from 'lucide-react';
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

interface SceneSettings {
  model: {
    scale: number;
    position: [number, number, number];
  };
  camera: {
    position: [number, number, number];
    fov: number;
  };
  animation: {
    duration: number;
    spinStartSpeed: number;
    spinEndSpeed: number;
    timeScale: number;
  };
  orb: {
    intensity: number;
    pulseSpeed: number;
    pulseIntensity: number;
    sparkleCount: number;
    sparkleScale: number;
    sparkleSpeed: number;
    rayCount: number;
    rayLength: number;
    rayOpacity: number;
  };
  bloom: {
    intensity: number;
    luminanceThreshold: number;
    luminanceSmoothing: number;
  };
  colors: {
    common: string;
    rare: string;
    epic: string;
    legendary: string;
  };
  legendarySequence: string[];
}

// Default settings
const DEFAULT_SETTINGS: SceneSettings = {
  model: {
    scale: 12,
    position: [0, 0, 0],
  },
  camera: {
    position: [0, 2, 4],
    fov: 50,
  },
  animation: {
    duration: 4000,
    spinStartSpeed: 0.2,
    spinEndSpeed: 4,
    timeScale: 0.5,
  },
  orb: {
    intensity: 3,
    pulseSpeed: 4,
    pulseIntensity: 0.3,
    sparkleCount: 100,
    sparkleScale: 3,
    sparkleSpeed: 0.4,
    rayCount: 12,
    rayLength: 0.6,
    rayOpacity: 0.3,
  },
  bloom: {
    intensity: 2.5,
    luminanceThreshold: 0.2,
    luminanceSmoothing: 0.9,
  },
  colors: {
    common: '#ffffff',
    rare: '#4287f5',
    epic: '#9b4dff',
    legendary: '#ffd700',
  },
  legendarySequence: [
    '#00ff00',
    '#4287f5',
    '#9b4dff',
    '#ffd700',
  ],
};

// Settings editor component
const SettingsEditor: React.FC<{
  settings: SceneSettings;
  onSettingsChange: (settings: SceneSettings) => void;
}> = ({ settings, onSettingsChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = (path: string[], value: any) => {
    const newSettings = { ...settings };
    let current = newSettings;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i] as keyof typeof current] as any;
    }
    current[path[path.length - 1] as keyof typeof current] = value;
    onSettingsChange(newSettings);
  };

  const getSettingValue = (path: string[]): any => {
    return path.reduce((obj, key) => obj[key as keyof typeof obj], settings as any);
  };

  const renderNumberInput = (label: string, path: string[], min?: number, max?: number, step?: number) => (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-sm w-40 text-gray-300">{label}</label>
      <input
        type="number"
        value={getSettingValue(path)}
        onChange={(e) => updateSetting(path, parseFloat(e.target.value) || 0)}
        className="bg-gray-800 text-white px-2 py-1 rounded w-32"
        min={min}
        max={max}
        step={step || 0.1}
      />
    </div>
  );

  const renderColorInput = (label: string, path: string[]) => (
    <div className="flex items-center gap-2 mb-2">
      <label className="text-sm w-40 text-gray-300">{label}</label>
      <input
        type="color"
        value={getSettingValue(path)}
        onChange={(e) => updateSetting(path, e.target.value)}
        className="bg-transparent w-32 h-8"
      />
    </div>
  );

  return (
    <div className="absolute top-4 left-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-2 rounded-full hover:bg-gray-700"
      >
        <Settings size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed top-4 left-16 bg-gray-900/95 backdrop-blur-sm text-white p-6 rounded-lg shadow-lg w-[400px] h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-gray-900 pb-4 z-10">
              <h3 className="text-xl font-bold">Scene Settings</h3>
              <p className="text-sm text-gray-400 mt-1">Changes are applied in real-time</p>
            </div>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-md font-semibold mb-3 text-blue-400">Model</h4>
                {renderNumberInput('Scale', ['model', 'scale'], 1, 50)}
                {renderNumberInput('Position X', ['model', 'position', '0'])}
                {renderNumberInput('Position Y', ['model', 'position', '1'])}
                {renderNumberInput('Position Z', ['model', 'position', '2'])}
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 text-blue-400">Camera</h4>
                {renderNumberInput('Position X', ['camera', 'position', '0'])}
                {renderNumberInput('Position Y', ['camera', 'position', '1'])}
                {renderNumberInput('Position Z', ['camera', 'position', '2'])}
                {renderNumberInput('FOV', ['camera', 'fov'], 20, 120, 1)}
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 text-blue-400">Animation</h4>
                {renderNumberInput('Duration (ms)', ['animation', 'duration'], 1000, 10000, 100)}
                {renderNumberInput('Start Speed', ['animation', 'spinStartSpeed'], 0, 10)}
                {renderNumberInput('End Speed', ['animation', 'spinEndSpeed'], 0, 10)}
                {renderNumberInput('Time Scale', ['animation', 'timeScale'], 0.1, 2)}
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 text-blue-400">Orb</h4>
                {renderNumberInput('Intensity', ['orb', 'intensity'], 0, 10)}
                {renderNumberInput('Pulse Speed', ['orb', 'pulseSpeed'], 0, 10)}
                {renderNumberInput('Pulse Intensity', ['orb', 'pulseIntensity'], 0, 1)}
                {renderNumberInput('Sparkle Count', ['orb', 'sparkleCount'], 0, 500, 1)}
                {renderNumberInput('Sparkle Scale', ['orb', 'sparkleScale'], 0, 10)}
                {renderNumberInput('Sparkle Speed', ['orb', 'sparkleSpeed'], 0, 2)}
                {renderNumberInput('Ray Count', ['orb', 'rayCount'], 4, 24, 1)}
                {renderNumberInput('Ray Length', ['orb', 'rayLength'], 0, 2)}
                {renderNumberInput('Ray Opacity', ['orb', 'rayOpacity'], 0, 1)}
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 text-blue-400">Bloom</h4>
                {renderNumberInput('Intensity', ['bloom', 'intensity'], 0, 5)}
                {renderNumberInput('Threshold', ['bloom', 'luminanceThreshold'], 0, 1)}
                {renderNumberInput('Smoothing', ['bloom', 'luminanceSmoothing'], 0, 1)}
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 text-blue-400">Colors</h4>
                {renderColorInput('Common', ['colors', 'common'])}
                {renderColorInput('Rare', ['colors', 'rare'])}
                {renderColorInput('Epic', ['colors', 'epic'])}
                {renderColorInput('Legendary', ['colors', 'legendary'])}
              </div>

              <div>
                <h4 className="text-md font-semibold mb-3 text-blue-400">Legendary Sequence</h4>
                {settings.legendarySequence.map((_, index) => (
                  renderColorInput(`Color ${index + 1}`, ['legendarySequence', `${index}`])
                ))}
              </div>

              <button
                onClick={() => onSettingsChange(DEFAULT_SETTINGS)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full mt-4"
              >
                Reset to Defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced glowing orb component
const GlowingOrb: React.FC<{ color: string; settings: SceneSettings }> = ({ color, settings }) => {
  const orbRef = useRef<THREE.Group>(null);
  const time = useRef(0);
  
  useFrame((state) => {
    if (orbRef.current) {
      time.current += state.clock.getDelta();
      orbRef.current.rotation.y += 0.02;
      
      // Pulse the intensity
      const pulseIntensity = settings.orb.intensity * (1 + Math.sin(time.current * settings.orb.pulseSpeed) * settings.orb.pulseIntensity);
      if (orbRef.current.children[0] instanceof THREE.PointLight) {
        orbRef.current.children[0].intensity = pulseIntensity * 2;
      }
    }
  });

  return (
    <group ref={orbRef} position={[0, 0, 0]}>
      <pointLight color={color} intensity={settings.orb.intensity * 2} distance={15} />
      <Sphere args={[0.2, 32, 32]}>
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </Sphere>
      
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
      
      <DreiSparkles
        count={settings.orb.sparkleCount}
        scale={settings.orb.sparkleScale}
        size={6}
        speed={settings.orb.sparkleSpeed}
        color={color}
      />
      
      {[...Array(settings.orb.rayCount)].map((_, i) => (
        <group key={i} rotation={[0, (Math.PI * 2 * i) / settings.orb.rayCount, 0]}>
          <mesh position={[0.5, 0, 0]}>
            <boxGeometry args={[settings.orb.rayLength, 0.02, 0.02]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={settings.orb.rayOpacity}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Main lootbox component
const LootboxModel: React.FC<LootboxProps & { settings: SceneSettings }> = ({ rarity, isOpening, onOpenComplete, settings }) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions, names } = useAnimations(animations, group);
  const [glowColor, setGlowColor] = useState<string | null>(null);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const spinSpeed = useRef(settings.animation.spinStartSpeed);
  const startTime = useRef<number | null>(null);
  
  useFrame((state) => {
    if (isOpening && group.current) {
      if (startTime.current === null) {
        startTime.current = state.clock.getElapsedTime();
      }
      
      const elapsed = state.clock.getElapsedTime() - startTime.current;
      const progress = Math.min(elapsed / (settings.animation.duration / 1000), 1);
      
      spinSpeed.current = settings.animation.spinStartSpeed + 
        (settings.animation.spinEndSpeed - settings.animation.spinStartSpeed) * Math.pow(progress, 3);
      group.current.rotation.y += spinSpeed.current * state.clock.getDelta();
    }
  });
  
  useEffect(() => {
    if (rarity === 'legendary' && isOpening && sequenceIndex < settings.legendarySequence.length) {
      const interval = setInterval(() => {
        setSequenceIndex(prev => {
          if (prev < settings.legendarySequence.length - 1) {
            setGlowColor(settings.legendarySequence[prev + 1]);
            return prev + 1;
          }
          clearInterval(interval);
          return prev;
        });
      }, 500);
      
      setGlowColor(settings.legendarySequence[0]);
      return () => clearInterval(interval);
    } else if (isOpening) {
      setGlowColor(settings.colors[rarity as keyof typeof settings.colors] || settings.colors.common);
    }
  }, [rarity, isOpening, settings]);
  
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
            action.timeScale = settings.animation.timeScale;
          }
        });
      }, animationDelay);
      
      const timeoutId = setTimeout(onOpenComplete, animationDelay + settings.animation.duration);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpening, actions, names, onOpenComplete, rarity, settings]);

  return (
    <group 
      ref={group} 
      scale={settings.model.scale}
      position={settings.model.position as [number, number, number]}
    >
      <primitive object={scene} />
      {glowColor && <GlowingOrb color={glowColor} settings={settings} />}
    </group>
  );
};

// Scene wrapper
export const LootboxScene: React.FC<LootboxProps> = (props) => {
  const [settings, setSettings] = useState<SceneSettings>(DEFAULT_SETTINGS);

  return (
    <div className="w-full h-full relative">
      <SettingsEditor settings={settings} onSettingsChange={setSettings} />
      <Canvas camera={{ position: settings.camera.position, fov: settings.camera.fov }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Float
          speed={2}
          rotationIntensity={0.5}
          floatIntensity={0.5}
          floatingRange={[-0.1, 0.1]}
        >
          <LootboxModel {...props} settings={settings} />
        </Float>
        
        <Environment preset="city" />
        <EffectComposer>
          <Bloom
            intensity={settings.bloom.intensity}
            luminanceThreshold={settings.bloom.luminanceThreshold}
            luminanceSmoothing={settings.bloom.luminanceSmoothing}
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