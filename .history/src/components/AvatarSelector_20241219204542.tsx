import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase.ts';
import { useGame } from '../contexts/GameContext';
import { Lock } from 'lucide-react';

interface Avatar {
  id: number;
  url: string;
  name: string;
  category: string;
  is_premium: boolean;
}

const DEFAULT_AVATAR = '/avatars/default1.jpg';

export function AvatarSelector({ onSelect }: { onSelect: (avatarId: number) => void }) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { state } = useGame();

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (!error && data) {
      setAvatars(data);
    }
  };

  const handleSelect = (avatar: Avatar) => {
    if (avatar.is_premium && !state.user?.gems) {
      // Show premium locked message
      return;
    }
    setSelectedId(avatar.id);
    onSelect(avatar.id);
  };

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {avatars.map((avatar) => (
        <motion.div
          key={avatar.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative cursor-pointer ${
            selectedId === avatar.id ? 'ring-2 ring-indigo-500' : ''
          }`}
          onClick={() => handleSelect(avatar)}
        >
          <img
            src={avatar.url || DEFAULT_AVATAR}
            alt={avatar.name}
            className="w-full h-full rounded-lg object-cover"
          />
          {avatar.is_premium && !state.user?.gems && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
          )}
          <motion.div
            className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
            animate={{ scale: selectedId === avatar.id ? 1 : 0 }}
          />
        </motion.div>
      ))}
    </div>
  );
}