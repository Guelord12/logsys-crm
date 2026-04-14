import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '@services/task.service';
import { useAuthStore } from '@store/auth.store';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Badge from '@components/common/Badge';
import Loader from '@components/common/Loader';
import { formatDate, formatDuration } from '@utils/formatters';
import { CheckCircleIcon, ClockIcon, PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // ✅ Vérifier que l'ID existe avant de charger
    if (id) {
      fetchTask();
      fetchComments();
    } else {
      toast.error('Tâche non trouvée');
      navigate('/tasks');
    }
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await taskService.getTask(id);
      setTask(response.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de la tâche');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await taskService.getComments(id);
      setComments(response.data.data);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await taskService.updateStatus(id, newStatus);
      setTask({ ...task, status: newStatus });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await taskService.addComment(id, comment);
      setComment('');
      fetchComments();
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    
    try {
      await taskService.deleteTask(id);
      toast.success('Tâche supprimée');
      navigate('/tasks');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <Loader size="lg" className="py-12" />;
  if (!task) return null;

  const priorityColors = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'orange',
    URGENT: 'red'
  };

  const statusColors = {
    PENDING: 'gray',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'red',
    ON_HOLD: 'orange'
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      <div className="page-header flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
            <Badge variant={statusColors[task.status]}>{task.status}</Badge>
            {task.completionPercentage > 0 && (
              <span className="text-sm text-gray-500">{task.completionPercentage}% complété</span>
            )}
          </div>
          <h1 className="page-title">{task.title}</h1>
          <p className="page-description">{task.description}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/tasks/${id}/edit`)}>
            <PencilIcon className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <TrashIcon className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card title="Progression">
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Avancement</span>
                <span>{task.completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${task.completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="flex space-x-2">
              {task.status !== 'COMPLETED' && (
                <Button variant="success" size="sm" onClick={() => handleStatusChange('COMPLETED')}>
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  Marquer comme terminé
                </Button>
              )}
              {task.status === 'PENDING' && (
                <Button variant="primary" size="sm" onClick={() => handleStatusChange('IN_PROGRESS')}>
                  <ClockIcon className="w-4 h-4 mr-1" />
                  Démarrer
                </Button>
              )}
            </div>
          </Card>

          <Card title="Commentaires">
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun commentaire</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserCircleIcon className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm font-medium">{c.user?.fullName}</p>
                        <p className="text-sm">{c.commentText}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(c.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex space-x-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="input flex-1"
              />
              <Button type="submit" loading={submitting} disabled={!comment.trim()}>
                Envoyer
              </Button>
            </form>
          </Card>

          {task.subtasks?.length > 0 && (
            <Card title="Sous-tâches">
              <div className="space-y-2">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={sub.status === 'COMPLETED'}
                        onChange={() => taskService.updateStatus(sub.id, sub.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED')}
                        className="rounded"
                      />
                      <span className={clsx(sub.status === 'COMPLETED' && 'line-through text-gray-400')}>
                        {sub.title}
                      </span>
                    </div>
                    <Badge size="sm">{sub.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Détails">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Assigné à</dt>
                <dd className="font-medium flex items-center">
                  <UserCircleIcon className="w-4 h-4 mr-1" />
                  {task.assignedToUser?.fullName || 'Non assigné'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Assigné par</dt>
                <dd className="font-medium">{task.assignedByUser?.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Type</dt>
                <dd className="font-medium">{task.taskType?.name || 'Tâche'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Date de début</dt>
                <dd className="font-medium">{formatDate(task.startDate)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Échéance</dt>
                <dd className={clsx(
                  'font-medium',
                  new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' && 'text-red-600'
                )}>
                  {formatDate(task.dueDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Temps estimé</dt>
                <dd className="font-medium">{formatDuration(task.estimatedHours * 60)}</dd>
              </div>
              {task.actualHours > 0 && (
                <div>
                  <dt className="text-sm text-gray-500">Temps passé</dt>
                  <dd className="font-medium">{formatDuration(task.actualHours * 60)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Créée le</dt>
                <dd className="font-medium">{formatDate(task.createdAt)}</dd>
              </div>
            </dl>
          </Card>

          {task.tags?.length > 0 && (
            <Card title="Tags">
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;