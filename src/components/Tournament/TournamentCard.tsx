import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, Coins } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tournament } from '@/types/tournament';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return 'success';
      case 'in_progress': return 'warning';
      case 'completed': return 'default';
      case 'upcoming': return 'info';
      default: return 'default';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{tournament.name}</h3>
          <Badge variant={getStatusColor(tournament.status)}>
            {tournament.status}
          </Badge>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {tournament.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            <span>{tournament.current_players}/{tournament.max_players} players</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 mr-2 text-gray-500" />
            <span>Starts {new Date(tournament.start_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm">
            <Coins className="w-4 h-4 mr-2 text-gray-500" />
            <span>Prize Pool: ${tournament.prize_pool}</span>
          </div>
        </div>

        <div className="mt-6">
          <Button
            onClick={() => navigate(`/tournament/${tournament.id}`)}
            className="w-full"
          >
            View Tournament
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 