import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Clock, Coins, Search } from 'lucide-react';
import { useTournament } from '@/hooks/useTournament';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TournamentCard } from './TournamentCard';
import { TournamentStatus } from '@/types/tournament';

export function TournamentLobby() {
  const [filter, setFilter] = useState<TournamentStatus>('registration');
  const [searchQuery, setSearchQuery] = useState('');
  const { tournaments, loading } = useTournament();

  const filteredTournaments = tournaments?.filter(tournament => {
    const matchesFilter = tournament.status === filter;
    const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tournament Lobby</h1>
        <Button variant="primary" className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Create Tournament</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard
          icon={<Trophy className="w-6 h-6 text-yellow-500" />}
          title="Active Tournaments"
          value={tournaments?.filter(t => t.status === 'in_progress').length || 0}
        />
        <StatsCard
          icon={<Users className="w-6 h-6 text-blue-500" />}
          title="Total Players"
          value={tournaments?.reduce((acc, t) => acc + t.current_players, 0) || 0}
        />
        <StatsCard
          icon={<Clock className="w-6 h-6 text-green-500" />}
          title="Upcoming"
          value={tournaments?.filter(t => t.status === 'upcoming').length || 0}
        />
        <StatsCard
          icon={<Coins className="w-6 h-6 text-purple-500" />}
          title="Total Prize Pool"
          value={tournaments?.reduce((acc, t) => acc + t.prize_pool, 0) || 0}
          prefix="$"
        />
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex space-x-2">
          <FilterButton
            active={filter === 'registration'}
            onClick={() => setFilter('registration')}
          >
            Registration Open
          </FilterButton>
          <FilterButton
            active={filter === 'in_progress'}
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </FilterButton>
          <FilterButton
            active={filter === 'upcoming'}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </FilterButton>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tournament List */}
      {loading ? (
        <div>Loading tournaments...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments?.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  prefix?: string;
}

function StatsCard({ icon, title, value, prefix }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">
            {prefix}{value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ children, active, onClick }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
} 