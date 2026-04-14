import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { taskService } from '@services/task.service';
import { userService } from '@services/user.service';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NewTask = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taskTypeId: '',
    assignedTo: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    estimatedHours: '',
    priority: 'MEDIUM',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const { data: users } = useQuery('users', () => userService.getUsers());
  const usersList = users?.data?.data?.users || users?.data?.data || [];

  const createMutation = useMutation(
    (data) => taskService.createTask(data),
    {
      onSuccess: () => {
        toast.success('Tâche créée avec succès');
        navigate('/tasks');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Le titre est requis');
      return;
    }
    
    createMutation.mutate(formData);
  };

  const priorities = [
    { value: 'LOW', label: 'Basse' },
    { value: 'MEDIUM', label: 'Moyenne' },
    { value: 'HIGH', label: 'Haute' },
    { value: 'URGENT', label: 'Urgente' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nouvelle tâche</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Créer une nouvelle tâche
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate('/tasks')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <div className="space-y-4">
              <div>
                <label className="label">Titre *</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Titre de la tâche"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input"
                  rows={4}
                  placeholder="Description détaillée..."
                />
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Détails</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Assigner à</label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {usersList.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Priorité</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="input"
                >
                  {priorities.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Date de début</label>
                <Input
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Date d'échéance</label>
                <Input
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="label">Temps estimé (heures)</label>
                <Input
                  name="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  placeholder="Ex: 2.5"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>
            <div className="flex space-x-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ajouter un tag"
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, i) => (
                <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </Card>

          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" onClick={() => navigate('/tasks')}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              Créer la tâche
            </Button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default NewTask;