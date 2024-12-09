import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { 
  Trophy, Calendar, Users, Settings, Play, Pause, 
  AlertTriangle, CheckCircle, XCircle, Edit, Trash 
} from 'lucide-react';
import { useTournament } from '@/contexts/TournamentContext';
import { formatDate } from '@/utils/date';
import { Tournament, CreateTournamentDTO } from '@/types/tournament';

interface TournamentFormProps {
  tournament?: Tournament;
  onClose: () => void;
  onSubmit: (data: CreateTournamentDTO) => void;
}

export function TournamentManager() {
  const { state, createTournament, updateTournament, deleteTournament } = useTournament();
  const { t } = useTranslation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);

  const handleStatusChange = (tournamentId: string, newStatus: string) => {
    updateTournament(tournamentId, { status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { color: 'warning', icon: AlertTriangle },
      'active': { color: 'success', icon: Play },
      'paused': { color: 'secondary', icon: Pause },
      'completed': { color: 'primary', icon: CheckCircle },
      'cancelled': { color: 'danger', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.color} className="flex items-center space-x-1">
        <Icon className="w-4 h-4" />
        <span>{t(`tournament.status.${status}`)}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('admin.tournament_management')}</h2>
        <Button
          variant="primary"
          onClick={() => setShowCreateForm(true)}
        >
          {t('admin.create_tournament')}
        </Button>
      </div>

      {/* Tournament List */}
      <div className="space-y-4">
        {state.tournaments?.map(tournament => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{tournament.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {tournament.description}
                </p>
              </div>
              {getStatusBadge(tournament.status)}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(tournament.start_date)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4" />
                <span>
                  {tournament.tournament_participants?.length || 0}/
                  {tournament.max_participants}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Trophy className="w-4 h-4" />
                <span>{tournament.prize_pool} {t('common.points')}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTournament(tournament)}
              >
                <Settings className="w-4 h-4 mr-1" />
                {t('admin.manage')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange(tournament.id, 'active')}
                disabled={tournament.status === 'active'}
              >
                <Play className="w-4 h-4 mr-1" />
                {t('admin.start')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange(tournament.id, 'paused')}
                disabled={tournament.status === 'paused'}
              >
                <Pause className="w-4 h-4 mr-1" />
                {t('admin.pause')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (window.confirm(t('admin.confirm_delete_tournament'))) {
                    deleteTournament(tournament.id);
                  }
                }}
              >
                <Trash className="w-4 h-4 mr-1" />
                {t('admin.delete')}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {(showCreateForm || selectedTournament) && (
        <TournamentForm
          tournament={selectedTournament}
          onClose={() => {
            setShowCreateForm(false);
            setSelectedTournament(null);
          }}
          onSubmit={(data) => {
            if (selectedTournament) {
              updateTournament(selectedTournament.id, data);
            } else {
              createTournament(data);
            }
            setShowCreateForm(false);
            setSelectedTournament(null);
          }}
        />
      )}
    </div>
  );
}

function TournamentForm({ tournament, onClose, onSubmit }: TournamentFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(tournament || {
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    max_participants: 8,
    prize_pool: 1000,
    rules: []
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4"
      >
        <h3 className="text-xl font-bold mb-4">
          {tournament ? t('admin.edit_tournament') : t('admin.create_tournament')}
        </h3>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('tournament.title')}
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('tournament.description')}
            </label>
            <textarea
              className="w-full rounded-lg border dark:bg-gray-700"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('tournament.start_date')}
              </label>
              <Input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('tournament.end_date')}
              </label>
              <Input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('tournament.max_participants')}
              </label>
              <Input
                type="number"
                min="4"
                max="32"
                step="4"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('tournament.prize_pool')}
              </label>
              <Input
                type="number"
                min="100"
                step="100"
                value={formData.prize_pool}
                onChange={(e) => setFormData({ ...formData, prize_pool: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {tournament ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
} 