import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSound } from '../../hooks/useSound';
import { use_language } from '../../contexts/LanguageContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { volume, setVolume, isMuted, toggleMute } = useSound();
  const { language, setLanguage } = use_language();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Theme</h3>
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="input"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Sound</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMute}
              className="btn btn-secondary"
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Language</h3>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="input"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>
    </div>
  );
} 