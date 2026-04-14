import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { logisticService } from '@services/logistic.service';
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
  BuildingOfficeIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const Warehouses = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: warehouses, isLoading } = useQuery(
    'warehouses',
    () => logisticService.getWarehouses()
  );

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const createMutation = useMutation(
    (data) => logisticService.createWarehouse(data),
    {
      onSuccess: () => {
        toast.success('Entrepôt créé avec succès');
        setShowModal(false);
        reset();
        queryClient.invalidateQueries('warehouses');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => logisticService.updateWarehouse(id, data),
    {
      onSuccess: () => {
        toast.success('Entrepôt mis à jour');
        setShowModal(false);
        setEditingWarehouse(null);
        reset();
        queryClient.invalidateQueries('warehouses');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => logisticService.deleteWarehouse(id),
    {
      onSuccess: () => {
        toast.success('Entrepôt supprimé');
        queryClient.invalidateQueries('warehouses');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  );

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setValue('warehouseName', warehouse.warehouseName);
    setValue('warehouseType', warehouse.warehouseType);
    setValue('address', warehouse.address);
    setValue('city', warehouse.city);
    setValue('postalCode', warehouse.postalCode);
    setValue('countryId', warehouse.countryId);
    setValue('contactPerson', warehouse.contactPerson);
    setValue('contactPhone', warehouse.contactPhone);
    setValue('contactEmail', warehouse.contactEmail);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet entrepôt ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewDetails = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDetails(true);
  };

  const onSubmit = (data) => {
    if (editingWarehouse) {
      updateMutation.mutate({ id: editingWarehouse.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    {
      key: 'name',
      title: 'Entrepôt',
      render: (row) => (
        <div className="flex items-center">
          <BuildingOfficeIcon className="w-5 h-5 text-blue-500 mr-3" />
          <div>
            <p className="font-medium">{row.warehouseName}</p>
            <p className="text-sm text-gray-500">{row.warehouseCode}</p>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      render: (row) => {
        const types = {
          MAIN: 'Principal',
          DISTRIBUTION: 'Distribution',
          TEMPORARY: 'Temporaire',
          TRANSIT: 'Transit'
        };
        return types[row.warehouseType] || row.warehouseType;
      }
    },
    {
      key: 'location',
      title: 'Emplacement',
      render: (row) => (
        <div className="flex items-center">
          <MapPinIcon className="w-4 h-4 text-gray-400 mr-1" />
          <span>{row.city}, {row.country?.name}</span>
        </div>
      )
    },
    {
      key: 'contact',
      title: 'Contact',
      render: (row) => row.contactPerson || '-'
    },
    {
      key: 'status',
      title: 'Statut',
      render: (row) => (
        <Badge variant={row.isActive ? 'success' : 'gray'}>
          {row.isActive ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button onClick={() => handleViewDetails(row)} className="p-1 hover:bg-gray-100 rounded" title="Voir">
            <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
          </button>
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

  // ✅ Extraction correcte des données
  const warehousesData = warehouses?.data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LogoSys size="small" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Entrepôts</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Gestion des entrepôts et sites de stockage
                </p>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nouvel entrepôt
            </Button>
          </div>
        </div>
      </div>

      <div className="page-container">
        <Card>
          <Table
            columns={columns}
            data={warehousesData}
            loading={isLoading}
            emptyMessage="Aucun entrepôt créé"
          />
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingWarehouse(null);
          reset();
        }}
        title={editingWarehouse ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom de l'entrepôt"
            {...register('warehouseName', { required: 'Nom requis' })}
            error={errors.warehouseName?.message}
          />
          <div>
            <label className="label">Type d'entrepôt</label>
            <select {...register('warehouseType')} className="input">
              <option value="MAIN">Principal</option>
              <option value="DISTRIBUTION">Distribution</option>
              <option value="TEMPORARY">Temporaire</option>
              <option value="TRANSIT">Transit</option>
            </select>
          </div>
          <Input
            label="Adresse"
            {...register('address', { required: 'Adresse requise' })}
            error={errors.address?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Ville" {...register('city')} />
            <Input label="Code postal" {...register('postalCode')} />
          </div>
          <Input label="Pays" {...register('countryId')} />
          
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Contact</h3>
            <Input label="Personne de contact" {...register('contactPerson')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Téléphone" {...register('contactPhone')} />
              <Input label="Email" type="email" {...register('contactEmail')} />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
              {editingWarehouse ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false);
          setSelectedWarehouse(null);
        }}
        title={`Détails de l'entrepôt`}
      >
        {selectedWarehouse && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{selectedWarehouse.warehouseName}</h3>
              <p className="text-sm text-gray-500 mb-3">Code: {selectedWarehouse.warehouseCode}</p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{selectedWarehouse.address}, {selectedWarehouse.city} {selectedWarehouse.postalCode}</span>
                </div>
                {selectedWarehouse.contactPerson && (
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{selectedWarehouse.contactPerson}</span>
                  </div>
                )}
                {selectedWarehouse.contactPhone && (
                  <div className="flex items-center">
                    <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{selectedWarehouse.contactPhone}</span>
                  </div>
                )}
                {selectedWarehouse.contactEmail && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{selectedWarehouse.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Capacité</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-lg font-bold">{selectedWarehouse.capacityCubicMeters || '-'}</p>
                  <p className="text-xs text-gray-500">m³</p>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-lg font-bold">{selectedWarehouse.capacityPallets || '-'}</p>
                  <p className="text-xs text-gray-500">Palettes</p>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-lg font-bold">{selectedWarehouse.capacityUnits || '-'}</p>
                  <p className="text-xs text-gray-500">Unités</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
};

export default Warehouses;