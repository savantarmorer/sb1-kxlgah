import React, { useState, useEffect } from 'react';
import TournamentService from '@/services/tournamentService';
import { Tournament, TournamentFormat, MatchFormat } from '@/types/tournament';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { TournamentAdmin } from '@/components/TournamentAdmin';

export default function TournamentMode() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxPlayers: 8,
    minPlayers: 2,
    prizePool: 0,
    entryFee: 0,
    format: 'single_elimination' as TournamentFormat,
    matchFormat: 'best_of_3' as MatchFormat,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const tournamentList = await TournamentService.getTournaments();
      setTournaments(tournamentList);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  };

  const handleTournamentSelect = (tournament: Tournament) => {
    setActiveTournament(tournament);
  };

  const handleRegister = async (tournament_id: string) => {
    try {
      if (!user) {
        alert('Please log in to register for tournaments');
        return;
      }
      await TournamentService.registerPlayer(tournament_id, user.id);
      // Reload tournaments to update the UI
      await loadTournaments();
    } catch (error) {
      console.error('Failed to register for tournament:', error);
      alert(error instanceof Error ? error.message : 'Failed to register for tournament');
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTournament = await TournamentService.createTournament(formData);
      setTournaments([...tournaments, newTournament]);
      setIsCreating(false);
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        maxPlayers: 8,
        minPlayers: 2,
        prizePool: 0,
        entryFee: 0,
        format: 'single_elimination',
        matchFormat: 'best_of_3',
      });
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  };

  const getParticipantUsername = (participant: any) => {
    return participant?.profiles?.username || 'Unknown Player';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tournament Mode</h1>
        {isAdmin && (
          <div className="flex gap-4">
            <button
              onClick={() => setIsCreating(true)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Tournament
            </button>
            <button
              onClick={() => setIsAdminView(!isAdminView)}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              {isAdminView ? 'Exit Admin Mode' : 'Admin Mode'}
            </button>
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">Create Tournament</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTournament} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full p-2 border rounded"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 block w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 block w-full p-2 border rounded"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Players</label>
                  <input
                    type="number"
                    value={formData.maxPlayers}
                    onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                    className="mt-1 block w-full p-2 border rounded"
                    min={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Players</label>
                  <input
                    type="number"
                    value={formData.minPlayers}
                    onChange={(e) => setFormData({ ...formData, minPlayers: parseInt(e.target.value) })}
                    className="mt-1 block w-full p-2 border rounded"
                    min={2}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prize Pool ($)</label>
                  <input
                    type="number"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) })}
                    className="mt-1 block w-full p-2 border rounded"
                    min={0}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Entry Fee ($)</label>
                  <input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) })}
                    className="mt-1 block w-full p-2 border rounded"
                    min={0}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tournament Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as TournamentFormat })}
                    className="mt-1 block w-full p-2 border rounded"
                  >
                    <option value="single_elimination">Single Elimination</option>
                    <option value="double_elimination">Double Elimination</option>
                    <option value="round_robin">Round Robin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Match Format</label>
                  <select
                    value={formData.matchFormat}
                    onChange={(e) => setFormData({ ...formData, matchFormat: e.target.value as MatchFormat })}
                    className="mt-1 block w-full p-2 border rounded"
                  >
                    <option value="best_of_1">Best of 1</option>
                    <option value="best_of_3">Best of 3</option>
                    <option value="best_of_5">Best of 5</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Tournament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin View */}
      {isAdminView && isAdmin ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Tournament Management</h2>
            <div className="space-y-4">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{tournament.name}</h3>
                      <p className="text-gray-600">{tournament.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTournamentSelect(tournament)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this tournament?')) {
                            await TournamentService.deleteTournament(tournament.id);
                            loadTournaments();
                          }
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>Status: {tournament.status}</p>
                      <p>Players: {tournament.currentPlayers}/{tournament.maxPlayers}</p>
                      <p>Format: {tournament.format}</p>
                    </div>
                    <div>
                      <p>Prize Pool: ${tournament.prizePool}</p>
                      <p>Entry Fee: ${tournament.entryFee}</p>
                      <p>Match Format: {tournament.matchFormat}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {tournament.status === 'registration' && (
                      <button
                        onClick={async () => {
                          await TournamentService.generateBrackets(tournament.id);
                          loadTournaments();
                        }}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Generate Brackets
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        const newStatus = tournament.status === 'draft' ? 'registration' : 
                          tournament.status === 'registration' ? 'in_progress' : 
                          tournament.status === 'in_progress' ? 'completed' : 'cancelled';
                        await TournamentService.updateStatus(tournament.id, newStatus);
                        loadTournaments();
                      }}
                      className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                    >
                      Change Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Active Tournaments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Active Tournaments</h2>
            <div className="space-y-4">
              {tournaments
                .filter(t => t.status === 'in_progress')
                .map(tournament => (
                  <div
                    key={tournament.id}
                    className="border rounded p-4 hover:border-blue-500 cursor-pointer"
                    onClick={() => handleTournamentSelect(tournament)}
                  >
                    <h3 className="text-xl font-semibold">{tournament.name}</h3>
                    <p className="text-gray-600">{tournament.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Players: {tournament.currentPlayers}/{tournament.maxPlayers}
                      </span>
                      <span className="text-sm text-green-500">
                        Prize Pool: ${tournament.prizePool}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Upcoming Tournaments */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Upcoming Tournaments</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tournaments will automatically start when they reach max players or their start date.
            </p>
            <div className="space-y-4">
              {tournaments
                .filter(t => t.status === 'registration')
                .map(tournament => (
                  <div
                    key={tournament.id}
                    className="border rounded p-4 hover:border-blue-500 cursor-pointer"
                    onClick={() => handleTournamentSelect(tournament)}
                  >
                    <h3 className="text-xl font-semibold">{tournament.name}</h3>
                    <p className="text-gray-600">{tournament.description}</p>
                    <div className="mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Starts: {new Date(tournament.startDate).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-blue-500">
                          Entry Fee: ${tournament.entryFee}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Players: {tournament.currentPlayers}/{tournament.maxPlayers}
                          {tournament.currentPlayers >= 2 && tournament.currentPlayers < tournament.maxPlayers && (
                            <span className="ml-2 text-green-500">
                              (Ready to start)
                            </span>
                          )}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegister(tournament.id);
                          }}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Register
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Past Tournaments */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Past Tournaments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments
                .filter(t => t.status === 'completed')
                .map(tournament => (
                  <div
                    key={tournament.id}
                    className="border rounded p-4 hover:border-blue-500 cursor-pointer"
                    onClick={() => handleTournamentSelect(tournament)}
                  >
                    <h3 className="text-xl font-semibold">{tournament.name}</h3>
                    <p className="text-gray-600">{tournament.description}</p>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        Ended: {new Date(tournament.endDate).toLocaleDateString()}
                      </span>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Winner: {tournament.winner_id || 'N/A'}
                        </span>
                        <span className="text-sm text-green-500">
                          Prize: ${tournament.rewards?.prizePool || tournament.prizePool}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tournament Details Modal */}
      {activeTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{activeTournament.name}</h2>
              <button
                onClick={() => setActiveTournament(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">{activeTournament.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Tournament Details</h3>
                  <p>Format: {activeTournament.format}</p>
                  <p>Match Format: {activeTournament.matchFormat}</p>
                  <p>Status: {activeTournament.status}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Prize Information</h3>
                  <p>Prize Pool: ${activeTournament.prizePool}</p>
                  <p>Entry Fee: ${activeTournament.entryFee}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Players ({activeTournament.currentPlayers}/{activeTournament.maxPlayers})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {activeTournament.tournament_participants?.map((participant, index) => (
                    <div key={participant.id} className="flex justify-between items-center p-2">
                      <span>{getParticipantUsername(participant)}</span>
                      <span>Score: {participant.score}</span>
                    </div>
                  ))}
                </div>
              </div>
              {user && activeTournament.tournament_participants?.some(p => p.user_id === user.id) && (
                <div>
                  <h3 className="font-semibold mb-2">Your Match Status</h3>
                  {activeTournament.status === 'registration' ? (
                    <p className="text-gray-600">Waiting for tournament to start...</p>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/tournament/${activeTournament.id}`)}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        View Tournament Bracket
                      </button>
                      <p className="text-sm text-gray-600">
                        Click above to view the tournament bracket and your matches
                      </p>
                    </div>
                  )}
                </div>
              )}
              {activeTournament.status === 'registration' && 
               user && 
               !activeTournament.tournament_participants?.some(p => p.user_id === user.id) && (
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handleRegister(activeTournament.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Register Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 