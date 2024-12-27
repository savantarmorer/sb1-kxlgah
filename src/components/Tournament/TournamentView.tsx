import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTournament } from '@/hooks/useTournament';
import { TournamentBracket } from './TournamentBracket';
import { TournamentLeaderboard } from './TournamentLeaderboard';
import { TournamentChat } from './TournamentChat';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { TournamentStatus } from '@/types/tournament';

export function TournamentView() {
  const { id } = useParams<{ id: string }>();
  const { tournament, matches, loading, error, registerForTournament } = useTournament(id);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bracket' | 'leaderboard' | 'chat'>('bracket');

  if (!id) {
    return <div>Invalid tournament ID</div>;
  }

  if (loading) {
    return <div>Loading tournament...</div>;
  }

  if (error || !tournament) {
    return <div>Failed to load tournament</div>;
  }

  const isRegistered = tournament.participants?.some(p => p.user_id === user?.id);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Tournament Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="text-gray-600">{tournament.description}</p>
        </div>
        
        {tournament.status === 'registration' && !isRegistered && (
          <Button onClick={registerForTournament}>
            Register Now
          </Button>
        )}
      </div>

      {/* Tournament Info */}
      <div className="grid grid-cols-3 gap-4">
        <InfoCard
          title="Prize Pool"
          value={`$${tournament.prize_pool}`}
        />
        <InfoCard
          title="Players"
          value={`${tournament.current_players}/${tournament.max_players}`}
        />
        <InfoCard
          title="Status"
          value={tournament.status}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b">
        <TabButton
          active={activeTab === 'bracket'}
          onClick={() => setActiveTab('bracket')}
        >
          Bracket
        </TabButton>
        <TabButton
          active={activeTab === 'leaderboard'}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </TabButton>
        <TabButton
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'bracket' && (
          <TournamentBracket
            matches={matches}
            tournamentId={id}
          />
        )}
        {activeTab === 'leaderboard' && (
          <TournamentLeaderboard
            tournamentId={id}
          />
        )}
        {activeTab === 'chat' && (
          <TournamentChat
            tournamentId={id}
          />
        )}
      </div>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  value: string | number;
}

function InfoCard({ title, value }: InfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm text-gray-600">{title}</h3>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

interface TabButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function TabButton({ children, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium border-b-2 transition-colors ${
        active
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
} 