import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '@store/auth.store';
import { companyService } from '@services/company.service';
import { userService } from '@services/user.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import Modal from '@components/common/Modal';
import Input from '@components/common/Input';
import Select from '@components/common/Select';
import Pagination from '@components/common/Pagination';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { formatDate } from '@utils/formatters';
import toast from 'react-hot-toast';

const CompanyUsers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Ne pas exécuter la requête si pas de companyId (admin système)
  const companyId = user?.companyId;
  const isSystemAdmin = user?.isSystemAdmin;

  const { data, isLoading } = useQuery(
    ['company-users', companyId, { page, limit, search, status }],
    () => companyService.getCompanyUsers(companyId, { page, limit, search, status }),
    {
      enabled: !!companyId && !isSystemAdmin
    }
  );

  const { data: roles } = useQuery(
    'company-roles',
    () => companyService.getRoles(),
    {
      enabled: !!companyId && !isSystemAdmin
    }
  );

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const createMutation = useMutation(
    (data) => userService.createUser({ ...data, companyId }),
    {
      onSuccess: (response) => {
        toast.success('Utilisateur créé avec succès');
        if (response.data.data.temporaryPassword) {
          toast.success(`Mot de passe temporaire: ${response.data.data.temporaryPassword}`);
        }
        setShowModal(false);
        reset();
        queryClient.invalidateQueries(['company-users', companyId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const resetPasswordMutation = useMutation(
    (userId) => userService.resetPassword(userId),
    {
      onSuccess: (response) => {
        toast.success(`Mot de passe réinitialisé: ${response.data.data.temporaryPassword}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
      }
    }
  );

  const deleteMutation = useMutation(
    (userId) => userService.deleteUser(userId),
    {
      onSuccess: () => {
        toast.success('Utilisateur supprimé');
        queryClient.invalidateQueries(['company-users', companyId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  );

  const handleEdit = (editUser) => {
    setEditingUser(editUser);
    setValue('firstName', editUser.firstName);
    setValue('lastName', editUser.lastName);
    setValue('email', editUser.email);
    setValue('phoneNumber', editUser.phoneNumber);
    setValue('jobPositionId', editUser.jobPositionId);
    setValue('roles', editUser.roles?.map(r => r.id) || []);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleResetPassword = (id) => {
    if (window.confirm('Réinitialiser le mot de passe de cet utilisateur ?')) {
      resetPasswordMutation.mutate(id);
    }
  };

  const onSubmit = (data) => {
    if (editingUser) {
      // Update logic - à implémenter
      toast.success('Utilisateur mis à jour');
      setShowModal(false);
      reset();
      queryClient.invalidateQueries(['company-users', companyId]);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    reset();
  };

  const columns = [
    {
      key: 'user',
      title: 'Utilisateur',
      render: (row) => (
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <UserCircleIcon className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <p className="font-medium">{row.fullName}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'jobPosition',
      title: 'Poste',
      render: (row) => row.jobPosition?.title || '-'
    },
    {
      key: 'roles',
      title: 'Rôles',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.map(r => (
            <Badge key={r.id} variant="info" size="sm">{r.roleName}</Badge>
          ))}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => {
        const statuses = {
          ACTIVE: { label: 'Actif', color: 'success' },
          INACTIVE: { label: 'Inactif', color: 'gray' },
          PENDING_ACTIVATION: { label: 'En attente', color: 'warning' }
        };
        const s = statuses[row.status] || { label: row.status, color: 'gray' };
        return <Badge variant={s.color}>{s.label}</Badge>;
      }
    },
    {
      key: 'lastLoginAt',
      title: 'Dernière connexion',
      render: (row) => row.lastLoginAt ? formatDate(row.lastLoginAt) : '-'
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(row)} className="p-1 hover:bg-gray-100 rounded" title="Modifier">
            <PencilIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => handleResetPassword(row.id)} className="p-1 hover:bg-gray-100 rounded" title="Réinitialiser MDP">
            <KeyIcon className="w-4 h-4 text-orange-600" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1 hover:bg-gray-100 rounded" title="Supprimer">
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )
    }
  ];

  // Si admin système, afficher un message
  if (isSystemAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center space-x-4">
            <LogoSys size="small" />
            <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          </div>
        </div>
        <div className="p-6">
          <Card>
            <p className="text-center py-12 text-gray-500">
              En tant qu'administrateur système, gérez les utilisateurs depuis la section "Administration → Utilisateurs".
            </p>
            <div className="flex justify-center">
              <Button onClick={() => navigate('/admin/users')}>
                Aller à la gestion des utilisateurs
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gérez les utilisateurs de votre entreprise
                </p>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Card>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input w-40"
              >
                <option value="">Tous</option>
                <option value="ACTIVE">Actifs</option>
                <option value="INACTIVE">Inactifs</option>
                <option value="PENDING_ACTIVATION">En attente</option>
              </select>
            </div>
          </div>

          <Table
            columns={columns}
            data={users}
            loading={isLoading}
            emptyMessage="Aucun utilisateur trouvé"
          />

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              {...register('firstName', { required: 'Prénom requis' })}
              error={errors.firstName?.message}
            />
            <Input
              label="Nom"
              {...register('lastName', { required: 'Nom requis' })}
              error={errors.lastName?.message}
            />
          </div>
          <Input
            label="Email"
            type="email"
            {...register('email', { required: 'Email requis' })}
            error={errors.email?.message}
          />
          <Input
            label="Téléphone"
            {...register('phoneNumber')}
          />
          <Select
            label="Poste"
            {...register('jobPositionId')}
            options={[]}
          />
          <div>
            <label className="label">Rôles</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {roles?.data?.map((role) => (
                <label key={role.id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={role.id}
                    {...register('roles')}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm">{role.roleName}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isCompanyAdmin')}
                className="rounded"
              />
              <span className="ml-2">Administrateur de l'entreprise</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading}>
              {editingUser ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
};

export default CompanyUsers;