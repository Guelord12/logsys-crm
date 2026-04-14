import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { meetingService } from '@services/meeting.service';
import Modal from '@components/common/Modal';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import { UserGroupIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const schema = yup.object({
  title: yup.string().required('Titre requis').min(3),
  description: yup.string(),
  startTime: yup.string().required('Date de début requise'),
  endTime: yup.string().required('Date de fin requise'),
  meetingType: yup.string().default('VIDEO'),
  timezone: yup.string().default('UTC')
});

const MeetingScheduler = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([{ email: '', name: '' }]);
  const [settings, setSettings] = useState({
    enableWaitingRoom: true,
    allowChat: true,
    allowRecording: false,
    muteParticipantsOnEntry: true
  });

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      meetingType: 'VIDEO',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  const startTime = watch('startTime');

  const addParticipant = () => {
    setParticipants([...participants, { email: '', name: '' }]);
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const validParticipants = participants.filter(p => p.email.trim());
      
      await meetingService.createMeeting({
        ...data,
        participants: validParticipants,
        settings
      });

      toast.success('Réunion créée avec succès');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la création de la réunion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Planifier une réunion" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Titre"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Titre de la réunion"
        />

        <Input
          label="Description (optionnel)"
          {...register('description')}
          as="textarea"
          rows={2}
          placeholder="Description de la réunion"
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date et heure de début"
            type="datetime-local"
            {...register('startTime')}
            error={errors.startTime?.message}
            min={new Date().toISOString().slice(0, 16)}
          />
          <Input
            label="Date et heure de fin"
            type="datetime-local"
            {...register('endTime')}
            error={errors.endTime?.message}
            min={startTime || new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Type de réunion"
            {...register('meetingType')}
            options={[
              { value: 'VIDEO', label: 'Visioconférence' },
              { value: 'AUDIO', label: 'Audio' },
              { value: 'WEBINAR', label: 'Webinaire' },
              { value: 'IN_PERSON', label: 'Présentiel' }
            ]}
          />
          <Select
            label="Fuseau horaire"
            {...register('timezone')}
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'Europe/Paris', label: 'Europe/Paris' },
              { value: 'Europe/London', label: 'Europe/London' },
              { value: 'America/New_York', label: 'America/New_York' }
            ]}
          />
        </div>

        <div>
          <label className="label flex items-center justify-between">
            <span>Participants</span>
            <button type="button" onClick={addParticipant} className="text-sm text-blue-600 hover:text-blue-700">
              <PlusIcon className="w-4 h-4 inline mr-1" />
              Ajouter
            </button>
          </label>
          <div className="space-y-2">
            {participants.map((p, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Email"
                  value={p.email}
                  onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                  className="flex-1"
                  type="email"
                />
                <Input
                  placeholder="Nom (optionnel)"
                  value={p.name}
                  onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                  className="w-40"
                />
                {participants.length > 1 && (
                  <button type="button" onClick={() => removeParticipant(index)} className="p-2 text-gray-400 hover:text-red-500">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Paramètres de la réunion</label>
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enableWaitingRoom}
                onChange={(e) => setSettings({ ...settings, enableWaitingRoom: e.target.checked })}
                className="rounded"
              />
              <span className="ml-2 text-sm">Activer la salle d'attente</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowChat}
                onChange={(e) => setSettings({ ...settings, allowChat: e.target.checked })}
                className="rounded"
              />
              <span className="ml-2 text-sm">Autoriser le chat</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.allowRecording}
                onChange={(e) => setSettings({ ...settings, allowRecording: e.target.checked })}
                className="rounded"
              />
              <span className="ml-2 text-sm">Autoriser l'enregistrement</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.muteParticipantsOnEntry}
                onChange={(e) => setSettings({ ...settings, muteParticipantsOnEntry: e.target.checked })}
                className="rounded"
              />
              <span className="ml-2 text-sm">Couper les micros à l'entrée</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            Créer la réunion
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MeetingScheduler;