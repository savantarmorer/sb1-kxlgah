import React, { useState } from 'react';
import { Tournament, TournamentMatch } from '@/types/tournament';

interface TournamentAdminProps {
  tournament?: Tournament;
  onUpdateTournament?: (tournament: Tournament) => void;
}

type AdminTab = 'overview' | 'brackets' | 'players' | 'bots' | 'rewards' | 'settings';

export const TournamentAdmin: React.FC<TournamentAdminProps> = ({ tournament, onUpdateTournament }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxPlayers: 8,
    prizePool: 0,
    entryFee: 0,
  });

  const handleCreateTournament = () => {
    // TODO: Implement tournament creation logic
    console.log('Creating tournament:', formData);
  };

  const handleDeleteTournament = (tournamentId: string) => {
    // TODO: Implement tournament deletion logic
    console.log('Deleting tournament:', tournamentId);
  };

  const handleUpdateBracket = (matches: TournamentMatch[]) => {
    // TODO: Implement bracket update logic
    console.log('Updating bracket:', matches);
  };

  const handleAddBot = (botId: string, position: number) => {
    // TODO: Implement bot addition logic
    console.log('Adding bot:', botId, 'at position:', position);
  };

  const handleUpdateRewards = (rewards: any) => {
    // TODO: Implement rewards update logic
    console.log('Updating rewards:', rewards);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tournament Administration</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Tournament
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex space-x-4 mb-6">
        {['overview', 'brackets', 'players', 'bots', 'rewards', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as AdminTab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Create Tournament Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Create New Tournament</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateTournament(); }}>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Tournament Name"
                  className="w-full p-2 border rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <textarea
                  placeholder="Description"
                  className="w-full p-2 border rounded"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="datetime-local"
                    className="p-2 border rounded"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                  <input
                    type="datetime-local"
                    className="p-2 border rounded"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
                <input
                  type="number"
                  placeholder="Max Players"
                  className="w-full p-2 border rounded"
                  value={formData.maxPlayers}
                  onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Prize Pool"
                  className="w-full p-2 border rounded"
                  value={formData.prizePool}
                  onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) })}
                />
                <input
                  type="number"
                  placeholder="Entry Fee"
                  className="w-full p-2 border rounded"
                  value={formData.entryFee}
                  onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) })}
                />
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-lg p-6">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Tournament Overview</h3>
            {tournament ? (
              <div className="space-y-4">
                <p><strong>Name:</strong> {tournament.name}</p>
                <p><strong>Status:</strong> {tournament.status}</p>
                <p><strong>Players:</strong> {tournament.players?.length || 0}</p>
                {/* Add more tournament details */}
              </div>
            ) : (
              <p>No tournament selected</p>
            )}
          </div>
        )}

        {activeTab === 'brackets' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Bracket Management</h3>
            {/* Add bracket editor component here */}
            <div className="space-y-4">
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Generate Brackets
              </button>
              <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                Edit Matches
              </button>
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Player Management</h3>
            {/* Add player management interface */}
            <div className="space-y-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Add Player
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Remove Player
              </button>
            </div>
          </div>
        )}

        {activeTab === 'bots' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Bot Management</h3>
            {/* Add bot management interface */}
            <div className="space-y-4">
              <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                Add Bot
              </button>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Remove Bot
              </button>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Rewards Configuration</h3>
            {/* Add rewards configuration interface */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="1st Place Prize"
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="2nd Place Prize"
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="3rd Place Prize"
                  className="p-2 border rounded"
                />
              </div>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Save Rewards
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 className="text-xl font-bold mb-4">Tournament Settings</h3>
            {/* Add tournament settings interface */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tournament Format</label>
                  <select className="mt-1 block w-full p-2 border rounded">
                    <option>Single Elimination</option>
                    <option>Double Elimination</option>
                    <option>Round Robin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Match Format</label>
                  <select className="mt-1 block w-full p-2 border rounded">
                    <option>Best of 1</option>
                    <option>Best of 3</option>
                    <option>Best of 5</option>
                  </select>
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 