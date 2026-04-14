// frontend/src/components/company/PositionTasksManager.jsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { positionTaskService } from '@services/positionTask.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Modal from '@components/common/Modal';
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import Badge from '@components/common/Badge';
import { PlusIcon, TrashIcon, PencilIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const PositionTasksManager = ({ positionId, positionTitle, companyId }) => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const { data: tasks, isLoading } = useQuery(
    ['position-tasks', positionId],
    () => positionTaskService.getPositionTasks(positionId)
  );
  
  const { data: templates } = useQuery(
    'task-templates',
    () => positionTaskService.getTaskTemplates()
  );
  
  const createMutation = useMutation(
    (data) => positionTaskService.createPositionTask({ ...data, jobPositionId: positionId }),
    {
      onSuccess: () => {
        toast.success('Tâche ajoutée avec succès');
        setShowModal(false);
        queryClient.invalidateQueries(['position-tasks', positionId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout');
      }
    }
  );
  
  const updateMutation = useMutation(
    ({ id, data }) => positionTaskService.updatePositionTask(id, data),
    {
      onSuccess: () => {
        toast.success('Tâche mise à jour');
        setShowModal(false);
        setEditingTask(null);
        queryClient.invalidateQueries(['position-tasks', positionId]);
      }
    }
  );
  
  const deleteMutation = useMutation(
    (id) => positionTaskService.deletePositionTask(id),
    {
      onSuccess: () => {
        toast.success('Tâche supprimée');
        queryClient.invalidateQueries(['position-tasks', positionId]);
      }
    }
  );
  
  const generateMutation = useMutation(
    (userId) => positionTaskService.generateUserTasks(userId),
    {
      onSuccess: (data) => {
        toast.success(`${data.data.taskCount} tâche(s) générée(s)`);
      }
    }
  );
  
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  
  const handleEdit = (task) => {
    setEditingTask(task);
    setValue('taskName', task.taskName);
    setValue('taskDescription', task.taskDescription);
    setValue('moduleCode', task.moduleCode);
    setValue('frequency', task.frequency);
    setValue('priority', task.priority);
    setValue('estimatedDurationMinutes', task.estimatedDurationMinutes);
    setValue('requiresApproval', task.requiresApproval);
    setShowModal(true);
  };
  
  const onSubmit = (data) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data });
    } else {
      createMutation.mutate(data);
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    reset();
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      deleteMutation.mutate(id);
    }
  };
  
  const handleTemplateSelect = (templateId) => {
    const template = templates?.data?.find(t => t.id === templateId);
    if (template) {
      setValue('taskName', template.templateName);
      setValue('taskDescription', template.description);
      setValue('priority', template.defaultPriority);
      setValue('estimatedDurationMinutes', template.estimatedDurationMinutes);
    }
  };
  
  const frequencyOptions = [
    { value: 'once', label: 'Une fois' },
    { value: 'daily', label: 'Quotidienne' },
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuelle' },
    { value: 'quarterly', label: 'Trimestrielle' },
    { value: 'yearly', label: 'Annuelle' }
  ];
  
  const priorityOptions = [
    { value: 'LOW', label: 'Basse' },
    { value: 'MEDIUM', label: 'Moyenne' },
    { value: 'HIGH', label: 'Haute' },
    { value: 'URGENT', label: 'Urgente' }
  ];
  
  const moduleOptions = [
    { value: 'accounting', label: 'Comptabilité' },
    { value: 'logistics', label: 'Logistique' },
    { value: 'messaging', label: 'Messagerie' },
    { value: 'meeting', label: 'Réunions' },
    { value: 'document', label: 'Documents' }
  ];
  
  return (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            Tâches automatiques du poste
          </h3>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <PlusIcon className="w-4 h-4 mr-1" />
            Ajouter une tâche
          </Button>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : tasks?.data?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucune tâche automatique définie pour ce poste
          </p>
        ) : (
          <div className="space-y-2">
            {tasks?.data?.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium">{task.taskName}</span>
                    <Badge size="sm">{task.moduleCode}</Badge>
                    <Badge variant={task.priority === 'URGENT' ? 'danger' : 'info'} size="sm">
                      {task.frequency}
                    </Badge>
                  </div>
                  {task.taskDescription && (
                    <p className="text-sm text-gray-500">{task.taskDescription}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Modifier"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingTask ? 'Modifier la tâche' : 'Nouvelle tâche automatique'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Modèle de tâche (optionnel)</label>
            <Select
              options={templates?.data?.map(t => ({ value: t.id, label: t.templateName })) || []}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              placeholder="Sélectionner un modèle..."
            />
          </div>
          
          <Input
            label="Nom de la tâche"
            {...register('taskName', { required: 'Nom requis' })}
            placeholder="Ex: Saisie des écritures comptables"
          />
          
          <div>
            <label className="label">Description</label>
            <textarea
              {...register('taskDescription')}
              className="input w-full"
              rows={3}
              placeholder="Description de la tâche..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Module"
              {...register('moduleCode', { required: 'Module requis' })}
              options={moduleOptions}
            />
            
            <Select
              label="Fréquence"
              {...register('frequency', { required: 'Fréquence requise' })}
              options={frequencyOptions}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priorité"
              {...register('priority')}
              options={priorityOptions}
            />
            
            <Input
              label="Durée estimée (minutes)"
              type="number"
              {...register('estimatedDurationMinutes')}
            />
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('requiresApproval')}
                className="rounded"
              />
              <span className="ml-2 text-sm">Nécessite une approbation</span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingTask ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};

export default PositionTasksManager;