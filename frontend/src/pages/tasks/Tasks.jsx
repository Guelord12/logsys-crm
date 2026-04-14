import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskService } from '@services/task.service';
import { useAuthStore } from '@store/auth.store';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Pagination from '@components/common/Pagination';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@utils/formatters';
import clsx from 'clsx';

const Tasks = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskService.getTasks({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      });
      setTasks(response.data.data.tasks);
      setPagination(prev => ({ ...prev, total: response.data.data.pagination.total }));
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await taskService.getTaskStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const columns = [
    {
      key: 'title',
      title: 'Titre',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">{row.description}</p>
        </div>
      )
    },
    {
      key: 'priority',
      title: 'Priorité',
      render: (row) => {
        const colors = { LOW: 'green', MEDIUM: 'yellow', HIGH: 'orange', URGENT: 'red' };
        return <Badge variant={colors[row.priority]}>{row.priority}</Badge>;
      }
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const colors = { PENDING: 'gray', IN_PROGRESS: 'blue', COMPLETED: 'green', CANCELLED: 'red' };
        return <Badge variant={colors[row.status]}>{row.status}</Badge>;
      }
    },
    {
      key: 'assignedTo',
      title: 'Assigné à',
      render: (row) => row.assignedToUser?.fullName || '-'
    },
    {
      key: 'dueDate',
      title: 'Échéance',
      render: (row) => (
        <span className={clsx(
          new Date(row.dueDate) < new Date() && row.status !== 'COMPLETED' && 'text-red-600 font-medium'
        )}>
          {formatDate(row.dueDate)}
        </span>
      )
    },
    {
      key: 'completionPercentage',
      title: 'Progression',
      render: (row) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${row.completionPercentage}%` }}
            />
          </div>
          <span className="text-sm">{row.completionPercentage}%</span>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tâches</h1>
          <p className="page-description">Gérez vos tâches et suivez leur progression</p>
        </div>
        <Button onClick={() => navigate('/tasks/new')}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">En cours</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.byStatus?.find(s => s.status === 'IN_PROGRESS')?.count || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">En retard</p>
            <p className="text-2xl font-bold text-red-600">{stats.overdue || 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Terminées cette semaine</p>
            <p className="text-2xl font-bold text-green-600">{stats.completedThisWeek || 0}</p>
          </Card>
        </div>
      )}

      <Card>
        <div className="p-4 border-b border-gray-200 flex items-center space-x-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input w-40"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="input w-40"
          >
            <option value="">Toutes les priorités</option>
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="URGENT">Urgente</option>
          </select>
          <Button variant="secondary" onClick={fetchTasks}>
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filtrer
          </Button>
        </div>

        <Table
          columns={columns}
          data={tasks}
          loading={loading}
          onRowClick={(row) => navigate(`/tasks/${row.id}`)}
          emptyMessage="Aucune tâche trouvée"
        />

        {pagination.total > pagination.limit && (
          <div className="p-4 border-t border-gray-200">
            <Pagination
              currentPage={pagination.page}
              totalPages={Math.ceil(pagination.total / pagination.limit)}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(page) => setPagination({ ...pagination, page })}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Tasks;