import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { companyService } from '@services/company.service';
import Card from '@components/common/Card';
import Table from '@components/common/Table';
import Badge from '@components/common/Badge';
import Button from '@components/common/Button';
import Modal from '@components/common/Modal';
import Input from '@components/common/Input';
import LogoSys from '@components/LogoSys';
import Footer from '@components/Footer';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const CompanyRoles = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const { data: roles, isLoading: rolesLoading } = useQuery(
    'company-roles',
    () => companyService.getRoles()
  );

  const { data: permissions } = useQuery(
    'permissions',
    () => companyService.getPermissions()
  );

  // ✅ Extraction correcte des données selon la structure Axios
  const rolesList = roles?.data?.data || [];
  const permissionsList = permissions?.data?.data || [];

  const createMutation = useMutation(
    (data) => companyService.createRole(data),
    {
      onSuccess: () => {
        toast.success('Rôle créé avec succès');
        setShowModal(false);
        reset();
        setSelectedPermissions([]);
        queryClient.invalidateQueries('company-roles');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => companyService.updateRole(id, data),
    {
      onSuccess: () => {
        toast.success('Rôle mis à jour');
        setShowModal(false);
        setEditingRole(null);
        reset();
        setSelectedPermissions([]);
        queryClient.invalidateQueries('company-roles');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => companyService.deleteRole(id),
    {
      onSuccess: () => {
        toast.success('Rôle supprimé');
        queryClient.invalidateQueries('company-roles');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  );

  const handleEdit = (role) => {
    setEditingRole(role);
    setValue('roleName', role.roleName);
    setValue('description', role.description);
    setSelectedPermissions(role.permissions?.map(p => p.id) || []);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const onSubmit = (data) => {
    const payload = {
      ...data,
      permissions: selectedPermissions
    };

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      key: 'roleName',
      title: 'Rôle',
      render: (row) => (
        <div className="flex items-center">
          <ShieldCheckIcon className="w-5 h-5 text-blue-500 mr-3" />
          <div>
            <p className="font-medium">{row.roleName}</p>
            <p className="text-sm text-gray-500">{row.description || '-'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'permissions',
      title: 'Permissions',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions?.slice(0, 3).map((p, i) => (
            <Badge key={i} size="sm" variant="secondary">{p.permissionName || p.name}</Badge>
          ))}
          {row.permissions?.length > 3 && (
            <Badge size="sm" variant="gray">+{row.permissions.length - 3}</Badge>
          )}
          {(!row.permissions || row.permissions.length === 0) && (
            <span className="text-sm text-gray-400">Aucune</span>
          )}
        </div>
      )
    },
    {
      key: 'usersCount',
      title: 'Utilisateurs',
      render: (row) => row.usersCount || 0
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(row)} className="p-1 hover:bg-gray-100 rounded" title="Modifier">
            <PencilIcon className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="p-1 hover:bg-gray-100 rounded" title="Supprimer">
            <TrashIcon className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )
    }
  ];

  // Regrouper les permissions par module
  const permissionsByModule = permissionsList.reduce((acc, permission) => {
    const module = permission.module?.moduleName || 'Autres';
    if (!acc[module]) acc[module] = [];
    acc[module].push(permission);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rôles et permissions</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gérez les rôles et les permissions des utilisateurs
                </p>
              </div>
            </div>
            <Button onClick={() => {
              setEditingRole(null);
              reset();
              setSelectedPermissions([]);
              setShowModal(true);
            }}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouveau rôle
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <Card>
          <Table
            columns={columns}
            data={rolesList}
            loading={rolesLoading}
            emptyMessage="Aucun rôle créé"
          />
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingRole(null);
          reset();
          setSelectedPermissions([]);
        }}
        title={editingRole ? 'Modifier le rôle' : 'Nouveau rôle'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom du rôle"
            {...register('roleName', { required: 'Nom requis' })}
            error={errors.roleName?.message}
          />
          
          <div>
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              className="input"
              rows={2}
              placeholder="Description du rôle..."
            />
          </div>

          <div>
            <label className="label">Permissions</label>
            <div className="border rounded-lg p-3 max-h-80 overflow-y-auto">
              {Object.keys(permissionsByModule).length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune permission disponible</p>
              ) : (
                Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="mb-4 last:mb-0">
                    <h4 className="font-medium text-gray-900 mb-2">{module}</h4>
                    <div className="space-y-2">
                      {perms.map(permission => (
                        <label key={permission.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">{permission.permissionName || permission.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => {
              setShowModal(false);
              setEditingRole(null);
              reset();
              setSelectedPermissions([]);
            }}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingRole ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
};

export default CompanyRoles;